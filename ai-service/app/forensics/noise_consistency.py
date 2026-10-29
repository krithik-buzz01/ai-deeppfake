import cv2
import numpy as np
from typing import Dict, Any

def analyze_noise_consistency(image_np: np.ndarray, block_size: int = 32) -> Dict[str, Any]:
    """
    Evaluates sensor noise variance consistency across local image tiles.
    Authentic photos from a single sensor possess consistent PRNU (Photo-Response Non-Uniformity)
    and photon noise variance. Spliced elements, deepfake face-swaps, or inpaintings exhibit
    sharp local discrepancies in residual noise statistics.
    """
    try:
        if len(image_np.shape) == 3:
            gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY).astype(np.float32)
        else:
            gray = image_np.astype(np.float32)

        h, w = gray.shape
        if h < block_size * 2 or w < block_size * 2:
            return {"success": False, "error": "Image too small for tile noise estimation"}

        # Extract high-frequency noise residual using 3x3 Laplacian kernel
        laplacian_kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
        noise_residual = cv2.filter2D(gray, -1, laplacian_kernel)

        # Compute noise variance in each non-overlapping block
        n_blocks_y = h // block_size
        n_blocks_x = w // block_size
        block_variances = []

        for by in range(n_blocks_y):
            for bx in range(n_blocks_x):
                tile = noise_residual[by*block_size:(by+1)*block_size, bx*block_size:(bx+1)*block_size]
                # Filter out pure saturated or pure black blocks (edges/sky with 0 signal)
                tile_gray = gray[by*block_size:(by+1)*block_size, bx*block_size:(bx+1)*block_size]
                if np.std(tile_gray) > 5.0: # Has texture
                    var = float(np.var(tile))
                    block_variances.append(var)

        if len(block_variances) < 4:
            return {"success": False, "error": "Insufficient textured blocks for noise profiling"}

        block_variances = np.array(block_variances, dtype=np.float32)
        median_var = float(np.median(block_variances))
        iqr_var = float(np.percentile(block_variances, 75) - np.percentile(block_variances, 25))
        
        # Coefficient of variation of noise variance
        mean_var = float(np.mean(block_variances))
        std_var = float(np.std(block_variances))
        cov = std_var / (mean_var + 1e-5)

        # Inconsistent noise score: high variance between blocks suggests multi-source compositing
        noise_inconsistency_score = min(1.0, max(0.0, (cov - 0.45) / 1.5))

        return {
            "success": True,
            "blocks_analyzed": len(block_variances),
            "median_noise_variance": round(median_var, 4),
            "noise_iqr": round(iqr_var, 4),
            "variance_cov": round(cov, 4),
            "noise_inconsistency_score": round(noise_inconsistency_score, 4),
            "is_noise_homogeneous": cov < 0.65
        }
    except Exception as e:
        return {"success": False, "error": str(e), "noise_inconsistency_score": 0.0}
