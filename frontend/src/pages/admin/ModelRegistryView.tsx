import React, { useState, useEffect } from "react";
import { Cpu, ShieldCheck, CheckCircle2, AlertTriangle, BookOpen } from "lucide-react";
import { apiRequest } from "../../services/api";

export const ModelRegistryView: React.FC = () => {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiRequest("/admin/models/registry");
      if (res.success && res.models) {
        setModels(res.models);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Licensed AI Forensics Model Registry</h1>
        <p className="text-xs text-slate-400 mt-1">
          Catalog of verified pretrained deepfake detectors, architectures, licensing agreements, and empirical calibration metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {models.map((m) => (
          <div key={m.key} className="cyber-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                  {m.modality} Forensics · v{m.version}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  License: {m.license}
                </span>
              </div>
              <h3 className="font-bold text-base text-white mt-1 mb-2">{m.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">{m.description}</p>

              <div className="p-3 rounded-xl bg-[#090e1a] border border-cyan-500/10 space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Architecture &amp; Checkpoint:</span>
                  <span className="font-mono text-cyan-300 text-[11px]">{m.architecture}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Documented Source:</span>
                  <span className="text-slate-300 text-[11px]">{m.source}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Benchmarked FPR: {(m.false_positive_rate * 100).toFixed(1)}%</span>
                <span className="text-slate-400">Benchmarked FNR: {(m.false_negative_rate * 100).toFixed(1)}%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                <strong>Limitations:</strong> {m.limitations}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
