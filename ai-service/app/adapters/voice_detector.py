import io
from typing import Dict, Any
from app.forensics.audio_spectrogram import extract_audio_features

def analyze_voice_authenticity(audio_bytes: bytes) -> Dict[str, Any]:
    """
    Analyzes audio buffer for synthetic speech, neural voice cloning,
    and vocoder phase manipulation.
    """
    res = extract_audio_features(audio_bytes)
    if not res.get("success", False):
        return {
            "success": False,
            "error": res.get("error", "Audio extraction failed"),
            "model_name": "Acoustic Spectral & Synthetic Voice Detector",
            "model_version": "1.1.0",
            "synthetic_voice_score": 0.0,
            "risk_level": "unknown",
            "confidence_limitations": "Unable to decode audio track or duration insufficient (< 200ms)"
        }

    score = res["synthetic_voice_score"]
    if score > 0.70:
        risk = "critical"
    elif score > 0.45:
        risk = "high"
    elif score > 0.25:
        risk = "medium"
    else:
        risk = "low"

    return {
        "success": True,
        "model_name": "Acoustic Spectral & Synthetic Voice Detector",
        "model_version": "1.1.0",
        "synthetic_voice_score": score,
        "risk_level": risk,
        "duration_seconds": res.get("duration_seconds", 0.0),
        "mean_spectral_centroid_hz": res.get("mean_spectral_centroid_hz", 0.0),
        "spectral_flatness": res.get("spectral_flatness", 0.0),
        "pitch_jitter": res.get("pitch_jitter", 0.0),
        "amplitude_shimmer": res.get("amplitude_shimmer", 0.0),
        "spectrogram_preview": res.get("spectrogram_preview", []),
        "detected_anomalies": [a for a in res.get("audio_anomalies", []) if a is not None],
        "confidence_limitations": "Audio forensics indicators are probabilistic. Extreme background noise, telephony 8kHz bandwidth, or aggressive MP3/AAC compression can induce synthetic false positives. Real speaker identity cannot be claimed without authorized biometric enrollment."
    }
