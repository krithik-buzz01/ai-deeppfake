import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Lock } from "lucide-react";
import { apiRequest } from "../../services/api";

export const AuditLogsView: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [integrity, setIntegrity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/admin/audit/logs");
      if (res.success) {
        setEvents(res.events || []);
        setIntegrity(res.chainIntegrity || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tamper-Evident Audit Event Chain</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographic SHA-256 hash-chained event ledger preserving ISO/IEC 27037 chain of custody.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs bg-[#0b1222] hover:bg-[#0f1933] border border-cyan-500/20 text-cyan-300 px-3.5 py-2 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Verify Integrity</span>
        </button>
      </div>

      {/* Integrity Banner */}
      {integrity && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            integrity.valid
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <strong className="block text-sm">
                {integrity.valid ? "Cryptographic Chain of Custody Sealed" : "Warning: Audit Chain Discontinuity Detected"}
              </strong>
              <span className="text-[11px] text-slate-400">
                Total Events Verified: {integrity.totalEvents} · Genesis to Head
              </span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold uppercase">
            {integrity.valid ? "VERIFIED INTACT" : "BROKEN INTEGRITY"}
          </span>
        </div>
      )}

      {/* Logs Table */}
      <div className="cyber-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-cyan-500/10">
          <h3 className="font-bold text-sm text-white">Cryptographic Event Stream</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-cyan-400">Verifying audit hash blocks...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#090f20] text-slate-400 font-mono uppercase text-[10px] border-b border-cyan-500/10">
                <tr>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Resource</th>
                  <th className="px-5 py-3.5">Block Hash (SHA-256)</th>
                  <th className="px-5 py-3.5">Chained Previous Hash</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10 font-mono text-[11px]">
                {events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-cyan-500/5 transition">
                    <td className="px-5 py-3.5 font-bold text-cyan-300">{evt.action}</td>
                    <td className="px-5 py-3.5 text-slate-400">{evt.targetResource}</td>
                    <td className="px-5 py-3.5 text-cyan-400 truncate max-w-[150px]">{evt.currentHash}</td>
                    <td className="px-5 py-3.5 text-slate-500 truncate max-w-[150px]">{evt.previousHash}</td>
                    <td className="px-5 py-3.5 text-slate-400">{evt.ip}</td>
                    <td className="px-5 py-3.5 text-right text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
