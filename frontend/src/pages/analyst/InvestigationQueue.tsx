import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FolderLock, Plus, AlertCircle, Clock, ChevronRight, User } from "lucide-react";
import { apiRequest } from "../../services/api";

export const InvestigationQueue: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/cases");
      if (res.success && res.cases) {
        setCases(res.cases);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const res = await apiRequest("/cases", {
      method: "POST",
      body: JSON.stringify({ title, description, priority })
    });

    if (res.success) {
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      loadCases();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block">
            PROFESSIONAL ANALYST PORTAL
          </span>
          <h1 className="text-2xl font-bold text-white">Investigation Triage Queue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage deepfake forensics cases, coordinate second opinions, and record verified human verdicts.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-cyan-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Open Investigation Case</span>
        </button>
      </div>

      {/* Case List */}
      <div className="cyber-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-cyan-500/10">
          <h3 className="font-bold text-sm text-white">Active Case Dossiers</h3>
          <p className="text-xs text-slate-400">Cases currently under analyst review or requiring second opinions.</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs font-mono text-cyan-400">
            Loading investigation cases...
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No investigation cases currently in queue. Click "Open Investigation Case" to create one.
          </div>
        ) : (
          <div className="divide-y divide-cyan-500/10">
            {cases.map((c) => (
              <div key={c._id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-cyan-500/5 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-cyan-400 font-bold">{c.caseNumber}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        c.priority === "urgent"
                          ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                          : c.priority === "high"
                          ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                          : "bg-slate-900 text-slate-400 border border-slate-800"
                      }`}
                    >
                      {c.priority} PRIORITY
                    </span>
                    <span className="text-[9px] font-mono uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-white">{c.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{c.description || "No description provided."}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block font-mono text-[11px]">
                      Created: {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      Lead: {c.assignedAnalystId?.fullName || "Unassigned"}
                    </span>
                  </div>

                  <Link
                    to={`/portal/analyst/case/${c._id}`}
                    className="flex items-center gap-1 text-xs font-semibold bg-[#091122] hover:bg-[#0e1a34] border border-cyan-500/30 text-cyan-300 px-3.5 py-2 rounded-lg transition"
                  >
                    <span>Inspect Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cyber-card p-6 sm:p-8 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create Investigation Case</h3>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Suspected Political Executive Video Deepfake"
                  className="w-full px-3 py-2 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Investigation Scope &amp; Summary</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details regarding context, provenance, or source URL..."
                  className="w-full px-3 py-2 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-xs text-slate-200 focus:outline-none font-mono"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent / Critical Triage</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg hover:bg-cyan-400 transition"
                >
                  Create Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
