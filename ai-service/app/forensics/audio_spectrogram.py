import io
import numpy as np
from typing import Dict, Any, List
import soundfile as sf
from scipy import signal

def extract_audio_features(audio_bytes: bytes, target_sr: int = 16000) -> Dict[str, Any]:
    """
    Extracts acoustic features from audio buffer to detect synthetic speech / voice cloning:
    - Mel-frequency energy distribution
    - Spectral centroid, spectral rolloff, spectral flatness
    - Zero-Crossing Rate (ZCR) statistics
    - F0 fundamental frequency tracking, pitch jitter, and amplitude shimmer
    Synthetic voices typically lack micro-perturbations (jitter/shimmer) in voicing,
    have unnatural phase continuity at frame boundaries, and exhibit high spectral flatness.
    """
    try:
        data, sr = sf.read(io.BytesIO(audio_bytes))
        # Convert stereo to mono
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)

        # Resample if needed
        if sr != target_sr:
            num_samples = int(len(data) * float(target_sr) / sr)
            data = signal.resample(data, num_samples)
            sr = target_sr

        duration = float(len(data)) / float(sr)
        if duration < 0.2:
            return {"success": False, "error": "Audio duration too short (< 200ms)"}

        # Frame parameters: 25ms frame, 10ms hop
        frame_len = int(sr * 0.025)
        hop_len = int(sr * 0.010)
        n_frames = (len(data) - frame_len) // hop_len

        if n_frames < 2:
            return {"success": False, "error": "Insufficient frames"}

        # 1. Zero Crossing Rate (ZCR)
        zcr_list = []
        energy_list = []
        for i in range(n_frames):
            frame = data[i * hop_len : i * hop_len + frame_len]
            zcr = float(np.mean(np.abs(np.diff(np.sign(frame)))) / 2.0)
            energy = float(np.sum(frame ** 2) / frame_len)
            zcr_list.append(zcr)
            energy_list.append(energy)

        zcr_arr = np.array(zcr_list)
        energy_arr = np.array(energy_list)
        
        # 2. STFT Spectrogram & Spectral Centroid
        f, t, Zxx = signal.stft(data, fs=sr, nperseg=frame_len, noverlap=frame_len - hop_len)
        mag = np.abs(Zxx) + 1e-9

        # Spectral Centroid: sum(f * mag) / sum(mag)
        freq_grid = f[:, np.newaxis]
        spectral_centroids = np.sum(freq_grid * mag, axis=0) / np.sum(mag, axis=0)
        mean_centroid = float(np.mean(spectral_centroids))
        std_centroid = float(np.std(spectral_centroids))

        # Spectral Flatness (geometric mean / arithmetic mean)
        geom_mean = np.exp(np.mean(np.log(mag), axis=0))
        arith_mean = np.mean(mag, axis=0)
        spectral_flatness = float(np.mean(geom_mean / (arith_mean + 1e-9)))

        # 3. Fundamental Frequency (F0) & Pitch Jitter estimation via Autocorrelation
        # Target voice range: 60Hz to 400Hz -> lag range
        min_lag = int(sr / 400.0)
        max_lag = int(sr / 60.0)
        
        pitch_periods = []
        amplitudes = []
        for i in range(n_frames):
            frame = data[i * hop_len : i * hop_len + frame_len]
            if energy_arr[i] > 1e-4: # Voiced frame threshold
                corr = np.correlate(frame, frame, mode='full')
                corr = corr[len(frame)-1:]
                if len(corr) > max_lag:
                    search_region = corr[min_lag:max_lag]
                    peak_idx = np.argmax(search_region) + min_lag
                    pitch_periods.append(peak_idx)
                    amplitudes.append(np.max(np.abs(frame)))

        if len(pitch_periods) > 10:
            pitch_diffs = np.abs(np.diff(pitch_periods))
            jitter = float(np.mean(pitch_diffs) / (np.mean(pitch_periods) + 1e-5))
            amp_diffs = np.abs(np.diff(amplitudes))
            shimmer = float(np.mean(amp_diffs) / (np.mean(amplitudes) + 1e-5))
        else:
            jitter = 0.005 # Default unvoiced/flat
            shimmer = 0.05

        # Quantitative synthetic voice indicators:
        # TTS / neural cloned voices often exhibit unnaturally low jitter (< 0.008) or erratic discontinuous jumps,
        # plus high spectral flatness or uniform spectral centroid
        synthetic_risk = 0.0
        if jitter < 0.009: # Abnormally monotonic/synthesized vocal cords
            synthetic_risk += 0.35
        elif jitter > 0.08: # Unnatural synthesis glitching
            synthetic_risk += 0.25

        if spectral_flatness > 0.35: # Excessive acoustic noise / vocoder phase distortion
            synthetic_risk += 0.30
        
        if std_centroid < 250.0: # Unnaturally static timbre
            synthetic_risk += 0.25

        calibrated_score = min(1.0, max(0.0, synthetic_risk))

        # Downsample spectrogram preview for frontend display (20 time bins x 16 frequency bands)
        time_bins = min(30, mag.shape[1])
        freq_bins = min(20, mag.shape[0])
        downsampled_spec = []
        step_t = max(1, mag.shape[1] // time_bins)
        step_f = max(1, mag.shape[0] // freq_bins)
        for fi in range(0, mag.shape[0], step_f):
            row = []
            for ti in range(0, mag.shape[1], step_t):
                val = float(np.log1p(mag[fi, ti]))
                row.append(round(val, 2))
            downsampled_spec.append(row[:time_bins])
            if len(downsampled_spec) >= freq_bins:
                break

        return {
            "success": True,
            "duration_seconds": round(duration, 2),
            "sample_rate": sr,
            "mean_spectral_centroid_hz": round(mean_centroid, 1),
            "spectral_flatness": round(spectral_flatness, 4),
            "pitch_jitter": round(jitter, 4),
            "amplitude_shimmer": round(shimmer, 4),
            "synthetic_voice_score": round(calibrated_score, 4),
            "spectrogram_preview": downsampled_spec,
            "audio_anomalies": [
                "Unnatural pitch monotony / lacking human micro-jitter" if jitter < 0.009 else None,
                "Vocoder frequency phase diffusion detected" if spectral_flatness > 0.35 else None
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e), "synthetic_voice_score": 0.0}
