import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mahindra Intelligent Assistant (MIA) with Kabir AI"
    API_V1_STR: str = "/api"
    VERTEX_PROJECT_ID: str = os.getenv("VERTEX_PROJECT_ID", os.getenv("PROJECT_ID", "mb-poc-352009"))
    VERTEX_LOCATION: str = os.getenv("VERTEX_LOCATION", os.getenv("LOCATION", "us-central1"))
    
    # Live Bidi WebSocket Configuration (gemini-live-api-dev skill & mahindra-car-live-chat)
    GEMINI_LIVE_MODEL: str = os.getenv("GEMINI_LIVE_MODEL", "gemini-3.1-flash-live-preview-04-2026")
    BIDI_SERVICE_URL: str = "wss://{host}/ws/google.cloud.aiplatform.internal.LlmBidiService/BidiGenerateContent"
    
    # REST Chat Model (Standard GenerateContent)
    REST_CHAT_MODEL: str = os.getenv("REST_CHAT_MODEL", "gemini-2.5-flash")
    
    AVATAR_VOICE: str = os.getenv("AVATAR_VOICE", "orus") # Male Consultant
    AVATAR_NAME: str = os.getenv("AVATAR_NAME", "Jay") # Default multimodal avatar stream
    AVATAR_MODALITY: str = os.getenv("AVATAR_MODALITY", "VIDEO") # Real-time avatar video stream
    DEFAULT_LOCALE: str = os.getenv("DEFAULT_LOCALE", "hi-IN") # Multilingual
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./mahindra_omnichannel.db")
    WS_LIVE_AUDIO_PATH: str = "/ws/live-audio"
    DEFAULT_DEALERSHIP: str = "Bayview Mahindra, Bandra West, Mumbai"    
    
    # SMS Dispatch Configuration (Configurable via Cloud Run environment variable)
    ENABLE_SMS_DISPATCH: bool = os.getenv("ENABLE_SMS_DISPATCH", "true").lower() in ("true", "1", "yes")

    model_config = SettingsConfigDict(case_sensitive=True, extra="allow")

settings = Settings()
