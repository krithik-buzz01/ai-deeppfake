import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Mic, ShieldCheck, AlertCircle, Play, Square, Loader2, ArrowRight } from "lucide-react";
import { apiRequest } from "../../services/api";

export const LiveCapture: React.FC = () => {
  const navigate = useNavigate();

  const [streamActive, setStreamActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const handleStartCamera = async () => {
    if (!consentGiven) {
      setError("Explicit user consent is required before initializing camera and microphone hardware.");
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err: any) {
      setError(`Hardware access error: ${err.message}. Ensure camera and microphone permissions are granted.`);
    }
  };

  const handleStartRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
    };

    recorder.start(100);
    setRecording(true);
    setRecordingSeconds(0);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 6) {
          handleStopRecording();
          return 6;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!recordedBlob) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", recordedBlob, `live_capture_${Date.now()}.webm`);
      formData.append("isLiveCapture", "true");

      const uploadRes = await apiRequest("/media/upload", {
        method: "POST",
        body: formData
      });

      if (!uploadRes.success || !uploadRes.asset) {
        throw new Error(uploadRes.error || "Live capture upload failed.");
      }

      const analysisRes = await apiRequest(`/analysis/submit/${uploadRes.asset.id}`, {
        method: "POST"
      });

      if (!analysisRes.success || !analysisRes.analysis) {
        throw new Error(analysisRes.error || "Analysis failed.");
      }

      navigate(`/portal/user/results/${analysisRes.analysis._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to process live capture.");
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Live Camera Authenticity Inspection</h1>
        <p className="text-xs text-slate-400 mt-1">
          Capture user-initiated audio-visual media in real time to analyze facial coherence and replay artifacts.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Consent Check */}
      <div className="p-4 rounded-xl bg-[#0d1527] border border-cyan-500/20">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500"
          />
          <div className="text-xs text-slate-300">
            <strong className="text-white block mb-0.5">Explicit Hardware Consent</strong>
            I grant permission to access my local camera and microphone for a short 5-second authenticity capture.
          </div>
        </label>
      </div>

      {/* Video Viewport Card */}
      <div className="cyber-card p-6 rounded-2xl text-center space-y-4">
        <div className="relative aspect-video max-w-lg mx-auto bg-black rounded-xl overflow-hidden border border-cyan-500/30 flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!streamActive && (
            <div className="text-slate-600 text-xs flex flex-col items-center gap-2">
              <Camera className="w-8 h-8 text-slate-600" />
              <span>Camera Stream Inactive</span>
            </div>
          )}
          {recording && (
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-rose-950/80 border border-rose-500/50 px-2.5 py-1 rounded-full text-[10px] font-mono text-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>REC 00:0{recordingSeconds} / 00:06</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          {!streamActive ? (
            <button
              onClick={handleStartCamera}
              disabled={!consentGiven}
              className="flex items-center gap-2 bg-cyan-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-cyan-400 transition disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>Initialize Camera Stream</span>
            </button>
          ) : !recording && !recordedBlob ? (
            <button
              onClick={handleStartRecording}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Record 5-Second Verification Clip</span>
            </button>
          ) : recording ? (
            <button
              onClick={handleStopRecording}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Recording</span>
            </button>
          ) : (
            <button
              onClick={handleUploadAndAnalyze}
              disabled={processing}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Live Capture...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Analyze Live Capture</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Truthful Disclaimer Notice */}
      <div className="p-4 rounded-xl bg-[#090e1a] border border-cyan-500/15 text-[11px] text-slate-400 leading-relaxed">
        <strong>Important Liveness Disclosure:</strong> Direct browser camera capture authenticates that media originated from a user session. However, browser capture alone does NOT prove physical biometric liveness or subject identity, as virtual webcams or video replay attacks can feed synthetic signals.
      </div>
    </div>
  );
};
