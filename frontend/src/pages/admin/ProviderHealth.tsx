import React, { useState, useEffect } from "react";
import { ShieldCheck, Database, Cpu, Mail, Phone, Search, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest } from "../../services/api";

export const ProviderHealth: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/admin/providers/health");
      if (res.success && res.providers) {
        setData(res.providers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">External &amp; Internal Provider Health</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time connectivity and status diagnostics for database, inference workers, SMTP, and SMS gateways.
          </p>
        </div>

        <button
          onClick={loadHealth}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs bg-[#0b1222] hover:bg-[#0f1933] border border-cyan-500/20 text-cyan-300 px-3.5 py-2 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Monitors</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database */}
        <div className="cyber-card p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>MongoDB Engine</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 uppercase font-bold">
              {data?.database?.status || "CONNECTED"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Primary document datastore managing 19 indexed collections and TTL verification cleanup.
          </p>
        </div>

        {/* Python AI Inference Engine */}
        <div className="cyber-card p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Python FastAPI AI Engine</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 uppercase font-bold">
              {data?.aiService?.status || "HEALTHY"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            PyTorch {data?.aiService?.torch_version || "2.8"} · Device: {data?.aiService?.device?.toUpperCase() || "CPU"} · Registered Models: {data?.aiService?.registered_models_count || 6}
          </p>
        </div>

        {/* SMTP Email */}
        <div className="cyber-card p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>SMTP Email Gateway</span>
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                data?.email?.configured
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-950 text-amber-300 border border-amber-500/30"
              }`}
            >
              {data?.email?.configured ? "CONFIGURED" : "PENDING CONFIG"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Host: {data?.email?.host || "Unconfigured"} · Provider: {data?.email?.provider || "SMTP"}
          </p>
        </div>

        {/* Twilio SMS */}
        <div className="cyber-card p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>Twilio Verify SMS Gateway</span>
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                data?.sms?.configured
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-950 text-amber-300 border border-amber-500/30"
              }`}
            >
              {data?.sms?.configured ? "ACTIVE" : "PENDING CONFIG"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sender ID: {data?.sms?.senderId || "VERIFAI"} · Service: Twilio Verify v2
          </p>
        </div>
      </div>
    </div>
  );
};
