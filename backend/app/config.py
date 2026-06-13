from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "ARCANE API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # API
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./arcane.db"
    
    # Security
    SECRET_KEY: str

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    
    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    DEFAULT_MODEL: str = "llama3:latest"
    
    # Agent Models
    PLANNER_MODEL: str = "llama3:latest"
    EXECUTOR_MODEL: str = "llama3:latest"
    ANALYST_MODEL: str = "llama3:latest"
    MEMORY_MODEL: str = "llama3:latest"
    TOOL_MODEL: str = "llama3:latest"
    REASONER_MODEL: str = "llama3:latest"
    CODER_MODEL: str = "llama3:latest"
    VISION_MODEL: str = "llava" # Keep llava for vision if available later
    SEARCH_MODEL: str = "llama3:latest"
    SQL_MODEL: str = "llama3:latest"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
