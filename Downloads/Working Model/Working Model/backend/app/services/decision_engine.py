from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Any
import re
from app.core.config import settings
from app.services.currency_catalog import normalize_currency


def clamp01(x: float) -> float:
    return float(max(0.0, min(1.0, x)))


def verdict_from_risk(risk: float) -> str:
    if risk >= settings.risk_counterfeit_threshold:
        return "likely_counterfeit"
    if risk >= settings.risk_suspicious_threshold:
        return "suspicious"
    return "likely_genuine"


def public_label(verdict: str) -> str:
    return {
        "likely_counterfeit": "Likely Counterfeit",
        "suspicious": "Suspicious / Needs Manual Check",
        "likely_genuine": "Likely Genuine",
        "unreliable_image": "Image Not Reliable Enough",
    }.get(verdict, verdict)


def normalize_denomination(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip().lower()
    if not text:
        return None
    nums = re.findall(r"\d+", text)
    if nums:
        return nums[0]
    aliases = {
        "one": "1", "two": "2", "five": "5", "ten": "10", "twenty": "20",
        "fifty": "50", "hundred": "100", "two hundred": "200", "five hundred": "500",
        "thousand": "1000", "two thousand": "2000",
    }
    for k, v in aliases.items():
        if k in text:
            return v
    return text.upper()


@dataclass
class QualityGate:
    status: str
    reliable: bool
    score: float
    blocking: bool
    issues: list[str]
    recommendations: list[str]


def build_quality_gate(quality: Any) -> QualityGate:
    score = float(getattr(quality, "quality_score", 0.0))
    warnings = list(getattr(quality, "warnings", []) or [])
    issues: list[str] = []
    recommendations: list[str] = []

    if score < settings.quality_fail_threshold:
        issues.append("Overall image quality is too low for a reliable authenticity decision.")
        recommendations.append("Retake the image flat on a table with the full note visible and no flash glare.")
    elif score < settings.quality_warn_threshold:
        issues.append("Image quality is acceptable but may reduce prediction confidence.")
        recommendations.append("For a stronger result, upload a sharper and brighter image of the full note.")

    issues.extend(warnings)

    if getattr(quality, "sharpness", 9999) < settings.min_sharpness:
        recommendations.append("Improve focus or move the camera farther away, then crop the full note.")
    if getattr(quality, "brightness", 128) < settings.min_brightness:
        recommendations.append("Use brighter light; avoid shadows on the note.")
    if getattr(quality, "brightness", 128) > settings.max_brightness:
        recommendations.append("Avoid flash glare or direct light reflection.")
    if getattr(quality, "width", 9999) < settings.min_image_width or getattr(quality, "height", 9999) < settings.min_image_height:
        recommendations.append("Upload a higher-resolution image.")

    # Do not hard-block borderline photos by default; mark reliability instead.
    blocking = bool(score < settings.quality_hard_block_threshold)
    status = "fail" if blocking else ("warn" if score < settings.quality_warn_threshold or issues else "pass")
    return QualityGate(
        status=status,
        reliable=not blocking and score >= settings.quality_fail_threshold,
        score=round(clamp01(score), 4),
        blocking=blocking,
        issues=list(dict.fromkeys(issues)),
        recommendations=list(dict.fromkeys(recommendations)),
    )


def build_explanations(
    *,
    currency: str,
    risk: float,
    quality_gate: QualityGate,
    components: dict[str, float],
    model_outputs: dict[str, Any],
    signals: Any,
    mismatch: dict[str, Any] | None,
    fallback_used: bool,
) -> dict[str, Any]:
    reasons: list[str] = []
    positive: list[str] = []
    caution: list[str] = []

    verdict = verdict_from_risk(risk)
    if verdict == "likely_counterfeit":
        reasons.append("Combined authenticity risk is high across model and image-processing checks.")
    elif verdict == "suspicious":
        reasons.append("The note is not confidently genuine; manual inspection is recommended.")
    else:
        positive.append("Combined risk is low based on available model and image-processing checks.")

    if quality_gate.status == "fail":
        caution.append("Image quality is too poor for a reliable decision.")
    elif quality_gate.status == "warn":
        caution.append("Image quality may reduce confidence; retake image for best results.")
    else:
        positive.append("Image quality passed the reliability gate.")

    if components.get("ml_authenticity", 0) >= 0.70:
        reasons.append("Currency-specific ML model produced a high counterfeit probability.")
    elif 0 < components.get("ml_authenticity", 0) <= 0.30:
        positive.append("Currency-specific ML model leaned toward genuine.")

    if components.get("image_authenticity_analysis", 0) >= 0.65:
        reasons.append("Image-processing signals indicate unusual texture, geometry, lighting, or print complexity.")
    elif components.get("image_authenticity_analysis", 0) <= 0.35:
        positive.append("Texture, geometry, lighting, and print-complexity checks look healthy.")

    tex = float(getattr(signals, "texture_score", 0.0))
    comp = float(getattr(signals, "print_complexity_score", 0.0))
    geom = float(getattr(signals, "geometry_score", 0.0))
    light = float(getattr(signals, "lighting_score", 0.0))
    if tex < 0.35:
        reasons.append("Low texture variation: fine surface/print detail may be missing or blurred.")
    if comp < 0.35:
        reasons.append("Low print complexity: micro-patterns and edge detail appear weak.")
    if geom < 0.45:
        caution.append("Banknote shape/aspect ratio looks unusual; crop the full note correctly.")
    if light < 0.45:
        caution.append("Lighting is uneven or extreme, which can distort authenticity checks.")

    if mismatch and mismatch.get("mismatch"):
        reasons.append(mismatch.get("message", "Selected denomination/currency does not match model output."))

    # Top contributing risk components
    top_components = sorted(components.items(), key=lambda kv: abs(kv[1] - 0.5), reverse=True)[:5]

    return {
        "summary": reasons[:3] or positive[:2] or ["Analysis completed with available evidence."],
        "risk_factors": list(dict.fromkeys(reasons)),
        "supporting_factors": list(dict.fromkeys(positive)),
        "cautions": list(dict.fromkeys(caution)),
        "top_components": [{"name": k, "risk": round(float(v), 4)} for k, v in top_components],
        "model_outputs_used": list(model_outputs.keys()),
    }


def check_denomination_consistency(currency: str, selected: str | None, model_outputs: dict[str, Any]) -> dict[str, Any]:
    c = normalize_currency(currency)
    selected_norm = normalize_denomination(selected)
    result = {
        "checked": False,
        "mismatch": False,
        "selected_denomination": selected,
        "selected_normalized": selected_norm,
        "detected_denomination": None,
        "detected_normalized": None,
        "confidence": None,
        "message": None,
    }
    if c == "USD" and model_outputs.get("USD_denomination"):
        pred = model_outputs["USD_denomination"]
        detected = pred.get("label")
        detected_norm = normalize_denomination(detected)
        result.update({
            "checked": True,
            "detected_denomination": detected,
            "detected_normalized": detected_norm,
            "confidence": pred.get("confidence"),
        })
        if selected_norm and detected_norm and selected_norm != detected_norm:
            result["mismatch"] = True
            result["message"] = f"Selected denomination {selected} does not match detected USD denomination {detected}."
        elif detected:
            result["message"] = f"Detected USD denomination: {detected}."
    elif selected_norm:
        result["checked"] = False
        result["message"] = f"Denomination consistency model is not available for {c}; selected denomination was recorded only."
    return result


def final_decision_payload(
    *,
    currency: str,
    denomination: str | None,
    base_risk: float,
    confidence: float,
    components: dict[str, float],
    quality: Any,
    signals: Any,
    model_outputs: dict[str, Any],
    mismatch: dict[str, Any] | None,
    fallback_used: bool,
    mode: str,
    security_checklist: list[str],
    warnings: list[str],
) -> dict[str, Any]:
    qgate = build_quality_gate(quality)
    risk = clamp01(base_risk)
    if mismatch and mismatch.get("mismatch"):
        risk = clamp01(risk + settings.denomination_mismatch_risk_penalty)
    if qgate.blocking:
        # preserve risk, but return unreliable verdict as the final human-facing status
        verdict = "unreliable_image"
    else:
        verdict = verdict_from_risk(risk)
    confidence = clamp01(confidence * (0.65 + 0.35*qgate.score))
    explanations = build_explanations(
        currency=currency,
        risk=risk,
        quality_gate=qgate,
        components=components,
        model_outputs=model_outputs,
        signals=signals,
        mismatch=mismatch,
        fallback_used=fallback_used,
    )
    reliability = clamp01(0.60*qgate.score + 0.25*confidence + 0.15*(1.0 if model_outputs else 0.55))
    all_warnings = list(dict.fromkeys(warnings + qgate.issues + explanations.get("cautions", [])))
    return {
        "currency": currency,
        "denomination": denomination,
        "final_verdict": verdict,
        "final_verdict_label": public_label(verdict),
        "classification": "suspicious" if verdict == "unreliable_image" else ("counterfeit_like" if verdict == "likely_counterfeit" else ("suspicious" if verdict == "suspicious" else "genuine_like")),
        "prediction": "suspicious" if verdict == "unreliable_image" else ("counterfeit_like" if verdict == "likely_counterfeit" else ("suspicious" if verdict == "suspicious" else "genuine_like")),
        "risk_score": round(float(risk), 4),
        "risk_percent": round(float(risk)*100, 2),
        "confidence": round(float(confidence), 4),
        "reliability_score": round(float(reliability), 4),
        "analysis_mode": mode,
        "decision_engine_version": "v2.1-final-decision-quality-explainability",
        "quality_gate": asdict(qgate),
        "denomination_consistency": mismatch,
        "risk_components": {k: round(float(v), 4) for k, v in components.items()},
        "explainability": explanations,
        "model_outputs": model_outputs,
        "quality": quality.__dict__ if hasattr(quality, "__dict__") else quality,
        "signals": {
            "texture_score": getattr(signals, "texture_score", None),
            "print_complexity_score": getattr(signals, "print_complexity_score", None),
            "geometry_score": getattr(signals, "geometry_score", None),
            "lighting_score": getattr(signals, "lighting_score", None),
            "image_authenticity_risk": getattr(signals, "fallback_risk", None),
        },
        "security_checklist": security_checklist,
        "warnings": all_warnings,
        "disclaimer": "Screening result only. For legal or financial decisions, verify using official security features or certified authentication devices.",
    }
