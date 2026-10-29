import React, { useState, useEffect } from "react";
import { FileText, Download, ShieldCheck, ExternalLink } from "lucide-react";
import { apiRequest, API_BASE } from "../../services/api";

export const Reports: React.FC = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await apiRequest("/analysis/my-analyses");
      if (res.success && res.analyses) {
        setAnalyses(res.analyses);
      }
    }
    load();
  }, []);

  const handleDownload = async (analysisId: string, filename: string) => {
    try {
      const repRes = await apiRequest("/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          analysisId,
          title: `Forensic Media Report - ${filename}`
        })
      });

      if (repRes.success && repRes.report) {
        window.open(`${API_BASE}/reports/${repRes.report._id}/pdf`, "_blank");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Forensic Evidence Reports Vault</h1>
        <p className="text-xs text-slate-400 mt-1">
          Generate and download audit-grade PDF reports adhering to ISO/IEC 27037 standards with cryptographic hash chaining.
        </p>
      </div>

      <div className="cyber-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-cyan-500/10">
          <h3 className="font-bold text-sm text-white">Available Evidence Reports</h3>
          <p className="text-xs text-slate-400">Reports include SHA-256 media hash, model parameters, and analyst findings.</p>
        </div>

        {analyses.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 font-mono">
            No completed analyses to compile reports for.
          </div>
        ) : (
          <div className="divide-y divide-cyan-500/10">
            {analyses.map((item) => {
              const media = item.mediaAssetId || {};
              return (
                <div key={item._id} className="p-5 flex items-center justify-between gap-4 hover:bg-cyan-500/5 transition">
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      {media.originalFilename || "Media Asset"}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 block mt-0.5">
                      Calibrated Manipulation Probability: {(item.calibratedScore * 100).toFixed(1)}% ({item.overallRisk.toUpperCase()})
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                      Media Checksum: {media.sha256Hash || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDownload(item._id, media.originalFilename)}
                      className="flex items-center gap-1.5 bg-[#091122] hover:bg-[#0e1a34] border border-cyan-500/30 text-cyan-300 text-xs font-semibold px-3.5 py-2 rounded-lg transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
