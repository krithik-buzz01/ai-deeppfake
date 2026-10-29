import io
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, List

from app.forensics.ela import perform_ela
from app.forensics.noise_consistency import analyze_noise_consistency
from app.forensics.frequency_analysis import analyze_frequency_domain

def analyze_digital_tampering(image_bytes: bytes) -> Dict[str, Any]:
    """
    Analyzes physical forensic indicators of digital tampering:
    1. Error Level Analysis (ELA) for compression inconsistencies
    2. PRNU noise variance homogeneity (identifying spliced regions)
    3. Resampling & interpolation periodic peaks (affine transformation / scaling)
    4. Distinguishes heuristic indicators from definitive proof
    """
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_img)
        w, h = pil_img.size

        # 1. ELA
        ela_res = perform_ela(image_bytes)
        ela_score = ela_res.get("ela_score", 0.0)

        # 2. Tile Noise Consistency
        noise_res = analyze_noise_consistency(img_np)
        noise_score = noise_res.get("noise_inconsistency_score", 0.0)

        # 3. Frequency & Resampling detection
        freq_res = analyze_frequency_domain(img_np)
        freq_score = freq_res.get("frequency_artifact_score", 0.0)

        # Heuristic tampering indicators
        heuristic_flags = []
        if ela_score > 0.45:
            heuristic_flags.append({
                "type": "compression_discrepancy",
                "severity": "medium",
                "description": "Localized areas exhibit significantly different JPEG compression error levels compared to global background."
            })

        if noise_score > 0.45:
            heuristic_flags.append({
                "type": "noise_variance_heterogeneity",
                "severity": "high",
                "description": "Sensor noise statistics are inconsistent across image blocks, indicative of spliced elements from different capture devices."
            })

        if freq_score > 0.45:
            heuristic_flags.append({
                "type": "resampling_interpolation_traces",
                "severity": "medium",
                "description": "High-frequency periodic spectral spikes detected, indicating spatial resampling or generative upscaling."
            })

        tampering_score = round(min(0.99, max(0.01, (ela_score * 0.4 + noise_score * 0.4 + freq_score * 0.2))), 4)

        if tampering_score > 0.65:
            risk = "high"
        elif tampering_score > 0.35:
            risk = "medium"
        else:
            risk = "low"

        return {
            "success": True,
            "model_name": "Digital Tampering & Forensic Noise Consistency Analyzer",
            "model_version": "2.0.0",
            "tampering_score": tampering_score,
            "risk_level": risk,
            "heuristic_flags": heuristic_flags,
            "is_tampered_indicated": tampering_score > 0.40,
            "forensics": {
                "ela": ela_res,
                "noise": noise_res,
                "spectral": freq_res
            },
            "methodology_disclaimer": "These metrics are empirical forensic heuristics. Benign editing operations (cropping, re-saving, brightness adjustments) can trigger flags without intent to deceive."
        }
    except Exception as e:
        return {"success": False, "error": str(e), "tampering_score": 0.0}
