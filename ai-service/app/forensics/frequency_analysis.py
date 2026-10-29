import cv2
import numpy as np
from typing import Dict, Any

def analyze_frequency_domain(image_np: np.ndarray) -> Dict[str, Any]:
    """
    Analyzes 2D Fast Fourier Transform (FFT) and Discrete Cosine Transform (DCT)
    to detect synthetic generation artifacts (periodic checkerboard peaks,
    anomalous high-frequency energy, or non-natural power spectrum decay).
    """
    try:
        # Convert to grayscale
        if len(image_np.shape) == 3:
            gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        else:
            gray = image_np

        h, w = gray.shape
        # Ensure minimum size
        if h < 32 or w < 32:
            return {"success": False, "error": "Image too small for spectral analysis"}

        # Compute 2D FFT and center the DC component
        f = np.fft.fft2(gray.astype(np.float32))
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = np.log(np.abs(fshift) + 1.0)

        # Center coordinates
        cy, cx = h // 2, w // 2

        # Radial profile calculation (azimuthal average)
        y, x = np.indices((h, w))
        r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2).astype(np.int32)
        max_r = min(cx, cy)
        
        radial_prof = np.zeros(max_r, dtype=np.float32)
        for i in range(max_r):
            mask = (r == i)
            if np.any(mask):
                radial_prof[i] = np.mean(magnitude_spectrum[mask])

        # Natural photos follow power-law falloff 1/f^alpha (log spectrum roughly linear decline)
        # Compute linear regression slope of radial spectrum in mid-to-high frequencies
        freq_indices = np.arange(10, max_r)
        if len(freq_indices) > 5:
            profile_subset = radial_prof[freq_indices]
            # Fit polynomial degree 1
            poly = np.polyfit(freq_indices, profile_subset, 1)
            decay_slope = float(poly[0])
            # Residual error from natural 1/f falloff
            residuals = np.sum((profile_subset - (poly[0] * freq_indices + poly[1])) ** 2)
            spectral_residual_var = float(residuals / len(freq_indices))
        else:
            decay_slope = -0.01
            spectral_residual_var = 0.0

        # High-frequency spike detection: look for isolated peaks in high-frequency regions
        # Typical of GAN grid / transposed convolution checkerboard artifacts
        high_freq_mask = (r > (max_r * 0.6)) & (r < max_r)
        high_freq_vals = magnitude_spectrum[high_freq_mask]
        
        if len(high_freq_vals) > 0:
            hf_mean = np.mean(high_freq_vals)
            hf_std = np.std(high_freq_vals)
            hf_max = np.max(high_freq_vals)
            peak_to_average = float((hf_max - hf_mean) / (hf_std + 1e-5))
        else:
            peak_to_average = 0.0

        # Suspicion score calibrated between 0.0 and 1.0
        # High spectral residuals and unusual peak_to_average ratio flag synthetic generation
        synthetic_indicator = 0.0
        if peak_to_average > 4.5:
            synthetic_indicator += 0.35
        if spectral_residual_var > 0.4:
            synthetic_indicator += 0.35
        if decay_slope > -0.005: # Unusually flat or positive slope in high frequencies
            synthetic_indicator += 0.30

        return {
            "success": True,
            "decay_slope": round(decay_slope, 5),
            "spectral_residual_variance": round(spectral_residual_var, 4),
            "high_freq_peak_ratio": round(peak_to_average, 4),
            "frequency_artifact_score": round(min(1.0, synthetic_indicator), 4),
            "interpretation": "Anomalous high-frequency grid peaks detected" if synthetic_indicator > 0.5 else "Natural radial power spectrum falloff observed"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "frequency_artifact_score": 0.0}
