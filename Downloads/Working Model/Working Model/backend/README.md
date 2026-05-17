# CurrencyGuard AI Backend — Advanced Decision Engine

This backend is wired to the model folder you provided and now adds the requested core functionality upgrades:

1. **Final decision engine** — combines ML output, hybrid image-processing, quality, texture, geometry, lighting, and denomination mismatch signals.
2. **Explainability** — every prediction returns reasons, supporting factors, cautions, top risk components, and model outputs used.
3. **Image quality gate** — checks blur, brightness, contrast, resolution, aspect ratio, edge density, and reliability before trusting the result.
4. **Currency/denomination consistency** — USD denomination prediction is compared against the user-selected denomination when supplied.
5. **Batch analysis** — supports multiple images of the same note, such as front/back/close-up shots, and returns a combined verdict.

## Loaded models

- **INR fake/real authenticity model**: `models/currency/INR/image_model_best.pt`
- **USD denomination model**: `models/currency/USD/denomination_model.onnx`
- **USD/EUR/GBP authenticity**: hybrid image-processing + security-feature authenticity analysis.

## Run

```bat
cd fake-currency-backend-advanced
copy .env.example .env
run.bat
```

Open:

```text
http://localhost:8000/docs
```

## GPU inference

For normal inference, CPU is enough. On the RTX 3050 Ti machine, install CUDA PyTorch:

```bat
install_torch_cuda.bat
```

Then set in `.env`:

```env
PREFER_GPU=true
```

## Main endpoints

```text
GET  /api/v1/health/ready
GET  /api/v1/currencies
GET  /api/v1/model/info
POST /api/v1/model/reload
POST /api/v1/analyze/image
POST /api/v1/analyze/batch
POST /api/v1/predict/image
POST /api/v1/predict/denomination/image
```

## Single-image curl

```bash
curl -X POST "http://localhost:8000/api/v1/analyze/image" ^
  -F "currency_code=INR" ^
  -F "denomination=500" ^
  -F "file=@note.jpg"
```

## Batch curl

```bash
curl -X POST "http://localhost:8000/api/v1/analyze/batch" ^
  -F "currency_code=USD" ^
  -F "denomination=20" ^
  -F "files=@front.jpg" ^
  -F "files=@back.jpg" ^
  -F "files=@security_closeup.jpg"
```

## Key response fields

```json
{
  "final_verdict": "likely_genuine | suspicious | likely_counterfeit | unreliable_image",
  "risk_score": 0.0,
  "confidence": 0.0,
  "reliability_score": 0.0,
  "quality_gate": {},
  "denomination_consistency": {},
  "risk_components": {},
  "explainability": {
    "summary": [],
    "risk_factors": [],
    "supporting_factors": [],
    "cautions": [],
    "top_components": []
  }
}
```

## Notes

This is a screening backend, not a legal/certified authentication device. It gives a practical ML result plus quality, texture, geometry, denomination consistency, and security-feature warnings.
