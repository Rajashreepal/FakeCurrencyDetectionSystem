from __future__ import annotations
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    app_name: str = "CurrencyGuard AI Backend"
    app_version: str = "5.1.0-decision-engine"
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    models_dir: Path = ROOT / "models"
    max_upload_mb: int = 15
    prefer_gpu: bool = False
    model_reload_on_startup: bool = True
    risk_counterfeit_threshold: float = 0.68
    risk_suspicious_threshold: float = 0.40

    # Decision engine / quality gate tuning
    quality_warn_threshold: float = 0.58
    quality_fail_threshold: float = 0.42
    quality_hard_block_threshold: float = 0.28
    min_sharpness: float = 80.0
    min_brightness: float = 45.0
    max_brightness: float = 225.0
    min_image_width: int = 450
    min_image_height: int = 220
    denomination_mismatch_risk_penalty: float = 0.14
    inr_model_weight: float = 0.74
    fallback_weight: float = 0.16
    quality_penalty_weight: float = 0.10
    model_config = SettingsConfigDict(env_file=str(ROOT/'.env'), env_file_encoding='utf-8', extra='ignore')

settings = Settings()
