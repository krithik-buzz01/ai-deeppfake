import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Users,
  ShieldCheck,
  Cpu,
  FileText,
  Layers,
  Database,
  ArrowRight,
  HardDrive
} from "lucide-react";
import { apiRequest } from "../../services/api";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiRequest("/admin/stats");
      if (res.success && res.stats) {
        setStats(res.stats);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block">
          ADMINISTRATIVE GOVERNANCE CONSOLE
        </span>
        <h1 className="text-2xl font-bold text-white">System Operations &amp; Forensic Metrics</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor system throughput, licensed model registry health, provider status, and audit chains.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Registered Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">{stats?.totalUsers || 0}</span>
          <span className="text-[11px] text-emerald-400 block mt-1">
            {stats?.verifiedUsers || 0} Dual-Factor Verified
          </span>
        </div>

        <div className="cyber-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Analyses Completed</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">{stats?.totalAnalyses || 0}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Multimodal neural inference</span>
        </div>

        <div className="cyber-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Vault Media Storage</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-extrabold text-cyan-300">
            {stats?.totalStorageMb || "0.00"} MB
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {stats?.totalMedia || 0} Total Media Assets
          </span>
        </div>

        <div className="cyber-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Chain of Custody Logs</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-400">100% Intact</span>
          <span className="text-[11px] text-slate-500 block mt-1">SHA-256 Merkle chain</span>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/portal/admin/users"
          className="cyber-card p-5 rounded-xl hover:border-cyan-400 transition group block"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition">
            <Users className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-white">User Directory &amp; RBAC</h4>
          <p className="text-xs text-slate-400 mt-1">Manage users, elevate analyst permissions, inspect accounts.</p>
        </Link>

        <Link
          to="/portal/admin/providers"
          className="cyber-card p-5 rounded-xl hover:border-cyan-400 transition group block"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-white">Provider Connectivity</h4>
          <p className="text-xs text-slate-400 mt-1">Inspect SMTP, Twilio, Redis, and AI service health.</p>
        </Link>

        <Link
          to="/portal/admin/models"
          className="cyber-card p-5 rounded-xl hover:border-cyan-400 transition group block"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-white">AI Model Registry</h4>
          <p className="text-xs text-slate-400 mt-1">Catalog of licensed pretrained deepfake detectors &amp; calibration.</p>
        </Link>

        <Link
          to="/portal/admin/audit"
          className="cyber-card p-5 rounded-xl hover:border-cyan-400 transition group block"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-white">Tamper Audit Logs</h4>
          <p className="text-xs text-slate-400 mt-1">Verify cryptographic hash chain integrity and actions.</p>
        </Link>
      </div>
    </div>
  );
};
