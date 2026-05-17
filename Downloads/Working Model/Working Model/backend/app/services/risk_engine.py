from __future__ import annotations
from statistics import mean
from uuid import uuid4
from app.core.config import settings
from app.services.currency_catalog import normalize_currency
from app.services.image_features import fallback_authenticity_signals
from app.services.model_registry import registry
from app.services.decision_engine import clamp01, final_decision_payload, check_denomination_consistency, verdict_from_risk, public_label


def explain_currency_security(currency: str) -> list[str]:
    c = normalize_currency(currency)
    if c == 'USD':
        return [
            "Check watermark and security thread against the detected denomination.",
            "Tilt the note and inspect color-shifting ink on larger denominations.",
            "Feel raised printing and compare paper texture with a known genuine note.",
            "Inspect serial numbers, portrait sharpness, micro-printing, and fine-line background patterns.",
        ]
    if c == 'INR':
        return [
            "Check watermark, security thread, latent image and see-through register.",
            "Tilt the note for colour-shift and inspect micro-lettering.",
            "Verify denomination numerals and RBI/portrait details are sharp.",
            "Check alignment of borders, serial number region, portrait/monument region, and fine-line patterns.",
        ]
    if c == 'EUR':
        return [
            "Feel raised print, look for watermark and security thread.",
            "Tilt for hologram/emerald number depending on series.",
            "Use UV/manual inspection for official verification.",
            "Compare windows, foil features, serial numbers, and map/architectural details with a known genuine note.",
        ]
    if c == 'GBP':
        return [
            "Check polymer window, hologram, raised print and micro-lettering.",
            "Tilt the note to inspect foil patches and colour effects.",
            "Compare portrait/window details with official Bank of England guidance.",
            "Check transparent window edges, print sharpness, serial numbers, and metallic foil regions.",
        ]
    return ["Use image score as screening only; inspect official security features manually."]


def _inr_model_counterfeit_probability(pred: dict) -> float:
    probs = pred.get('probabilities') or {}
    # support different class names from training scripts
    for key in ('counterfeit', 'fake', 'Fake', 'forged', '1'):
        if key in probs:
            return float(probs[key])
    label = str(pred.get('label', '')).lower()
    conf = float(pred.get('confidence', 0.0) or 0.0)
    if any(x in label for x in ('counterfeit', 'fake', 'forged')):
        return conf
    if any(x in label for x in ('real', 'genuine', 'authentic')):
        return 1.0 - conf
    return 0.5


def analyze_banknote(image_bytes: bytes, currency: str = 'OTHER', denomination: str | None = None) -> dict:
    c = normalize_currency(currency)
    signals = fallback_authenticity_signals(image_bytes, c)
    model_outputs: dict = {}
    components: dict[str, float] = {
        'image_authenticity_analysis': float(signals.fallback_risk),
        'quality_penalty': 1.0 - float(signals.quality.quality_score),
        'texture_penalty': 1.0 - float(signals.texture_score),
        'print_complexity_penalty': 1.0 - float(signals.print_complexity_score),
        'geometry_penalty': 1.0 - float(signals.geometry_score),
        'lighting_penalty': 1.0 - float(signals.lighting_score),
    }
    risk = signals.fallback_risk
    confidence = 0.45 + 0.35*signals.quality.quality_score
    mode = 'advanced_image_authenticity_engine'
    fallback_used = True

    if c == 'INR' and registry.inr_auth and registry.inr_auth.ready:
        pred = registry.inr_auth.predict(image_bytes)
        model_outputs['INR_authenticity'] = pred
        cf_prob = _inr_model_counterfeit_probability(pred)
        components['ml_authenticity'] = cf_prob
        # model dominates; image-processing and quality prevent over-confident bad-photo outputs
        risk = clamp01(
            settings.inr_model_weight*cf_prob
            + settings.fallback_weight*signals.fallback_risk
            + settings.quality_penalty_weight*(1.0 - signals.quality.quality_score)
        )
        confidence = clamp01(float(pred.get('confidence', 0.0)) * (0.72 + 0.28*signals.quality.quality_score))
        mode = 'INR_authenticity_model_plus_decision_engine'
        fallback_used = False
    elif c == 'USD':
        if registry.usd_denom and registry.usd_denom.ready:
            dpred = registry.usd_denom.predict(image_bytes)
            model_outputs['USD_denomination'] = dpred
            if not denomination:
                denomination = dpred.get('label')
            # weak contribution: if denomination confidence is poor, risk rises slightly
            components['denomination_uncertainty'] = 1.0 - float(dpred.get('confidence', 0.0) or 0.0)
        risk = clamp01(
            0.58*signals.fallback_risk
            + 0.20*(1.0 - signals.quality.quality_score)
            + 0.12*(1.0 - signals.print_complexity_score)
            + 0.10*components.get('denomination_uncertainty', 0.35)
        )
        confidence = clamp01(0.42 + 0.35*signals.quality.quality_score + 0.18*(1.0-components.get('denomination_uncertainty', 0.35)))
        mode = 'USD_denomination_plus_authenticity_decision_engine'
    else:
        risk = clamp01(
            0.62*signals.fallback_risk
            + 0.18*(1.0 - signals.quality.quality_score)
            + 0.10*(1.0 - signals.print_complexity_score)
            + 0.10*(1.0 - signals.texture_score)
        )
        confidence = clamp01(0.40 + 0.42*signals.quality.quality_score)
        mode = f'{c}_advanced_authenticity_decision_engine'

    mismatch = check_denomination_consistency(c, denomination, model_outputs)
    warnings = list(signals.quality.warnings) + list(signals.notes)
    if c == 'INR' and registry.inr_auth and registry.metrics.get('INR'):
        best = registry.metrics['INR'].get('best_balanced_accuracy') or registry.metrics['INR'].get('best_accuracy')
        if best and best < 0.90:
            warnings.append(f"INR model confidence profile: best validation score {best:.3f}.")

    return final_decision_payload(
        currency=c,
        denomination=denomination,
        base_risk=risk,
        confidence=confidence,
        components=components,
        quality=signals.quality,
        signals=signals,
        model_outputs=model_outputs,
        mismatch=mismatch,
        fallback_used=fallback_used,
        mode=mode,
        security_checklist=explain_currency_security(c),
        warnings=warnings,
    )


