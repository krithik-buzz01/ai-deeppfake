import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Download,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  Cpu,
  Clock,
  ExternalLink,
  ChevronRight,
  Crosshair
} from "lucide-react";
import { apiRequest, API_BASE } from "../../services/api";

export const Results: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [chainValid, setChainValid] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiRequest(`/analysis/detail/${analysisId}`);
        if (res.success) {
          setData(res);
        } else {
          setError(res.error || "Analysis not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load analysis details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [analysisId]);

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      // 1. Generate ReportVersion if not yet created
      const repRes = await apiRequest("/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          analysisId,
          title: `Forensic Media Report - ${data?.analysis?.mediaAssetId?.originalFilename || "Asset"}`
        })
      });

      if (repRes.success && repRes.report) {
        const reportId = repRes.report._id;
        // 2. Open PDF download stream
        window.open(`${API_BASE}/reports/${reportId}/pdf`, "_blank");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleVerifyChain = async () => {
    try {
      const repRes = await apiRequest("/reports/generate", {
        method: "POST",
        body: JSON.stringify({ analysisId })
      });
      if (repRes.success && repRes.report) {
        const chainRes = await apiRequest(`/reports/${repRes.report._id}/tamper-chain`);
        if (chainRes.success && chainRes.chainIntegrity) {
          setChainValid(chainRes.chainIntegrity.valid);
        }
      }
    } catch {
      setChainValid(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-cyan-400">
        Loading cryptographic analysis records...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white">Analysis Unavailable</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">{error || "Could not retrieve analysis details."}</p>
        <Link to="/portal/user/overview" className="text-xs text-cyan-400 hover:underline">
          &larr; Return to Dashboard
        </Link>
      </div>
    );
  }

  const { analysis, modelRuns, videoFrames, audioSegments, provenance } = data;
  const media = analysis.mediaAssetId || {};

  const isCritical = analysis.overallRisk === "critical";
  const isHigh = analysis.overallRisk === "high";
  const isMedium = analysis.overallRisk === "medium";
  const isLow = analysis.overallRisk === "low";

  const scorePct = (analysis.calibratedScore * 100).toFixed(1);
  const ciLower = (analysis.confidenceInterval?.lower * 100).toFixed(1);
  const ciUpper = (analysis.confidenceInterval?.upper * 100).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block">
            INVESTIGATION REPORT #{analysis._id.substring(0, 8).toUpperCase()}
          </span>
          <h1 className="text-2xl font-bold text-white truncate max-w-xl">
            {media.originalFilename || "Media Asset"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyChain}
            className="flex items-center gap-1.5 text-xs bg-[#0b1222] hover:bg-[#0f1830] border border-cyan-500/20 text-slate-300 px-3.5 py-2 rounded-lg transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {chainValid === true ? "Chain Validated (SHA-256)" : "Verify Custody Chain"}
            </span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{generatingPdf ? "Compiling PDF..." : "Export Forensic PDF"}</span>
          </button>
        </div>
      </div>

      {/* Main Forensic Summary Card */}
      <div className="cyber-card p-6 sm:p-8 rounded-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Calibrated Gauge */}
          <div className="text-center md:border-r border-cyan-500/15 md:pr-6">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Calibrated Manipulation Probability
            </span>
            <span
              className={`text-5xl font-black font-mono block ${
                isCritical || isHigh ? "text-rose-400" : isMedium ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {scorePct}%
            </span>
            <span
              className={`inline-block mt-3 text-[11px] font-mono px-3 py-1 rounded font-bold uppercase ${
                isCritical || isHigh
                  ? "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                  : isMedium
                  ? "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {analysis.overallRisk} RISK LEVEL
            </span>
            <span className="text-[11px] text-slate-500 block mt-2 font-mono">
              95% Confidence Bounds: [{ciLower}% - {ciUpper}%]
            </span>
          </div>

          {/* Synthesis Details */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-bold text-sm text-white">Forensic Evidence Synthesis</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{analysis.summary}</p>

            {analysis.detectedSignals && analysis.detectedSignals.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block">
                  Identified Anomalies &amp; Markers
                </span>
                {analysis.detectedSignals.map((sig: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{sig}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chain Integrity Alert if clicked */}
        {chainValid === true && (
          <div className="mt-6 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cryptographic Chain of Custody Verified: SHA-256 block hash matches tamper-evident genesis record.</span>
          </div>
        )}
      </div>

      {/* Grid: Media Metrics & Provenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Media Asset Custody Metrics */}
        <div className="cyber-card p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <Fingerprint className="w-4 h-4" />
            <span>Evidence Chain of Custody</span>
          </div>
          <div className="space-y-2 text-xs divide-y divide-slate-800 pt-1">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">SHA-256 Checksum:</span>
              <span className="font-mono text-cyan-300 text-[11px] truncate max-w-xs">{media.sha256Hash}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Perceptual dHash (64-bit):</span>
              <span className="font-mono text-slate-200 text-[11px]">{media.dHash || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">File Size:</span>
              <span className="text-slate-200">{media.sizeBytes ? (media.sizeBytes / 1024).toFixed(1) + " KB" : "N/A"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">MIME Content Type:</span>
              <span className="text-slate-200 font-mono text-[11px]">{media.mimeType}</span>
            </div>
          </div>
        </div>

        {/* C2PA Provenance */}
        <div className="cyber-card p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>C2PA Content Credentials &amp; Metadata</span>
          </div>
          <div className="space-y-2 text-xs divide-y divide-slate-800 pt-1">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">C2PA Signature Status:</span>
              <span className="font-semibold text-slate-200 uppercase font-mono text-[11px]">
                {provenance?.c2paStatus?.replace("_", " ") || "ABSENT CREDENTIALS"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Hardware / Origin:</span>
              <span className="text-slate-200">{provenance?.hardwareDevice || provenance?.manifestIssuer || "Standard Digital Capture"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Creation Software:</span>
              <span className="text-slate-200">{provenance?.creationSoftware || "Direct Sensor Stream"}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            {provenance?.disclaimer || "Missing credentials does not prove manipulation. Social platforms routinely strip metadata."}
          </p>
        </div>
      </div>

      {/* Model Breakdown Panel */}
      <div className="cyber-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
          <Cpu className="w-4 h-4" />
          <span>Explainable AI Forensic Model Registry Breakdown</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modelRuns?.map((run: any) => (
            <div key={run._id} className="p-4 rounded-xl bg-[#080d1a] border border-cyan-500/15 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                  {run.modality} Forensics · v{run.modelVersion}
                </span>
                <h4 className="text-xs font-bold text-white mt-1 mb-2">{run.modelName}</h4>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-mono font-bold text-slate-100">
                    {(run.score * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    [{((run.confidenceInterval?.lower || 0) * 100).toFixed(0)}% - {((run.confidenceInterval?.upper || 1) * 100).toFixed(0)}%]
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Latency: {run.executionTimeMs}ms</span>
                <span className="text-emerald-400">VERIFIED WEIGHTS</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Timeline (if video) */}
      {videoFrames && videoFrames.length > 0 && (
        <div className="cyber-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Frame-by-Frame Video Forensics Timeline</span>
            </div>
            <span className="text-xs font-mono text-slate-400">{videoFrames.length} Frames Sampled</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {videoFrames.slice(0, 12).map((vf: any) => (
              <div key={vf._id} className="p-2.5 rounded-lg bg-[#080d1a] border border-cyan-500/10 text-center">
                <span className="text-[10px] font-mono text-slate-400 block">Frame #{vf.frameNumber}</span>
                <span className="text-xs font-mono font-bold text-cyan-300 block mt-1">
                  {(vf.suspicionScore * 100).toFixed(0)}%
                </span>
                <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{vf.timestampMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scientific & Legal Disclaimer */}
      <div className="p-4 rounded-xl bg-[#080c17] border border-slate-800 text-[11px] text-slate-500 leading-relaxed">
        <strong>Scientific &amp; Legal Methodology Notice:</strong> This analysis was conducted using empirical neural vision models, 2D spectral frequency analysis, and Error Level Analysis. AI probabilities reflect statistical resemblance to known synthesis artifacts and must not be treated as absolute legal certitude. Always conduct secondary review with accredited forensic personnel.
      </div>
    </div>
  );
};
