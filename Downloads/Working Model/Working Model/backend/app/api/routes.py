from __future__ import annotations
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from pydantic import BaseModel, Field
from app.core.config import settings
from app.services.currency_catalog import SUPPORTED, normalize_currency
from app.services.model_registry import registry
from app.services.risk_engine import analyze_banknote, analyze_batch_banknotes, explain_currency_security

router = APIRouter()

class ManualFeatureRequest(BaseModel):
    variance: float
    skewness: float
    curtosis: float = Field(alias='curtosis')
    entropy: float
    currency: dict | None = None

@router.get('/health/live')
def live():
    return {'status':'live', 'app': settings.app_name, 'version': settings.app_version}

@router.get('/health/ready')
def ready():
    s = registry.status()
    return {'status':'ready', 'models': s['models'], 'errors': s['errors']}

@router.get('/currencies')
def currencies():
    return {'supported': SUPPORTED, 'features': ['final_decision_engine','explainability','image_quality_gate','denomination_consistency','batch_analysis']}

@router.get('/currencies/{currency_code}')
def currency_detail(currency_code: str):
    c = normalize_currency(currency_code)
    return {'currency_code': c, **SUPPORTED[c], 'security_checklist': explain_currency_security(c)}

@router.get('/model/info')
def model_info():
    return registry.status()

@router.get('/models/registry')
def models_registry():
    return registry.status()

@router.post('/model/reload')
def reload_models():
    registry.load()
    return {'reloaded': True, **registry.status()}

@router.post('/analyze/image')
async def analyze_image(
    file: UploadFile = File(...),
    currency_code: str = Form('OTHER'),
    denomination: str | None = Form(None),
):
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f'Upload too large. Max {settings.max_upload_mb} MB')
    return analyze_banknote(data, currency_code, denomination)

@router.post('/analyze/batch')
async def analyze_batch(
    files: list[UploadFile] = File(...),
    currency_code: str = Form('OTHER'),
    denomination: str | None = Form(None),
):
    if not files:
        raise HTTPException(400, 'Upload at least one image')
    if len(files) > 6:
        raise HTTPException(400, 'Upload at most 6 images per batch')
    items = []
    for f in files:
        data = await f.read()
        if len(data) > settings.max_upload_mb * 1024 * 1024:
            raise HTTPException(413, f'Upload too large: {f.filename}. Max {settings.max_upload_mb} MB per file')
        items.append((data, f.filename or 'image'))
    return analyze_batch_banknotes(items, currency_code, denomination)

@router.post('/predict/image')
async def predict_image(
    file: UploadFile = File(...),
    currency_code: str = Form('OTHER'),
    denomination: str | None = Form(None),
):
    return await analyze_image(file, currency_code, denomination)

@router.post('/predict/denomination/image')
async def predict_denomination_image(
    file: UploadFile = File(...),
    currency_code: str = Form('USD'),
):
    data = await file.read()
    c = normalize_currency(currency_code)
    if c == 'USD' and registry.usd_denom and registry.usd_denom.ready:
        return {'currency': 'USD', 'task':'denomination', **registry.usd_denom.predict(data)}
    if c == 'INR' and registry.inr_auth and registry.inr_auth.ready:
        # INR model here is authenticity, not denomination. Return clear message.
        return {'currency': 'INR', 'task':'authenticity', **registry.inr_auth.predict(data), 'note':'Loaded INR model is fake/real authenticity, not denomination.'}
    raise HTTPException(404, f'No denomination model loaded for {c}')

@router.post('/predict')
def predict_manual_features(payload: ManualFeatureRequest):
    # Backward-compatible manual feature route using the lightweight authenticity scoring engine.
    c = normalize_currency((payload.currency or {}).get('currency_code') if payload.currency else 'OTHER')
    # UCI-like heuristic: high entropy/curtosis abnormalities and wavelet dispersion influence risk.
    z = 0.0
    z += -0.22 * payload.variance
    z += -0.08 * payload.skewness
    z += 0.10 * payload.curtosis
    z += -0.18 * payload.entropy
    import math
    risk = 1 / (1 + math.exp(-z))
    label = 'counterfeit_like' if risk >= settings.risk_counterfeit_threshold else ('suspicious' if risk >= settings.risk_suspicious_threshold else 'genuine_like')
    return {'currency': c, 'prediction': label, 'classification': label, 'risk_score': round(risk,4), 'confidence': round(abs(risk-0.5)*2,4), 'analysis_mode':'manual_wavelet_authenticity_engine'}

@router.get('/security/features/{currency_code}')
def security_features(currency_code: str):
    c = normalize_currency(currency_code)
    return {'currency': c, 'security_checklist': explain_currency_security(c)}
