import React, { useState, useEffect } from "react";
import { Search, ExternalLink, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { apiRequest } from "../../services/api";

export const ClaimVerification: React.FC = () => {
  const [claimText, setClaimText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      const res = await apiRequest("/claims/my-claims");
      if (res.success && res.claims) {
        setHistory(res.claims);
      }
    }
    loadHistory();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("/claims/verify", {
        method: "POST",
        body: JSON.stringify({ claimText: claimText.trim() })
      });

      if (res.success && res.claimCheck) {
        setResult(res.claimCheck);
        setHistory((prev) => [res.claimCheck, ...prev]);
        setClaimText("");
      } else {
        setError(res.error || "Claim verification query failed.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to query fact-checking repositories.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Source &amp; Claim Verification Workspace</h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect narrative claims extracted from media transcripts against Google Fact Check and verified open fact-checking indexes.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Input Card */}
      <div className="cyber-card p-6 rounded-2xl">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-cyan-400 uppercase mb-2">
              Factual Assertion or Speech Claim to Verify
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="e.g. Explosion near the Pentagon reported on social media"
                className="w-full pl-9 pr-3 py-3 bg-[#0a0f1d] border border-cyan-500/20 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-slate-500">
              Cross-references indexed journalistic debunkings and fact-checking records.
            </span>
            <button
              type="submit"
              disabled={loading || !claimText.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
            >
              {loading ? "Cross-referencing Fact Indexes..." : "Verify Claim Statement"}
            </button>
          </div>
        </form>
      </div>

      {/* Result Card if just evaluated */}
      {result && (
        <div className="cyber-card p-6 rounded-2xl space-y-4 border border-cyan-500/30">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/10 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Verified Assertion</span>
              <h3 className="text-sm font-bold text-white mt-0.5">&ldquo;{result.claimText}&rdquo;</h3>
            </div>
            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold uppercase ${
                result.verificationStatus === "disputed"
                  ? "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                  : result.verificationStatus === "verified"
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-900 text-slate-400 border border-slate-700"
              }`}
            >
              STATUS: {result.verificationStatus?.toUpperCase()}
            </span>
          </div>

          <div className="text-xs text-slate-300">
            <p className="text-slate-400 mb-3">{result.notes}</p>
            {result.evidenceList && result.evidenceList.length > 0 && (
              <div className="space-y-3">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block">
                  Referenced Journalistic Evidence Articles
                </span>
                {result.evidenceList.map((ev: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#090e1a] border border-cyan-500/15 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-xs text-white">{ev.sourceTitle}</h4>
                      <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded shrink-0">
                        {ev.rating || "Fact Checked"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{ev.textSnippet}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                      <span>Publisher: {ev.publisher} · {ev.publishDate}</span>
                      <a
                        href={ev.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#080d1a] border border-slate-800 text-[11px] text-slate-500">
            {result.disclaimer || "Claim verification is independent of deepfake detection."}
          </div>
        </div>
      )}

      {/* History List */}
      {history.length > 0 && (
        <div className="cyber-card p-6 rounded-2xl space-y-3">
          <h3 className="font-bold text-sm text-white border-b border-cyan-500/10 pb-3">
            Previously Evaluated Claims
          </h3>
          <div className="divide-y divide-slate-800">
            {history.map((h: any) => (
              <div key={h._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="truncate max-w-lg">
                  <span className="text-slate-200 font-medium block truncate">&ldquo;{h.claimText}&rdquo;</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Provider: {h.providerUsed} · {new Date(h.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    h.verificationStatus === "disputed"
                      ? "text-rose-400 bg-rose-950/60 border border-rose-500/30"
                      : "text-slate-400 bg-slate-900 border border-slate-800"
                  }`}
                >
                  {h.verificationStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
