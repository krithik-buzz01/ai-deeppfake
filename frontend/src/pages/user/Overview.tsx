import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  Lock,
  Camera
} from "lucide-react";
import { apiRequest } from "../../services/api";

export const Overview: React.FC = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiRequest("/analysis/my-analyses");
        if (res.success && res.analyses) {
          setAnalyses(res.analyses);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalCount = analyses.length;
  const criticalCount = analyses.filter((a) => a.overallRisk === "critical" || a.overallRisk === "high").length;
  const authenticCount = analyses.filter((a) => a.overallRisk === "low").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0c1427] to-[#121d3b] border border-cyan-500/20 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>OPERATIONAL FORENSICS VAULT</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Media Verification Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multimodal deepfake detection, C2PA provenance credentials, and chain of custody.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/portal/user/live"
            className="flex items-center gap-2 bg-[#090e1c] hover:bg-[#0f172e] border border-cyan-500/30 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Live Camera Check</span>
          </Link>
          <Link
            to="/portal/user/new"
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-cyan-500/20 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Submit Media Asset</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Evaluated Media</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">{totalCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Verified with SHA-256 fingerprint</span>
        </div>

        <div className="cyber-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>High Manipulation Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-extrabold text-rose-400">{criticalCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">ViT / ELA anomalies confirmed</span>
        </div>

        <div className="cyber-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Verified Authentic</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-400">{authenticCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Natural sensor noise profile</span>
        </div>

        <div className="cyber-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Chain of Custody Logs</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-extrabold text-cyan-300">100% Sealed</span>
          <span className="text-[11px] text-slate-500 block mt-1">ISO/IEC 27037 tamper-evident log</span>
        </div>
      </div>

      {/* Recent Analyses Table */}
      <div className="cyber-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-cyan-500/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white">Recent Forensic Analyses</h3>
            <p className="text-xs text-slate-400">Inspected media assets and calibrated model scores</p>
          </div>
          <Link to="/portal/user/history" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading investigation records...
          </div>
        ) : analyses.length === 0 ? (
          <div className="p-12 text-center">
            <UploadCloud className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No media assets analyzed yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Upload an image, video, or audio file to execute deepfake forensics and generate verifiable evidence.
            </p>
            <Link
              to="/portal/user/new"
              className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-cyan-500/20 transition"
            >
              <span>Upload First Asset</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#090f20] text-slate-400 font-mono uppercase text-[10px] border-b border-cyan-500/10">
                <tr>
                  <th className="px-5 py-3.5">Asset</th>
                  <th className="px-5 py-3.5">Modality</th>
                  <th className="px-5 py-3.5">Calibrated Score</th>
                  <th className="px-5 py-3.5">Risk Level</th>
                  <th className="px-5 py-3.5">Analyzed Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {analyses.slice(0, 8).map((item) => {
                  const media = item.mediaAssetId || {};
                  const isHigh = item.overallRisk === "critical" || item.overallRisk === "high";
                  const isMed = item.overallRisk === "medium";

                  return (
                    <tr key={item._id} className="hover:bg-cyan-500/5 transition">
                      <td className="px-5 py-4 font-medium text-white max-w-xs truncate">
                        {media.originalFilename || "Media Asset"}
                      </td>
                      <td className="px-5 py-4 uppercase font-mono text-[10px] text-cyan-400">
                        {media.modality || "MEDIA"}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold">
                        {(item.calibratedScore * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            isHigh
                              ? "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                              : isMed
                              ? "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {item.overallRisk}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/portal/user/results/${item._id}`}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-xs"
                        >
                          <span>Inspect Report</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
