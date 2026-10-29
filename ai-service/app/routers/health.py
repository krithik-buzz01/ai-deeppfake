from fastapi import APIRouter
import torch
import psutil
import os
from app.config import settings
from app.models.registry import get_registered_models

router = APIRouter(tags=["Health & System"])

@router.get("/health")
def get_health():
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    models = get_registered_models()
    
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "torch_version": torch.__version__,
        "device": "cuda" if torch.cuda.is_available() and settings.ENABLE_GPU else "cpu",
        "cuda_available": torch.cuda.is_available(),
        "registered_models_count": len(models),
        "available_models_count": len([m for m in models if m.is_available]),
        "memory_rss_mb": round(mem_info.rss / (1024 * 1024), 2)
    }
