from fastapi import APIRouter, HTTPException
from typing import List
from app.models.registry import get_registered_models, get_model_info, ModelInfo

router = APIRouter(prefix="/models", tags=["Model Registry"])

@router.get("", response_model=List[ModelInfo])
def list_models():
    """Returns the verified registry of licensed AI forensic models."""
    return get_registered_models()

@router.get("/{model_key}", response_model=ModelInfo)
def get_model(model_key: str):
    """Returns metadata, accuracy calibration, limitations, and license for a specific model."""
    info = get_model_info(model_key)
    if not info:
        raise HTTPException(status_code=404, detail=f"Model '{model_key}' not found in registry")
    return info
