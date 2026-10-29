import React, { useState } from "react";
import { User, Mail, Phone, ShieldCheck, CheckCircle2, Lock, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [factCheckConsent, setFactCheckConsent] = useState(user?.allowExternalFactCheck ?? true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vault Security &amp; Privacy Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your verified credentials, dual authentication factors, and privacy preferences.
        </p>
      </div>

      {/* Account Info */}
      <div className="cyber-card p-6 rounded-2xl space-y-4">
        <h3 className="font-bold text-sm text-white border-b border-cyan-500/10 pb-3">
          Verified Identity Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#090e1a] border border-cyan-500/10">
            <span className="text-slate-500 block text-[11px] mb-1">Full Legal Name</span>
            <span className="text-white font-semibold flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              {user?.fullName || "Operator"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#090e1a] border border-cyan-500/10">
            <span className="text-slate-500 block text-[11px] mb-1">Authorization Role</span>
            <span className="font-mono text-cyan-400 font-bold uppercase">
              {user?.role || "USER"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#090e1a] border border-cyan-500/10">
            <span className="text-slate-500 block text-[11px] mb-1">Verified Email</span>
            <span className="text-white font-semibold flex items-center justify-between">
              <span className="truncate">{user?.email}</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#090e1a] border border-cyan-500/10">
            <span className="text-slate-500 block text-[11px] mb-1">Verified Mobile (E.164)</span>
            <span className="text-white font-semibold flex items-center justify-between">
              <span className="font-mono">{user?.phone}</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Preferences */}
      <div className="cyber-card p-6 rounded-2xl space-y-4">
        <h3 className="font-bold text-sm text-white border-b border-cyan-500/10 pb-3">
          Zero-Trust Privacy Controls
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={factCheckConsent}
              onChange={(e) => setFactCheckConsent(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500"
            />
            <div className="text-xs text-slate-300">
              <strong className="text-white block mb-0.5">Permit External Fact-Checking Inquiries</strong>
              Allows VERIFAI to send user-approved transcript claims to public fact-checking repositories (Google Fact Check Tools API / Open Fact Index).
            </div>
          </label>

          <button
            type="submit"
            className="bg-cyan-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg hover:bg-cyan-400 transition"
          >
            {saved ? "Settings Saved!" : "Save Privacy Preferences"}
          </button>
        </form>
      </div>

      {/* Account Termination */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone: Permanent Account Deletion</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Deleting your account permanently purges all uploaded media files, fingerprints, and forensic logs from the secure vault. This action is irreversible.
        </p>
        <button
          onClick={logout}
          className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
        >
          Sign Out &amp; Request Account Purge
        </button>
      </div>
    </div>
  );
};
