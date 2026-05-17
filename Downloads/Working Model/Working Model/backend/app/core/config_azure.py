"""
Azure-optimized configuration for free tier deployment
"""
from pydantic_settings import BaseSettings
from typing import Optional

class AzureSettings(BaseSettings):
    app_name: str = "CurrencyGuard AI"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    
    # Optimize for Azure free tier
    model_reload_on_startup: bool = False  # Disable to save memory
    prefer_gpu: bool = False  # CPU only on free tier
    max_file_size: int = 5 * 1024 * 1024  # 5MB limit
    
    # CORS for Azure deployment
    cors_origins: str = "*"  # Configure with your actual frontend URL
    
    # Azure-specific settings
    azure_storage_connection_string: Optional[str] = None
    use_azure_blob_for_models: bool = False
    
    class Config:
        env_file = ".env"