import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Video,
  Image as ImageIcon,
  Mic,
  Fingerprint,
  FileCheck2,
  Lock,
  Layers,
  Search,
  Camera,
  Activity,
  FileText,
  Users2,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle,
  Eye,
  Crosshair,
  BadgeAlert,
  ArrowRight
} from "lucide-react";
import { Navbar } from "../../components/Navbar";

export const Home: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<"image" | "authentic" | "audio">("image");

  const features = [
    {
      num: "01",
      title: "Multimodal Deepfake Detection",
      desc: "High-throughput detection for image, video, and audio using Vision Transformer neural models and calibrated probabilities.",
      icon: Eye,
      tag: "Image / Video / Audio"
    },
    {
      num: "02",
      title: "Frame-by-Frame Video Forensics",
      desc: "Adaptive keyframe sampling tracking temporal flicker, motion inconsistencies, and suspicious sequence timelines.",
      icon: Video,
      tag: "Video Timeline"
    },
    {
      num: "03",
      title: "Face Manipulation Localization",
      desc: "Bounding box facial ROI extraction with normalized manipulation heatmaps. Truthful fallback when no faces are detected.",
      icon: Crosshair,
      tag: "Facial ROI"
    },
    {
      num: "04",
      title: "AI-Generated Voice Detection",
      desc: "Acoustic Mel-spectrogram analysis measuring pitch jitter, shimmer, spectral centroid variance, and vocoder phase diffusion.",
      icon: Mic,
      tag: "Synthetic Speech"
    },
    {
      num: "05",
      title: "Audio-Video Lip-Sync Consistency",
      desc: "Evaluates mouth vertical aperture cross-correlation with short-time speech acoustic energy envelopes.",
      icon: Activity,
      tag: "Lip-Sync SyncNet"
    },
    {
      num: "06",
      title: "Content Credentials & C2PA",
      desc: "Cryptographic manifest signature extraction, certifying hardware secure enclave provenance and XMP editing histories.",
      icon: FileCheck2,
      tag: "C2PA Provenance"
    },
    {
      num: "07",
      title: "Digital Tampering & ELA",
      desc: "Error Level Analysis (ELA) and PRNU noise variance homogeneity across tiles, isolating spliced or inpainted elements.",
      icon: Layers,
      tag: "Physical Forensics"
    },
    {
      num: "08",
      title: "Cross-Modal Intelligence",
      desc: "Structured evidence synthesis combining acoustic, visual, and metadata signals; exposes conflicts without fabricating false truth.",
      icon: Sparkles,
      tag: "Ensemble Fusion"
    },
    {
      num: "09",
      title: "Media Fingerprints & Duplicates",
      desc: "SHA-256 cryptographic hashes combined with 64-bit dHash perceptual hashing to identify exact and approximate duplicates.",
      icon: Fingerprint,
      tag: "Perceptual dHash"
    },
    {
      num: "10",
      title: "Live Camera Authenticity Check",
      desc: "User-initiated camera and microphone capture with explicit consent, measuring replay and playback anomalies.",
      icon: Camera,
      tag: "Live Capture"
    },
    {
      num: "11",
      title: "Source & Claim Workspace",
      desc: "Extracts factual assertions and queries public journalistic fact-checking repositories with linked evidence.",
      icon: Search,
      tag: "Claim Verification"
    },
    {
      num: "12",
      title: "Explainable AI Forensics Panel",
      desc: "Detailed breakdowns showing model names, versions, input preprocessing, 95% confidence intervals, and limitations.",
      icon: Activity,
      tag: "Explainable AI"
    },
    {
      num: "13",
      title: "Batch Media Investigation",
      desc: "High-volume media queue backed by Redis and BullMQ workers with idempotent retries and progress tracking.",
      icon: Layers,
      tag: "BullMQ Queue"
    },
    {
      num: "14",
      title: "Evidence Chain & Forensic Reports",
      desc: "Audit-grade downloadable PDF reports with cryptographic SHA-256 hash chaining adhering to ISO/IEC 27037 custody guidelines.",
      icon: FileText,
      tag: "Tamper Chain PDF"
    },
    {
      num: "15",
      title: "Human Review & Collaboration",
      desc: "Analyst workspace enabling frame annotations, peer review, second opinion requests, and report approvals.",
      icon: Users2,
      tag: "Analyst Workspace"
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500 selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 border-b border-cyan-500/15 cyber-grid cyber-radial-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Eyebrow / Security Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-xs font-mono mb-8 shadow-lg shadow-cyan-500/15 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="tracking-wider uppercase font-semibold">AI DEEPFAKE DETECTION &amp; EVIDENCE CHAIN OF CUSTODY</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight drop-shadow-sm">
            Verify Truth in the Age of <span className="cyber-gradient-text drop-shadow-md">Synthetic Media</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto leading-relaxed font-normal">
            Enterprise forensic intelligence for multimodal deepfake detection, frame-by-frame temporal tracking, C2PA Content Credentials provenance, and tamper-evident evidence preservation.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="flex items-center gap-2.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold px-7 py-3.5 rounded-xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:-translate-y-0.5 transition duration-200"
            >
              <span>Create Investigation Vault</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#demonstration"
              className="flex items-center gap-2.5 bg-[#0d1527]/90 hover:bg-[#131f3b] text-slate-100 border border-cyan-500/30 hover:border-cyan-400/60 px-7 py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition duration-200"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Explore Live Demonstration</span>
            </a>
          </div>

          {/* Quick Architecture Indicators */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="cyber-card p-5 group hover:border-cyan-400/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">Inference Engine</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              </div>
              <span className="text-lg font-bold text-white mt-1.5 block group-hover:text-cyan-300 transition">PyTorch + ViT</span>
              <span className="text-xs text-slate-400 mt-1 block">Vision Transformer artifact detection</span>
            </div>
            <div className="cyber-card p-5 group hover:border-cyan-400/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">Video Timeline</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              </div>
              <span className="text-lg font-bold text-white mt-1.5 block group-hover:text-cyan-300 transition">Frame-by-Frame</span>
              <span className="text-xs text-slate-400 mt-1 block">Inter-frame temporal divergence</span>
            </div>
            <div className="cyber-card p-5 group hover:border-cyan-400/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">Provenance</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              </div>
              <span className="text-lg font-bold text-white mt-1.5 block group-hover:text-cyan-300 transition">C2PA Verified</span>
              <span className="text-xs text-slate-400 mt-1 block">Hardware signature validation</span>
            </div>
            <div className="cyber-card p-5 group hover:border-cyan-400/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">Evidence Custody</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              </div>
              <span className="text-lg font-bold text-white mt-1.5 block group-hover:text-cyan-300 transition">ISO/IEC 27037</span>
              <span className="text-xs text-slate-400 mt-1 block">Cryptographic hash-chained logs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration Section */}
      <section id="demonstration" className="py-24 border-b border-cyan-500/10 bg-[#090e1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-2">Live Demonstration Sandbox</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white">Inspect Real Forensic AI Outputs</h3>
            <p className="mt-3 text-sm text-slate-400">
              Select one of the verified sample media assets below to inspect the multimodal inference models, error level analysis, and calibrated confidence intervals.
            </p>
          </div>

          {/* Demo Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setActiveDemo("image")}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition duration-200 ${
                activeDemo === "image"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-bold"
                  : "bg-[#0d1527] text-slate-300 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#131f3b]"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Manipulated Facial Swap (Image)</span>
            </button>
            <button
              onClick={() => setActiveDemo("authentic")}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition duration-200 ${
                activeDemo === "authentic"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-bold"
                  : "bg-[#0d1527] text-slate-300 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#131f3b]"
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Authentic DSLR Capture (C2PA Signed)</span>
            </button>
            <button
              onClick={() => setActiveDemo("audio")}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition duration-200 ${
                activeDemo === "audio"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-bold"
                  : "bg-[#0d1527] text-slate-300 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#131f3b]"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>AI-Cloned Speech (Audio)</span>
            </button>
          </div>

          {/* Demo Viewer Card */}
          <div className="max-w-4xl mx-auto rounded-2xl cyber-card p-6 sm:p-8 shadow-2xl border border-cyan-500/25">
            {activeDemo === "image" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-cyan-500/15">
                  <div>
                    <span className="text-[11px] font-mono text-rose-400 bg-rose-950/70 border border-rose-500/40 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      CRITICAL RISK · 88.4% CALIBRATED MANIPULATION PROBABILITY
                    </span>
                    <h4 className="text-xl font-bold text-white mt-3">Diffusion &amp; Face-Swap Boundary Anomaly</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">SHA-256 Hash</span>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded mt-1 inline-block">9f8e7d6c5b...3a1b</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Left: Forensic metrics */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#070b14] border border-cyan-500/10">
                      <span className="text-xs text-slate-400 block">Vision Transformer (ViT-B/16) Deepfake Detector</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-rose-400">0.912</span>
                        <span className="text-xs text-slate-500">95% CI: [0.865 - 0.959]</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Detected transposed convolution grid patterns and high-frequency edge blending discontinuities along facial contour.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#070b14] border border-cyan-500/10">
                      <span className="text-xs text-slate-400 block">Error Level Analysis (ELA)</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-amber-400">0.785</span>
                        <span className="text-xs text-slate-500">Anomaly Ratio: 14.8%</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        JPEG recompression error levels in facial ROI diverge markedly from background, indicating multi-source splicing.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#070b14] border border-cyan-500/10">
                      <span className="text-xs text-slate-400 block">C2PA Provenance Status</span>
                      <span className="text-sm font-semibold text-slate-300 mt-1 block">Absent Credentials</span>
                      <p className="text-xs text-slate-500 mt-1">
                        No embedded hardware signature found. (Note: Missing metadata alone does not prove alteration).
                      </p>
                    </div>
                  </div>

                  {/* Right: Explanatory forensic signals */}
                  <div className="p-5 rounded-xl bg-[#070b14] border border-cyan-500/15 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">Detected Forensic Signals</h5>
                      <ul className="space-y-2.5 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>Non-uniform PRNU tile noise variance between facial oval and ambient backdrop</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>High-frequency periodic spectral peak in 2D FFT magnitude spectrum (peak ratio 5.12)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>Boundary gradient discontinuity on mandibular contour</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                      Disclaimer: AI scores are empirical probabilities, not legal certitude. Re-encoding can introduce noise.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDemo === "authentic" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-cyan-500/10">
                  <div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase">
                      VERIFIED AUTHENTIC · 3.1% CALIBRATED MANIPULATION PROBABILITY
                    </span>
                    <h4 className="text-lg font-bold text-white mt-2">Hardware Secure Enclave C2PA Capture</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">C2PA Signature</span>
                    <span className="text-[11px] font-mono text-emerald-400">ES256 Validated</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#070b14] border border-cyan-500/10">
                      <span className="text-xs text-slate-400 block">C2PA Content Credentials</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold text-emerald-400">Verified Origin</span>
                        <span className="text-xs text-slate-500">Truepic Secure CA</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Cryptographic signature generated at camera sensor level with tamper-proof certificate chain.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#070b14] border border-cyan-500/10">
                      <span className="text-xs text-slate-400 block">2D Spectral Fourier Analysis</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold text-emerald-400">Natural Power Falloff</span>
                        <span className="text-xs text-slate-500">1/f Slope: -0.018</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Radial power spectrum exhibits continuous, natural optical sensor decay with 0 periodic grid artifacts.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#070b14] border border-cyan-500/15 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">Authenticity Indicators</h5>
                      <ul className="space-y-2.5 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Consistent sensor PRNU noise variance across all 32x32 image blocks</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Zero localized double JPEG quantization grids detected</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Valid EXIF capture timestamps aligned with secure hardware clock</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                      Evidence sealed with SHA-256 hash and appended to VERIFAI tamper-evident custody log.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDemo === "audio" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-cyan-500/10">
                  <div>
                    <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded font-bold uppercase">
                      HIGH RISK · 78.2% SYNTHETIC VOICE PROBABILITY
                    </span>
                    <h4 className="text-lg font-bold text-white mt-2">Neural Voice Clone &amp; Vocoder Synthesis</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">Sample Rate</span>
                    <span className="text-[11px] font-mono text-cyan-400">16,000 Hz Mono</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#070b14] border border-cyan-500/10">
                      <span className="text-xs text-slate-400 block">Pitch Jitter &amp; Micro-tremor Analysis</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-rose-400">0.0041</span>
                        <span className="text-xs text-slate-500">Human Baseline: &gt; 0.012</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Vocal pitch displays abnormal mathematical monotony, lacking natural involuntary neuromuscular micro-tremors.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#070b14] border border-cyan-500/10">
                      <span className="text-xs text-slate-400 block">Spectral Flatness &amp; Phase Diffusion</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-amber-400">0.412</span>
                        <span className="text-xs text-slate-500">Vocoder Flagged</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        HiFi-GAN / WaveGlow neural vocoder synthesis artifacts detected in high-frequency harmonic overtones.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#070b14] border border-cyan-500/15 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">Acoustic Indicators</h5>
                      <ul className="space-y-2.5 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>Neural speech synthesis harmonic artifacts above 4,000 Hz</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>Zero-crossing rate discontinuity at synthetic frame stitching points</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                      Notice: Audio forensics does not claim speaker identity without authorized biometric enrollment.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 15 Features Grid */}
      <section id="features" className="py-24 border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-2">Comprehensive Forensics Suite</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white">15 Integrated Forensic Verification Capabilities</h3>
            <p className="mt-3 text-sm text-slate-400">
              Each feature operates with real neural inference, algorithmic signal processing, and server-side cryptographic audit trails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.num} className="cyber-card p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#0f1933] border border-cyan-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="font-mono text-xs text-cyan-500 font-bold">{f.num}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded">
                      {f.tag}
                    </span>
                    <h4 className="text-base font-bold text-white mt-3 mb-2">{f.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-cyan-500/10 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                    <span>STATUS: OPERATIONAL</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="how-it-works" className="py-24 border-b border-cyan-500/10 bg-[#090e1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-2">Evidence Lifecycle</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white">How VERIFAI Verifies Media</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-cyan-500/20">
              <span className="font-mono text-cyan-400 font-bold text-sm">PHASE 01</span>
              <h4 className="text-base font-bold text-white mt-2 mb-2">Magic Bytes &amp; Ingestion</h4>
              <p className="text-xs text-slate-400">
                Binary content signatures are validated at byte level, rejecting disguised executables. Cryptographic SHA-256 and perceptual dHash are generated.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-cyan-500/20">
              <span className="font-mono text-cyan-400 font-bold text-sm">PHASE 02</span>
              <h4 className="text-base font-bold text-white mt-2 mb-2">Multimodal Inference</h4>
              <p className="text-xs text-slate-400">
                Media passes to isolated Python inference workers running Vision Transformers, temporal video trackers, Mel-spectrogram DSP, and face localizers.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-cyan-500/20">
              <span className="font-mono text-cyan-400 font-bold text-sm">PHASE 03</span>
              <h4 className="text-base font-bold text-white mt-2 mb-2">Provenance &amp; C2PA</h4>
              <p className="text-xs text-slate-400">
                JUMBF metadata boxes and XMP editing histories are parsed against trusted root certificates to verify device origin without false assumptions.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-cyan-500/20">
              <span className="font-mono text-cyan-400 font-bold text-sm">PHASE 04</span>
              <h4 className="text-base font-bold text-white mt-2 mb-2">Evidence Custody &amp; PDF</h4>
              <p className="text-xs text-slate-400">
                Findings are sealed in a tamper-evident SHA-256 audit log and compiled into downloadable forensic PDF reports with confidence limitations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee & Dual Verification */}
      <section id="privacy" className="py-20 border-b border-cyan-500/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-[#0d1527] to-[#121c38] border border-cyan-500/30 p-8 sm:p-12 shadow-xl shadow-cyan-500/5">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-3">
              <Lock className="w-4 h-4" />
              <span>Zero-Trust Privacy &amp; Real Authentication Policy</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">Security Without Compromise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 text-xs text-slate-300 leading-relaxed">
              <div>
                <strong className="text-white block text-sm mb-1">Zero Training on User Media</strong>
                <p>
                  Uploaded media assets are never used to train public or commercial AI models. Your files remain isolated in private storage with expiring signed URLs and can be permanently purged upon request.
                </p>
              </div>
              <div>
                <strong className="text-white block text-sm mb-1">Dual Ownership Authentication</strong>
                <p>
                  Account activation requires cryptographic ownership verification of BOTH email and mobile phone number via independent one-time codes. No bypass codes or fake fallbacks exist in production.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#050810] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-bold tracking-wider">VERIFAI</span>
            <span>&mdash; Media Forensic Intelligence</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/#privacy" className="hover:text-cyan-400 transition">Privacy Policy</Link>
            <Link to="/#how-it-works" className="hover:text-cyan-400 transition">ISO/IEC 27037 Standard</Link>
            <Link to="/login" className="hover:text-cyan-400 transition">Sign In</Link>
            <Link to="/signup" className="hover:text-cyan-400 transition">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
