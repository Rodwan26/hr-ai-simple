import os
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class AISettings(BaseModel):
    openrouter_api_key: Optional[str] = Field(default=os.getenv("OPENROUTER_API_KEY"))
    model_name: str = Field(default=os.getenv("AI_MODEL_NAME", "google/gemini-2.0-flash-exp:free"))
    kill_switch: bool = Field(default=os.getenv("AI_KILL_SWITCH", "false").lower() == "true")
    temperature: float = 0.7

class Config(BaseModel):
    app_name: str = "HR AI Platform"
    environment: str = os.getenv("APP_ENV", "development")
    api_prefix: str = "/api"
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./database.db")
    
    # Auth
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-it-in-prod")
    access_token_expire_minutes: int = 60 * 24 # 24 hours
    
    # AI Components
    ai: AISettings = AISettings()
    ai_fallback_model: str = os.getenv("AI_FALLBACK_MODEL", "google/gemini-2.0-flash-lite-preview-02-05:free")
    
    # Enterprise Architecture
    # Enterprise Architecture
    version: str = "1.0.0"
    build_id: str = os.getenv("BUILD_ID", "local")
    commit_hash: str = os.getenv("COMMIT_HASH", "HEAD")
    request_id_header: str = "X-Request-ID"
    
    # Scalability & Performance
    enable_caching: bool = os.getenv("ENABLE_CACHING", "true").lower() == "true"
    cache_dir: str = ".cache"
    rate_limit_per_minute: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    encryption_key: str = os.getenv("ENCRYPTION_KEY", "oX_fC_g-l7-W_m_C_l-k7-W_m_C_l-k7-W_m_C_l-k7-W_==")
    
    # Feature Flags
    enable_burnout_analysis: bool = os.getenv("ENABLE_BURNOUT_AI", "true").lower() == "true"
    enable_onboarding_ai: bool = os.getenv("ENABLE_ONBOARDING_AI", "true").lower() == "true"
    enable_metrics_dashboard: bool = os.getenv("ENABLE_METRICS", "true").lower() == "true"

settings = Config()
