import React, { useState, useEffect } from "react";
import { GitCompare, Fingerprint, ShieldCheck, ArrowRight, Layers } from "lucide-react";
import { apiRequest } from "../../services/api";

export const CompareEvidence: React.FC = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedA, setSelectedA] = useState<string>("");
  const [selectedB, setSelectedB] = useState<string>("");

  useEffect(() => {
    async function load() {
      const res = await apiRequest("/analysis/my-analyses");
      if (res.success && res.analyses) {
        setAnalyses(res.analyses);
        if (res.analyses.length >= 2) {
          setSelectedA(res.analyses[0]._id);
          setSelectedB(res.analyses[1]._id);
        }
      }
    }
    load();
  }, []);

  const analysisA = analyses.find((a) => a._id === selectedA);
  const analysisB = analyses.find((a) => a._id === selectedB);

  const mediaA = analysisA?.mediaAssetId || {};
  const mediaB = analysisB?.mediaAssetId || {};

  const exactShaMatch = mediaA.sha256Hash && mediaB.sha256Hash && mediaA.sha256Hash === mediaB.sha256Hash;
  const dHashA = mediaA.dHash;
  const dHashB = mediaB.dHash;

  let hammingDistance = 64;
  if (dHashA && dHashB && dHashA.length === dHashB.length) {
    let dist = 0;
    for (let i = 0; i < dHashA.length; i++) {
      let xor = parseInt(dHashA[i], 16) ^ parseInt(dHashB[i], 16);
      while (xor > 0) {
        dist += xor & 1;
        xor >>= 1;
      }
    }
    hammingDistance = dist;
  }

  const similarityPct = Math.round(((64 - hammingDistance) / 64) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Compare Media Evidence &amp; Fingerprints</h1>
        <p className="text-xs text-slate-400 mt-1">
          Perform side-by-side forensic comparative analysis to detect manipulation divergence and perceptual clone similarity.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="cyber-card p-4 rounded-xl space-y-2">
          <label className="text-xs font-mono text-cyan-400 uppercase">Primary Evidence Asset (A)</label>
          <select
            value={selectedA}
            onChange={(e) => setSelectedA(e.target.value)}
            className="w-full bg-[#0a0f1d] border border-cyan-500/20 text-xs text-slate-200 rounded-lg p-2.5 focus:outline-none"
          >
            {analyses.map((a) => (
              <option key={a._id} value={a._id}>
                {a.mediaAssetId?.originalFilename || a._id} ({(a.calibratedScore * 100).toFixed(0)}% score)
              </option>
            ))}
          </select>
        </div>

        <div className="cyber-card p-4 rounded-xl space-y-2">
          <label className="text-xs font-mono text-cyan-400 uppercase">Secondary Evidence Asset (B)</label>
          <select
            value={selectedB}
            onChange={(e) => setSelectedB(e.target.value)}
            className="w-full bg-[#0a0f1d] border border-cyan-500/20 text-xs text-slate-200 rounded-lg p-2.5 focus:outline-none"
          >
            {analyses.map((a) => (
              <option key={a._id} value={a._id}>
                {a.mediaAssetId?.originalFilename || a._id} ({(a.calibratedScore * 100).toFixed(0)}% score)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Score Banner */}
      <div className="cyber-card p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
            Perceptual Fingerprint Similarity (dHash)
          </span>
          <span className="text-3xl font-black text-cyan-400 font-mono mt-1 block">
            {similarityPct}% Match
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">
            Hamming Distance: {hammingDistance} bits of 64
          </span>
        </div>

        <div>
          {exactShaMatch ? (
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold uppercase">
              EXACT CRYPTOGRAPHIC DUPLICATE (100% SHA-256 MATCH)
            </span>
          ) : hammingDistance <= 6 ? (
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold uppercase">
              LIKELY NEAR-DUPLICATE DERIVATIVE
            </span>
          ) : (
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 uppercase">
              DISTINCT MEDIA ARTIFACTS
            </span>
          )}
        </div>
      </div>

      {/* Side-by-Side Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asset A */}
        <div className="cyber-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">EVIDENCE ASSET A</span>
            <span className="text-xs font-mono font-bold text-rose-400">
              {((analysisA?.calibratedScore || 0) * 100).toFixed(1)}% RISK
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-500 block">Filename:</span>
              <span className="text-slate-200 font-semibold">{mediaA.originalFilename || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">SHA-256:</span>
              <span className="text-cyan-400 font-mono text-[11px] truncate block">{mediaA.sha256Hash || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Perceptual dHash:</span>
              <span className="text-slate-200 font-mono text-[11px]">{mediaA.dHash || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Asset B */}
        <div className="cyber-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">EVIDENCE ASSET B</span>
            <span className="text-xs font-mono font-bold text-rose-400">
              {((analysisB?.calibratedScore || 0) * 100).toFixed(1)}% RISK
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-500 block">Filename:</span>
              <span className="text-slate-200 font-semibold">{mediaB.originalFilename || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">SHA-256:</span>
              <span className="text-cyan-400 font-mono text-[11px] truncate block">{mediaB.sha256Hash || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Perceptual dHash:</span>
              <span className="text-slate-200 font-mono text-[11px]">{mediaB.dHash || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
