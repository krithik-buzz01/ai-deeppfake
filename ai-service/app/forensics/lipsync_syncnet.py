import cv2
import numpy as np
from typing import Dict, Any, List

def compute_lipsync_correlation(
    mouth_aspect_ratios: List[float], 
    audio_energies: List[float], 
    fps: float = 25.0
) -> Dict[str, Any]:
    """
    Measures cross-correlation between mouth vertical aperture (aspect ratio)
    and synchronized short-time speech acoustic energy.
    Authentic spoken media displays a clear correlation peak within -40ms to +80ms.
    Synthetic dubbing, desynchronized deepfakes, or mismatched audio show low correlation
    or anomalous temporal offsets (> 200ms).
    """
    try:
        n_visual = len(mouth_aspect_ratios)
        n_audio = len(audio_energies)

        if n_visual < 10 or n_audio < 10:
            return {
                "success": False,
                "error": "Insufficient frames for lip-sync correlation analysis",
                "offset_ms": 0.0,
                "sync_confidence": 0.0,
                "is_desynchronized": False
            }

        # Normalize lengths
        min_len = min(n_visual, n_audio)
        v_sig = np.array(mouth_aspect_ratios[:min_len], dtype=np.float32)
        a_sig = np.array(audio_energies[:min_len], dtype=np.float32)

        # Standardize signals (zero mean, unit variance)
        v_norm = (v_sig - np.mean(v_sig)) / (np.std(v_sig) + 1e-6)
        a_norm = (a_sig - np.mean(a_sig)) / (np.std(a_sig) + 1e-6)

        # Cross-correlation across a +/- 500ms window (e.g. at 25 fps, +/- 12 frames)
        max_lag_frames = int(fps * 0.5)
        lags = np.arange(-max_lag_frames, max_lag_frames + 1)
        corrs = []

        for lag in lags:
            if lag < 0:
                c = np.mean(v_norm[:lag] * a_norm[-lag:]) if len(v_norm[:lag]) > 0 else 0.0
            elif lag > 0:
                c = np.mean(v_norm[lag:] * a_norm[:-lag]) if len(v_norm[lag:]) > 0 else 0.0
            else:
                c = np.mean(v_norm * a_norm)
            corrs.append(float(c))

        corrs = np.array(corrs)
        peak_idx = int(np.argmax(corrs))
        best_lag_frames = int(lags[peak_idx])
        best_corr = float(corrs[peak_idx])
        offset_ms = round((best_lag_frames / fps) * 1000.0, 1)

        # Desynchronization criteria:
        # If max correlation is very low (< 0.15) OR offset is substantial (> 180ms), flag anomaly
        is_desync = (best_corr < 0.18) or (abs(offset_ms) > 180.0)
        sync_score = max(0.0, min(1.0, (best_corr + 0.2) / 0.8))

        return {
            "success": True,
            "best_correlation": round(best_corr, 4),
            "offset_ms": offset_ms,
            "sync_confidence": round(sync_score, 4),
            "is_desynchronized": bool(is_desync),
            "anomalies_detected": [
                f"Significant temporal speech-mouth lag of {offset_ms}ms" if abs(offset_ms) > 180 else None,
                "Acoustic-visual motion correlation below natural speech baseline" if best_corr < 0.18 else None
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e), "offset_ms": 0.0, "sync_confidence": 0.0}
