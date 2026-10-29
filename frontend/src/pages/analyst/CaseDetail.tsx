import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FolderLock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  User,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus
} from "lucide-react";
import { apiRequest } from "../../services/api";

export const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();

  const [caseData, setCaseData] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Annotation State
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState("artifact");
  const [frameNumber, setFrameNumber] = useState("");
  const [isDisagreement, setIsDisagreement] = useState(false);
  const [disagreementReason, setDisagreementReason] = useState("");

  // Verdict state
  const [verdict, setVerdict] = useState<string>("manipulated");
  const [rationale, setRationale] = useState("");

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const loadCase = async () => {
    try {
      const res = await apiRequest(`/cases/${caseId}`);
      if (res.success) {
        setCaseData(res.case);
        setAnnotations(res.annotations || []);
        if (res.case?.humanVerdict) {
          setVerdict(res.case.humanVerdict);
        }
        if (res.case?.verdictRationale) {
          setRationale(res.case.verdictRationale);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const res = await apiRequest(`/cases/${caseId}/annotations`, {
      method: "POST",
      body: JSON.stringify({
        content: content.trim(),
        noteType,
        frameNumber: frameNumber ? parseInt(frameNumber) : undefined,
        isDisagreementWithModel: isDisagreement,
        disagreementReason: isDisagreement ? disagreementReason : undefined
      })
    });

    if (res.success && res.annotation) {
      setAnnotations((prev) => [...prev, res.annotation]);
      setContent("");
      setIsDisagreement(false);
      setDisagreementReason("");
    }
  };

  const handleUpdateVerdict = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest(`/cases/${caseId}/verdict`, {
      method: "PATCH",
      body: JSON.stringify({
        verdict,
        rationale,
        status: "closed"
      })
    });

    if (res.success) {
      loadCase();
      alert("Human analyst verdict recorded in tamper-evident chain of custody.");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs font-mono text-cyan-400">Loading case dossier...</div>;
  }

  if (!caseData) {
    return <div className="p-8 text-center text-xs text-rose-400">Case dossier not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block">
            CASE #{caseData.caseNumber}
          </span>
          <h1 className="text-2xl font-bold text-white">{caseData.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold uppercase">
            STATUS: {caseData.status}
          </span>
        </div>
      </div>

      {/* Case Details Card */}
      <div className="cyber-card p-6 rounded-2xl space-y-4">
        <h3 className="font-bold text-sm text-white border-b border-cyan-500/10 pb-3">Scope &amp; Background</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{caseData.description || "No description provided."}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div>
            <span className="text-slate-500 block text-[11px]">Priority:</span>
            <span className="font-mono text-cyan-400 uppercase font-semibold">{caseData.priority}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Opened By:</span>
            <span className="text-slate-200">{caseData.createdById?.fullName || "Analyst"}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Lead Specialist:</span>
            <span className="text-slate-200">{caseData.assignedAnalystId?.fullName || "Unassigned"}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Current Verdict:</span>
            <span className="font-mono font-bold text-amber-400 uppercase">
              {caseData.humanVerdict || "Under Triage"}
            </span>
          </div>
        </div>
      </div>

      {/* Frame & Artifact Annotations */}
      <div className="cyber-card p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
          <h3 className="font-bold text-sm text-white">Analyst Frame Annotations &amp; Review Notes</h3>
          <span className="text-xs font-mono text-slate-400">{annotations.length} Notes Recorded</span>
        </div>

        {/* Existing Annotations */}
        {annotations.length === 0 ? (
          <p className="text-xs text-slate-500">No analyst notes recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {annotations.map((a: any) => (
              <div key={a._id} className="p-4 rounded-xl bg-[#080d1a] border border-cyan-500/15 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-200">{a.analystId?.fullName || "Analyst"}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 uppercase">
                      {a.noteType}
                    </span>
                    {a.frameNumber !== undefined && (
                      <span className="text-[10px] font-mono text-cyan-400">Frame #{a.frameNumber}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{a.content}</p>

                {a.isDisagreementWithModel && (
                  <div className="mt-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300 space-y-1">
                    <strong className="block text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                      Model Disagreement Recorded
                    </strong>
                    <span>{a.disagreementReason || "Analyst disputes the algorithmic classification."}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Annotation Form */}
        <form onSubmit={handleAddAnnotation} className="space-y-4 pt-4 border-t border-cyan-500/10">
          <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Add Forensic Annotation
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Note Classification</label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-cyan-500/20 text-xs text-slate-200 rounded-lg p-2"
              >
                <option value="artifact">Artifact Finding</option>
                <option value="inconsistency">Temporal Inconsistency</option>
                <option value="false_positive">Potential False Positive</option>
                <option value="question">Review Query / Second Opinion</option>
                <option value="general">General Verification Log</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Target Frame # (Optional)</label>
              <input
                type="number"
                value={frameNumber}
                onChange={(e) => setFrameNumber(e.target.value)}
                placeholder="e.g. 24"
                className="w-full bg-[#0a0f1d] border border-cyan-500/20 text-xs text-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Observations &amp; Technical Notes</label>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Record forensic observation regarding lighting, boundaries, or frequency spikes..."
              className="w-full bg-[#0a0f1d] border border-cyan-500/20 text-xs text-slate-200 rounded-lg p-2.5"
            />
          </div>

          {/* Model Disagreement Toggle */}
          <div className="p-3.5 rounded-xl bg-[#090e1a] border border-cyan-500/15 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isDisagreement}
                onChange={(e) => setIsDisagreement(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500"
              />
              <span>I disagree with the automated AI model inference score on this segment</span>
            </label>

            {isDisagreement && (
              <input
                type="text"
                required
                value={disagreementReason}
                onChange={(e) => setDisagreementReason(e.target.value)}
                placeholder="State technical rationale for disputing model finding (e.g. natural motion blur)..."
                className="w-full bg-[#0a0f1d] border border-rose-500/30 text-xs text-slate-200 rounded-lg p-2 mt-1"
              />
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-cyan-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg hover:bg-cyan-400 transition"
            >
              Append Annotation
            </button>
          </div>
        </form>
      </div>

      {/* Human Verdict Section */}
      <div className="cyber-card p-6 rounded-2xl space-y-4">
        <h3 className="font-bold text-sm text-white border-b border-cyan-500/10 pb-3">
          Final Analyst Verdict &amp; Rationale
        </h3>
        <form onSubmit={handleUpdateVerdict} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Human Verdict</label>
              <select
                value={verdict}
                onChange={(e) => setVerdict(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-cyan-500/20 text-xs text-slate-200 rounded-lg p-2.5 font-mono"
              >
                <option value="manipulated">Manipulated / Deepfake Certified</option>
                <option value="authentic">Authentic Physical Capture</option>
                <option value="inconclusive">Inconclusive Evidence</option>
                <option value="disputed">Disputed Findings</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Technical Verdict Rationale</label>
            <textarea
              required
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="State official justification for the record. This rationale will be permanently sealed in the audit log."
              className="w-full bg-[#0a0f1d] border border-cyan-500/20 text-xs text-slate-200 rounded-lg p-2.5"
            />
          </div>

          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-lg transition"
          >
            Record Final Human Verdict in Audit Log
          </button>
        </form>
      </div>
    </div>
  );
};
