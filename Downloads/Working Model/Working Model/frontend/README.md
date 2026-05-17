# CurrencyGuard AI Frontend v3

Advanced React + Material UI frontend for the `fake-currency-backend-advanced-v3-clean-output` backend.

## What is upgraded

- Uses the new `/api/v1/analyze/image` endpoint for the main single-image decision engine.
- Uses `/api/v1/analyze/batch` for front/back/close-up batch analysis.
- Displays final verdict, risk score, confidence, reliability, quality gate, explainability, security checklist, and denomination mismatch warnings.
- Shows USD denomination model output when returned by the backend.
- Updated model dashboard for the new backend registry format.
- Keeps the multi-page layout, luxury dark Material UI theme, preloader, custom cursor and transitions.

## Run

```bash
copy .env.example .env
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Backend should be running at:

```text
http://localhost:8000
```

## Environment

`.env.example` uses:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
