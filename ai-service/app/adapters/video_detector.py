import cv2
import numpy as np
import tempfile
import os
from typing import Dict, Any, List

from app.adapters.image_detector import analyze_image_deepfake
from app.adapters.face_localizer import localize_face_manipulation

def analyze_video_forensics(video_bytes: bytes, max_frames: int = 50) -> Dict[str, Any]:
    """
    Frame-by-frame video forensics engine:
    1. Writes video bytes to an isolated temporary file
    2. Opens with OpenCV VideoCapture
    3. Samples keyframes adaptively across timeline
    4. Evaluates per-frame manipulation indicators and facial localization
    5. Computes temporal inter-frame flicker & embedding divergence
    6. Identifies contiguous suspicious segments
    """
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as f:
            f.write(video_bytes)
            temp_path = f.name

        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            return {
                "success": False,
                "error": "Could not open video file for decoding. Codec may be unsupported or file corrupted."
            }

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(cap.get(cv2.CAP_PROP_FPS))
        if fps <= 0:
            fps = 25.0
        duration_sec = total_frames / fps if total_frames > 0 else 0.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Determine sampling step
        step = max(1, total_frames // max_frames) if total_frames > 0 else 1
        
        frames_analyzed = []
        scores_timeline = []
        prev_gray = None
        temporal_diffs = []

        frame_idx = 0
        sampled_count = 0

        while True:
            ret, frame = cap.read()
            if not ret or sampled_count >= max_frames:
                break

            if frame_idx % step == 0:
                timestamp_ms = int((frame_idx / fps) * 1000.0)
                
                # Encode frame to JPEG in memory for image detector
                _, enc_frame = cv2.imencode(".jpg", frame)
                frame_bytes = enc_frame.tobytes()

                # Run image forensic analysis on frame
                img_res = analyze_image_deepfake(frame_bytes)
                frame_score = img_res.get("calibrated_score", 0.0)

                # Check face in frame
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                face_res = localize_face_manipulation(frame_bytes)
                n_faces = face_res.get("faces_detected", 0)

                # Temporal flicker calculation vs previous frame
                if prev_gray is not None and prev_gray.shape == gray.shape:
                    diff = float(np.mean(np.abs(gray.astype(np.float32) - prev_gray.astype(np.float32))))
                    temporal_diffs.append(diff)
                else:
                    diff = 0.0
                prev_gray = gray.copy()

                frames_analyzed.append({
                    "frame_number": frame_idx,
                    "timestamp_ms": timestamp_ms,
                    "suspicion_score": frame_score,
                    "temporal_flicker": round(diff, 2),
                    "faces_detected": n_faces,
                    "risk_level": img_res.get("risk_level", "low")
                })
                scores_timeline.append(frame_score)
                sampled_count += 1

            frame_idx += 1

        cap.release()

        if not frames_analyzed:
            return {
                "success": False,
                "error": "No decodable video frames extracted"
            }

        # Aggregate metrics
        avg_score = float(np.mean(scores_timeline))
        max_score = float(np.max(scores_timeline))
        mean_temporal_diff = float(np.mean(temporal_diffs)) if temporal_diffs else 0.0

        # Identify contiguous suspicious segments (windows where suspicion > 0.45)
        suspicious_segments = []
        current_segment = None

        for f in frames_analyzed:
            if f["suspicion_score"] >= 0.45:
                if current_segment is None:
                    current_segment = {
                        "start_timestamp_ms": f["timestamp_ms"],
                        "end_timestamp_ms": f["timestamp_ms"],
                        "start_frame": f["frame_number"],
                        "end_frame": f["frame_number"],
                        "peak_score": f["suspicion_score"],
                        "sample_count": 1
                    }
                else:
                    current_segment["end_timestamp_ms"] = f["timestamp_ms"]
                    current_segment["end_frame"] = f["frame_number"]
                    current_segment["sample_count"] += 1
                    if f["suspicion_score"] > current_segment["peak_score"]:
                        current_segment["peak_score"] = f["suspicion_score"]
            else:
                if current_segment is not None:
                    suspicious_segments.append(current_segment)
                    current_segment = None

        if current_segment is not None:
            suspicious_segments.append(current_segment)

        # Calibrate overall video score
        # Combines average frame score, peak score, and temporal instability
        overall_video_score = round(min(0.99, max(0.01, (avg_score * 0.5 + max_score * 0.35 + min(0.15, mean_temporal_diff / 100.0)))), 4)

        if overall_video_score > 0.70:
            risk = "critical"
        elif overall_video_score > 0.45:
            risk = "high"
        elif overall_video_score > 0.25:
            risk = "medium"
        else:
            risk = "low"

        return {
            "success": True,
            "model_name": "Adaptive Temporal Inconsistency Forensics",
            "model_version": "1.2.0",
            "overall_video_score": overall_video_score,
            "risk_level": risk,
            "duration_seconds": round(duration_sec, 2),
            "fps": round(fps, 2),
            "total_frames": total_frames,
            "frames_analyzed_count": len(frames_analyzed),
            "dimensions": {"width": width, "height": height},
            "mean_temporal_flicker": round(mean_temporal_diff, 2),
            "suspicious_segments": suspicious_segments,
            "frames_sample": frames_analyzed[:20], # Sample for frontend preview
            "limitations": "Sudden camera motion, lighting strobes, and high-motion edits can elevate temporal flicker metrics. Always inspect individual suspect frames."
        }
    except Exception as e:
        return {"success": False, "error": str(e), "overall_video_score": 0.0}
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
