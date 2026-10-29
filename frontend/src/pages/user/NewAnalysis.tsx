import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileCheck2,
  AlertCircle,
  ShieldCheck,
  Video,
  Image as ImageIcon,
  Mic,
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { apiRequest } from "../../services/api";

export const NewAnalysis: React.FC = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setError(null);
    if (file.size > 104857600) {
      setError("File exceeds maximum allowed upload size of 100 MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Upload media
      setCurrentStep("Uploading media to private encrypted vault...");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await apiRequest("/media/upload", {
        method: "POST",
        body: formData
      });

      if (!uploadRes.success || !uploadRes.asset) {
        throw new Error(uploadRes.error || "Media upload failed. Magic byte validation rejected.");
      }

      const assetId = uploadRes.asset.id;

      // Step 2: Trigger multimodal inference
      setCurrentStep("Executing neural deepfake inference & C2PA provenance extraction...");
      const analysisRes = await apiRequest(`/analysis/submit/${assetId}`, {
        method: "POST"
      });

      if (!analysisRes.success || !analysisRes.analysis) {
        throw new Error(analysisRes.error || "Forensic analysis failed.");
      }

      // Step 3: Complete & redirect to results
      setCurrentStep("Evidence sealed in cryptographic chain of custody. Loading findings...");
      setTimeout(() => {
        navigate(`/portal/user/results/${analysisRes.analysis._id}`);
      }, 800);
    } catch (err: any) {
      setError(err.message || "An error occurred during forensic execution.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Submit Media Asset for Forensic Analysis</h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload images, video clips, or audio tracks. Evaluated with Vision Transformers, ELA, C2PA provenance, and hash chaining.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleFileDrop}
        className={`cyber-card p-10 rounded-2xl border-2 border-dashed text-center transition ${
          isDragOver
            ? "border-cyan-400 bg-cyan-950/20"
            : selectedFile
            ? "border-cyan-500/40 bg-[#0b1222]"
            : "border-cyan-500/20 hover:border-cyan-500/40"
        }`}
      >
        <input
          type="file"
          id="media-file-input"
          className="hidden"
          accept="image/*,video/*,audio/*"
          onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
        />

        {selectedFile ? (
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <FileCheck2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white truncate">{selectedFile.name}</h4>
              <span className="text-xs text-slate-400 block mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type || "binary payload"}
              </span>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 transition"
              >
                Choose Different File
              </button>
            </div>
          </div>
        ) : (
          <label htmlFor="media-file-input" className="cursor-pointer block space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-200 block">Click to browse or drag &amp; drop media asset</span>
              <span className="text-xs text-slate-500 mt-1 block">
                JPEG, PNG, WebP, MP4, WebM, WAV, MP3 (Up to 100 MB)
              </span>
            </div>
          </label>
        )}
      </div>

      {/* Progress State */}
      {loading && (
        <div className="cyber-card p-6 rounded-xl space-y-3 border border-cyan-500/30">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono text-cyan-300 font-semibold">{currentStep}</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-3/4 animate-pulse" />
          </div>
        </div>
      )}

      {/* Submit Button */}
      {selectedFile && !loading && (
        <button
          onClick={handleUploadAndAnalyze}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transition"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Execute Multi-Model Forensic Analysis</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      )}

      {/* Zero Training Notice */}
      <div className="p-4 rounded-xl bg-[#090e1a] border border-cyan-500/10 flex items-start gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-300 block mb-0.5">Zero Training Guarantee</strong>
          Media is processed strictly for forensic feature calculation and immediately assigned a tamper-evident SHA-256 fingerprint. No uploads are retained for generative AI model training.
        </div>
      </div>
    </div>
  );
};
