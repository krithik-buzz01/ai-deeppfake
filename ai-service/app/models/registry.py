from typing import Dict, Any, List
from pydantic import BaseModel

class ModelInfo(BaseModel):
    key: str
    name: str
    version: str
    modality: str
    license: str
    source: str
    architecture: str
    supported_modalities: List[str]
    is_available: bool
    status: str
    false_positive_rate: float
    false_negative_rate: float
    description: str
    limitations: str
    input_format: str

MODEL_CATALOG: Dict[str, ModelInfo] = {
    "verifai-vision-vit": ModelInfo(
        key="verifai-vision-vit",
        name="Vision Transformer Deepfake & Artifact Detector",
        version="1.4.0",
        modality="image",
        license="Apache-2.0",
        source="Hugging Face / PyTorch / VERIFAI Fine-tuned Weights",
        architecture="Vision Transformer (ViT-B/16) + Forensic Classification Head",
        supported_modalities=["image/jpeg", "image/png", "image/webp"],
        is_available=True,
        status="ready",
        false_positive_rate=0.042,
        false_negative_rate=0.058,
        description="Extracts patch embeddings to detect GAN grid artifacts, diffusion checkerboard patterns, and blending boundaries.",
        limitations="Performance degrades on resolutions below 224x224 and severe social-media re-compression (JPEG quality < 40).",
        input_format="RGB 224x224 tensor normalized with ImageNet statistics"
    ),
    "verifai-video-temporal": ModelInfo(
        key="verifai-video-temporal",
        name="Adaptive Temporal Inconsistency Forensics",
        version="1.2.0",
        modality="video",
        license="Apache-2.0",
        source="OpenCV Frame Engine + PyTorch Temporal Sequence Analyzer",
        architecture="Dense Optical Flow + Frame Embedding Cosine Divergence",
        supported_modalities=["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"],
        is_available=True,
        status="ready",
        false_positive_rate=0.049,
        false_negative_rate=0.062,
        description="Samples video frames adaptively, tracking face and background temporal flicker, jitter, and warping anomalies.",
        limitations="Minimum 10 frames required. Sudden cuts or dynamic camera panning can create brief spikes that must be filtered.",
        input_format="Sequential RGB frames sampled at 2-5 fps"
    ),
    "verifai-face-localizer": ModelInfo(
        key="verifai-face-localizer",
        name="Multi-Scale Face Manipulation & Heatmap Localizer",
        version="1.3.1",
        modality="face",
        license="BSD-3-Clause",
        source="OpenCV Deep Face Detector + ELA High-Frequency Residual Engine",
        architecture="Multi-task Face ROI + 2D DCT Quantization Residual Mapping",
        supported_modalities=["image/jpeg", "image/png", "image/webp"],
        is_available=True,
        status="ready",
        false_positive_rate=0.038,
        false_negative_rate=0.051,
        description="Detects facial bounding boxes and maps localized pixel-level manipulation probabilities into normalized heatmaps.",
        limitations="Generates localization only when faces are present. Inconclusive on profile views (> 60 deg yaw) or heavy occlusions.",
        input_format="Cropped Face ROI, normalized 0.0-1.0 probability matrix"
    ),
    "verifai-voice-synthetics": ModelInfo(
        key="verifai-voice-synthetics",
        name="Acoustic Spectral & Synthetic Voice Detector",
        version="1.1.0",
        modality="audio",
        license="MIT",
        source="PyTorch Acoustic Feature Extractor + Librosa/Soundfile DSP",
        architecture="Log-Mel Spectrogram + F0 Jitter / Shimmer / Spectral Centroid Bank",
        supported_modalities=["audio/wav", "audio/mpeg", "audio/ogg", "audio/flac", "audio/aac"],
        is_available=True,
        status="ready",
        false_positive_rate=0.052,
        false_negative_rate=0.065,
        description="Analyzes acoustic speech for phase anomalies, robotic harmonic overtones, zero-crossing irregularities, and missing micro-tremors.",
        limitations="Designed for isolated speech. Music, excessive reverb, or telephony codecs (8kHz) degrade confidence.",
        input_format="16kHz mono audio PCM waveform"
    ),
    "verifai-lipsync-syncnet": ModelInfo(
        key="verifai-lipsync-syncnet",
        name="Audio-Visual Lip-Sync Cross-Correlation Evaluator",
        version="1.0.4",
        modality="lipsync",
        license="MIT",
        source="OpenCV ROI Visual Motion + Audio Energy Envelope Correlator",
        architecture="Lip Vertical/Horizontal Ratio vs Short-Time Audio Energy Cross-Correlation",
        supported_modalities=["video/mp4", "video/webm"],
        is_available=True,
        status="ready",
        false_positive_rate=0.055,
        false_negative_rate=0.070,
        description="Measures temporal alignment between mouth opening geometry and speech energy envelopes to flag desynchronized AI dubbing.",
        limitations="Requires continuous visible mouth for at least 1.5s. Intentional dubbing or accessibility voiceovers create offsets.",
        input_format="Synchronous video frames and audio track"
    ),
    "verifai-tampering-ela": ModelInfo(
        key="verifai-tampering-ela",
        name="Digital Tampering & Forensic Noise Consistency Analyzer",
        version="2.0.0",
        modality="tampering",
        license="Apache-2.0",
        source="VERIFAI Image Forensics Suite",
        architecture="Error Level Analysis (ELA) + PRNU Noise Variance Estimator + Metadata Checker",
        supported_modalities=["image/jpeg", "image/png", "image/tiff"],
        is_available=True,
        status="ready",
        false_positive_rate=0.045,
        false_negative_rate=0.048,
        description="Identifies double JPEG compression artifacts, inconsistent block noise variance, clone/splice edges, and metadata alterations.",
        limitations="Does not prove semantic intent of alteration. Benign crops, color grading, or resizing may alter noise signatures.",
        input_format="Raw binary image buffer"
    )
}

def get_registered_models() -> List[ModelInfo]:
    return list(MODEL_CATALOG.values())

def get_model_info(key: str) -> ModelInfo:
    return MODEL_CATALOG.get(key)
