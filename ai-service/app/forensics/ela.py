import io
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from typing import Tuple, Dict, Any

def perform_ela(image_bytes: bytes, quality: int = 90, scale: float = 15.0) -> Dict[str, Any]:
    """
    Error Level Analysis (ELA).
    Saves the image at a specific JPEG quality level, compares it with the original,
    and scales the error difference. High-difference areas indicate differing compression
    histories, common in spliced, inpainted, or digitally manipulated media.
    """
    try:
        orig = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = orig.size
        
        # Save at known JPEG quality
        buffer = io.BytesIO()
        orig.save(buffer, "JPEG", quality=quality)
        buffer.seek(0)
        recompressed = Image.open(buffer)
        
        # Calculate absolute difference
        diff = ImageChops.difference(orig, recompressed)
        
        # Extrema of diff
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        if max_diff == 0:
            max_diff = 1
        
        # Scale for visualization
        enhancer = ImageEnhance.Brightness(diff)
        ela_img = enhancer.enhance(scale)
        
        # Convert to numpy for quantitative statistics
        diff_np = np.array(diff, dtype=np.float32)
        mean_err = float(np.mean(diff_np))
        std_err = float(np.std(diff_np))
        max_err = float(np.max(diff_np))
        
        # High error block ratio: percentage of pixels whose error deviates significantly from mean
        high_error_mask = (diff_np > (mean_err + 2.0 * std_err)).astype(np.float32)
        anomaly_ratio = float(np.mean(high_error_mask))
        
        # Normalized suspicion score (0.0 to 1.0)
        # Authentic uniform JPEGs typically have low std/mean ratio and low anomaly ratio
        ela_score = min(1.0, max(0.0, (anomaly_ratio * 4.0 + (std_err / (mean_err + 1e-4)) * 0.15)))
        
        # Downsample heatmap for lightweight payload transport
        ela_thumb = ela_img.resize((min(256, w), min(256, h)))
        thumb_buffer = io.BytesIO()
        ela_thumb.save(thumb_buffer, format="JPEG", quality=80)
        thumb_bytes = thumb_buffer.getvalue()
        
        return {
            "success": True,
            "mean_error": round(mean_err, 4),
            "std_error": round(std_err, 4),
            "max_error": round(max_err, 4),
            "anomaly_ratio": round(anomaly_ratio, 4),
            "ela_score": round(ela_score, 4),
            "quality_tested": quality,
            "dimensions": {"width": w, "height": h},
            "heatmap_bytes_len": len(thumb_bytes)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "ela_score": 0.0
        }
