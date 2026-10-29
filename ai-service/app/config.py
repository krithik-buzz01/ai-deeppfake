import os
from pydantic import BaseModel
from typing import Optional

class Settings(BaseModel):
    APP_NAME: str = "VERIFAI AI Inference Engine"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("AI_PORT", "8000"))
    TORCH_DEVICE: str = os.getenv("TORCH_DEVICE", "cpu")
    MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", "./cache")
    ENABLE_GPU: bool = os.getenv("ENABLE_GPU_ACCELERATION", "false").lower() == "true"
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.65"))
    MAX_FRAMES_PER_VIDEO: int = int(os.getenv("MAX_FRAMES_PER_VIDEO", "60"))
    AUDIO_SAMPLE_RATE: int = int(os.getenv("AUDIO_SAMPLE_RATE", "16000"))
    DEBUG: bool = os.getenv("AI_DEBUG", "false").lower() == "true"

settings = Settings()
