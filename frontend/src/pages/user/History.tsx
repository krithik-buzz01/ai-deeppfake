import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon, Search, Filter, ExternalLink, GitCompare, FileText } from "lucide-react";
import { apiRequest } from "../../services/api";

export const History: React.FC = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiRequest("/analysis/my-analyses");
      if (res.success && res.analyses) {
        setAnalyses(res.analyses);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = analyses.filter((item) => {
    const filename = item.mediaAssetId?.originalFilename || "";
    const matchesSearch = filename.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === "all" || item.overallRisk === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Investigation Media History</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review all evaluated media assets, inspect cryptographic checksums, and trigger duplicate comparisons.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename or asset ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#0a0f1d] border border-cyan-500/20 text-xs text-slate-300 rounded-lg p-1.5 focus:outline-none font-mono"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="cyber-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-cyan-400">Loading history records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">No media records match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#090f20] text-slate-400 font-mono uppercase text-[10px] border-b border-cyan-500/10">
                <tr>
                  <th className="px-5 py-3.5">Filename</th>
                  <th className="px-5 py-3.5">SHA-256 Checksum</th>
                  <th className="px-5 py-3.5">Modality</th>
                  <th className="px-5 py-3.5">Calibrated Score</th>
                  <th className="px-5 py-3.5">Risk Level</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {filtered.map((item) => {
                  const media = item.mediaAssetId || {};
                  return (
                    <tr key={item._id} className="hover:bg-cyan-500/5 transition">
                      <td className="px-5 py-3.5 font-medium text-white max-w-xs truncate">
                        {media.originalFilename || "Asset"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-cyan-400 text-[10px] truncate max-w-[140px]">
                        {media.sha256Hash || "N/A"}
                      </td>
                      <td className="px-5 py-3.5 uppercase font-mono text-[10px] text-slate-400">
                        {media.modality || "MEDIA"}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold">
                        {(item.calibratedScore * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            item.overallRisk === "critical" || item.overallRisk === "high"
                              ? "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                              : item.overallRisk === "medium"
                              ? "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {item.overallRisk}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/portal/user/compare?target=${item._id}`}
                            title="Compare against other evidence"
                            className="text-slate-400 hover:text-cyan-400 transition"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/portal/user/results/${item._id}`}
                            className="text-cyan-400 hover:text-cyan-300 font-semibold"
                          >
                            Inspect
                          </Link>
                        </div>
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
