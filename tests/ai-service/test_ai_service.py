import io
import pytest
import numpy as np
from PIL import Image
import soundfile as sf
from fastapi.testclient import TestClient

from app.main import app
from app.models.registry import get_registered_models, get_model_info
from app.forensics.ela import perform_ela
from app.forensics.frequency_analysis import analyze_frequency_domain
from app.forensics.noise_consistency import analyze_noise_consistency
from app.forensics.audio_spectrogram import extract_audio_features
from app.forensics.lipsync_syncnet import compute_lipsync_correlation

client = TestClient(app)

def generate_test_image_bytes(width=256, height=256, color=(128, 128, 128)):
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()

def generate_test_audio_bytes(duration_sec=1.0, sr=16000, freq=440.0):
    t = np.linspace(0, duration_sec, int(sr * duration_sec), endpoint=False)
    # Sine wave with gentle modulation
    audio = 0.5 * np.sin(2 * np.pi * freq * t)
    buf = io.BytesIO()
    sf.write(buf, audio, sr, format="WAV")
    return buf.getvalue()

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "torch_version" in data
    assert data["registered_models_count"] >= 6

def test_model_registry_endpoints():
    response = client.get("/models")
    assert response.status_code == 200
    models = response.json()
    assert len(models) >= 6
    assert any(m["key"] == "verifai-vision-vit" for m in models)

    single_res = client.get("/models/verifai-vision-vit")
    assert single_res.status_code == 200
    assert single_res.json()["license"] == "Apache-2.0"

def test_ela_forensics():
    img_bytes = generate_test_image_bytes()
    res = perform_ela(img_bytes)
    assert res["success"] is True
    assert "ela_score" in res
    assert 0.0 <= res["ela_score"] <= 1.0

def test_frequency_domain_forensics():
    img = np.ones((128, 128, 3), dtype=np.uint8) * 128
    res = analyze_frequency_domain(img)
    assert res["success"] is True
    assert "frequency_artifact_score" in res

def test_noise_consistency():
    img = np.random.randint(50, 200, (128, 128, 3), dtype=np.uint8)
    res = analyze_noise_consistency(img)
    assert res["success"] is True
    assert "noise_inconsistency_score" in res

def test_audio_spectrogram_forensics():
    audio_bytes = generate_test_audio_bytes()
    res = extract_audio_features(audio_bytes)
    assert res["success"] is True
    assert "synthetic_voice_score" in res
    assert 0.0 <= res["synthetic_voice_score"] <= 1.0

def test_lipsync_cross_correlation():
    mouth_ratios = [0.2, 0.25, 0.4, 0.6, 0.5, 0.3, 0.2, 0.18, 0.35, 0.5, 0.4, 0.2]
    audio_energy = [0.1, 0.20, 0.5, 0.8, 0.6, 0.2, 0.1, 0.15, 0.40, 0.7, 0.5, 0.1]
    res = compute_lipsync_correlation(mouth_ratios, audio_energy, fps=25.0)
    assert res["success"] is True
    assert "offset_ms" in res
    assert "sync_confidence" in res

def test_detect_image_endpoint():
    img_bytes = generate_test_image_bytes()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    response = client.post("/detect/image", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "deepfake_analysis" in data
    assert "face_localization" in data
    assert "tampering_analysis" in data
    assert data["deepfake_analysis"]["calibrated_score"] >= 0.0

def test_detect_audio_endpoint():
    audio_bytes = generate_test_audio_bytes()
    files = {"file": ("test.wav", audio_bytes, "audio/wav")}
    response = client.post("/detect/audio", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "audio_forensics" in data
    assert data["audio_forensics"]["synthetic_voice_score"] >= 0.0

def test_detect_tampering_endpoint():
    img_bytes = generate_test_image_bytes()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    response = client.post("/detect/tampering", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "tampering_analysis" in data
    assert "tampering_score" in data["tampering_analysis"]