def analyze_batch_banknotes(items: list[tuple[bytes, str]], currency: str = 'OTHER', denomination: str | None = None) -> dict:
    c = normalize_currency(currency)
    analyses = []
    for idx, (image_bytes, filename) in enumerate(items, start=1):
        result = analyze_banknote(image_bytes, c, denomination)
        result['item_index'] = idx
        result['filename'] = filename
        analyses.append(result)

    if not analyses:
        return {'batch_id': str(uuid4()), 'currency': c, 'count': 0, 'error': 'No images supplied.'}

    risks = [float(a['risk_score']) for a in analyses]
    reliabilities = [float(a.get('reliability_score', 0.0)) for a in analyses]
    confidences = [float(a.get('confidence', 0.0)) for a in analyses]
    fail_count = sum(1 for a in analyses if a.get('quality_gate', {}).get('status') == 'fail')
    mismatch_count = sum(1 for a in analyses if (a.get('denomination_consistency') or {}).get('mismatch'))
    max_risk = max(risks)
    avg_risk = mean(risks)
    # Conservative: a single very suspicious side/closeup should raise the batch score
    combined_risk = clamp01(0.58*avg_risk + 0.42*max_risk + 0.05*mismatch_count)
    verdict = 'unreliable_image' if fail_count == len(analyses) else verdict_from_risk(combined_risk)

    reasons = []
    if max_risk - avg_risk > 0.18:
        reasons.append('At least one uploaded image is much more suspicious than the others.')
    if fail_count:
        reasons.append(f'{fail_count} image(s) failed the quality gate.')
    if mismatch_count:
        reasons.append(f'{mismatch_count} image(s) had denomination mismatch warnings.')
    if not reasons:
        reasons.append('Batch verdict is based on combined average and maximum image risk.')

    return {
        'batch_id': str(uuid4()),
        'currency': c,
        'denomination': denomination,
        'count': len(analyses),
        'final_verdict': verdict,
        'final_verdict_label': public_label(verdict),
        'combined_risk_score': round(combined_risk, 4),
        'combined_risk_percent': round(combined_risk*100, 2),
        'average_risk_score': round(avg_risk, 4),
        'max_risk_score': round(max_risk, 4),
        'average_confidence': round(mean(confidences), 4),
        'average_reliability': round(mean(reliabilities), 4),
        'quality_fail_count': fail_count,
        'denomination_mismatch_count': mismatch_count,
        'batch_explainability': {
            'summary': reasons,
            'recommended_action': 'Use the clearest front/back images. If result is suspicious or quality failed, verify manually with official security features.',
        },
        'items': analyses,
    }
