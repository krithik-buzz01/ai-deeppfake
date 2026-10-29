from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List
import json

from app.adapters.image_detector import analyze_image_deepfake
from app.adapters.face_localizer import localize_face_manipulation
from app.adapters.voice_detector import analyze_voice_authenticity
from app.adapters.video_detector import analyze_video_forensics
from app.adapters.tampering_analyzer import analyze_digital_tampering
from app.forensics.lipsync_syncnet import compute_lipsync_correlation

router = APIRouter(prefix="/detect", tags=["Forensic Detection"])

@router.post("/image")
async def detect_image(file: UploadFile = File(...)):
    """
    Multimodal Deepfake Detection on image assets.
    Runs Vision Transformer neural artifact classifier, ELA, 2D FFT spectral analysis,
    and noise variance consistency.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file payload")
    
    # 1. Deepfake detector
    res = analyze_image_deepfake(contents)
    if not res.get("success", False):
        raise HTTPException(status_code=422, detail=res.get("error", "Image inference failed"))

    # 2. Localized face check
    face_res = localize_face_manipulation(contents)

    # 3. Tampering check
    tamp_res = analyze_digital_tampering(contents)

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "deepfake_analysis": res,
        "face_localization": face_res,
        "tampering_analysis": tamp_res
    }

@router.post("/video")
async def detect_video(
    file: UploadFile = File(...),
    max_frames: Optional[int] = Form(50)
):
    """
    Frame-by-frame video forensics engine with adaptive sampling,
    temporal anomaly tracking, and suspicious segment identification.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file payload")

    res = analyze_video_forensics(contents, max_frames=max_frames or 50)
    if not res.get("success", False):
        raise HTTPException(status_code=422, detail=res.get("error", "Video inference failed"))

    return {
        "filename": file.filename,
        "video_forensics": res
    }

@router.post("/audio")
async def detect_audio(file: UploadFile = File(...)):
    """
    AI-generated synthetic voice and cloning detector.
    Analyzes Mel-frequency spectrograms, pitch jitter, shimmer, and spectral flatness.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file payload")

    res = analyze_voice_authenticity(contents)
    if not res.get("success", False):
        raise HTTPException(status_code=422, detail=res.get("error", "Audio inference failed"))

    return {
        "filename": file.filename,
        "audio_forensics": res
    }

@router.post("/face")
async def detect_face_localization(file: UploadFile = File(...)):
    """
    Face manipulation localization overlay.
    Returns bounding boxes and spatial heatmaps. If no face is detected, returns
    truthful localization_available = False without inventing masks.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file payload")

    res = localize_face_manipulation(contents)
    return {
        "filename": file.filename,
        "face_localization": res
    }

@router.post("/tampering")
async def detect_tampering(file: UploadFile = File(...)):
    """
    Digital tampering, ELA, and noise consistency analysis.
    Distinguishes physical forensic heuristics from definitive alterations.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file payload")

    res = analyze_digital_tampering(contents)
    return {
        "filename": file.filename,
        "tampering_analysis": res
    }

@router.post("/lipsync")
async def detect_lipsync(
    mouth_aspect_ratios_json: str = Form(...),
    audio_energies_json: str = Form(...),
    fps: Optional[float] = Form(25.0)
):
    """
    Audio-Visual Lip-Sync Temporal Cross-Correlation Evaluator.
    Computes cross-correlation across temporal lag window.
    """
    try:
        m_ratios = json.loads(mouth_aspect_ratios_json)
        a_energies = json.loads(audio_energies_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON format for aspect ratios or audio energies")

    res = compute_lipsync_correlation(m_ratios, a_energies, fps=fps or 25.0)
    return {
        "lipsync_analysis": res
    }
