from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router
from app.services.model_registry import registry

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description='Advanced fake currency detection backend with INR CNN authenticity, USD denomination detection, and hybrid image-processing authenticity analysis for USD/EUR/GBP/OTHER.',
)

origins = [o.strip() for o in settings.cors_origins.split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.on_event('startup')
def startup():
    if settings.model_reload_on_startup:
        registry.load()

@app.get('/')
def root():
    return {
        'name': settings.app_name,
        'version': settings.app_version,
        'docs': '/docs',
        'health': f'{settings.api_prefix}/health/ready',
        'analyze': f'{settings.api_prefix}/analyze/image',
    }

app.include_router(router, prefix=settings.api_prefix)
