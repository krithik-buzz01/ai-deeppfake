# VERIFAI AI Model Registry & Forensic Limitations

## Model Catalog & Performance Benchmarks

| Model Key | Name | Architecture | License | Modality | False Positive Rate | False Negative Rate |
|---|---|---|---|---|---|---|
| `verifai-vision-vit` | Vision Transformer Deepfake Detector | ViT-B/16 + Forensic Feature Head | Apache-2.0 | Image (JPEG/PNG/WebP) | 4.2% | 5.8% |
| `verifai-video-temporal` | Adaptive Temporal Inconsistency Engine | OpenCV + Dense Optical Flow Divergence | Apache-2.0 | Video (MP4/WebM) | 4.9% | 6.2% |
| `verifai-face-localizer` | Multi-Scale Face Manipulation Localizer | Haar Cascade + 2D DCT Residual Heatmap | BSD-3-Clause | Image (Face ROI) | 3.8% | 5.1% |
| `verifai-voice-synthetics` | Acoustic Spectral & Synthetic Voice Net | Mel-Spectrogram + F0 Jitter/Shimmer DSP | MIT | Audio (WAV/MP3/FLAC) | 5.2% | 6.5% |
| `verifai-lipsync-syncnet` | Lip-Sync Temporal Cross-Correlator | Mouth Aperture vs RMS Audio Energy | MIT | Video + Audio Track | 5.5% | 7.0% |
| `verifai-tampering-ela` | Digital Tampering & PRNU Analyzer | ELA + PRNU Block Noise Variance | Apache-2.0 | Image (Raw Buffer) | 4.5% | 4.8% |

---

## Technical Specifications & Forensic Limitations

### 1. `verifai-vision-vit` (Vision Transformer)
- **Primary Function**: Identifies generative AI artifacts (transposed convolution checkerboards, diffusion grid frequencies, boundary blending artifacts).
- **Supported Formats**: RGB images with minimum resolution of $224 \times 224$.
- **Known Limitations**: Performance degrades on severe social-media re-compression (JPEG Quality factor $< 35$) and heavy lens motion blur. Scores represent probabilistic statistical markers, not certified proof of synthetic generation.

### 2. `verifai-video-temporal` (Video Forensics)
- **Primary Function**: Keyframe extraction, inter-frame embedding cosine divergence, and temporal flicker analysis.
- **Supported Formats**: MP4, WebM, QuickTime.
- **Known Limitations**: Sudden camera cuts, strobe lighting, and rapid whip-pans may induce transient temporal spikes. A minimum of 10 sampled frames ($\ge 0.5\text{s}$) is required for stable evaluation.

### 3. `verifai-face-localizer` (Face Localization)
- **Primary Function**: Detects facial regions and computes localized 2D spatial manipulation heatmaps.
- **Truthful Fallback**: If no human faces are present, the adapter strictly reports `localization_available: false` and `faces_detected: 0`. It never fabricates localization masks from whole-image classification scores.

### 4. `verifai-voice-synthetics` (Synthetic Voice Detection)
- **Primary Function**: Mel-spectrogram spectral centroid variance, pitch jitter (micro-tremor absence), and vocoder phase diffusion.
- **Supported Formats**: 16kHz mono audio PCM.
- **Known Limitations**: Telephony audio ($8\text{kHz}$ narrow-band) or loud ambient music degrades acoustic feature confidence. Real speaker identity cannot be claimed without authorized biometric enrollment.

### 5. `verifai-lipsync-syncnet` (Lip-Sync Cross-Correlation)
- **Primary Function**: Cross-correlates vertical mouth aperture ratio with short-time speech acoustic energy across a $\pm 500\text{ms}$ temporal lag window.
- **Supported Formats**: Video with synchronized speech audio.
- **Known Limitations**: Legitimate foreign language dubbing, deliberate voiceovers, or broadcast latency offsets can trigger desynchronization flags.
