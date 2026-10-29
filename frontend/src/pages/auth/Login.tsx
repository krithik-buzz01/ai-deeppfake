import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Sparkles, UserCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedState, setUnverifiedState] = useState<{ email?: string; phone?: string } | null>(null);

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverifiedState(null);

    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res.success) {
        const role = res.user?.role;
        if (role === "admin") {
          navigate("/portal/admin/dashboard");
        } else if (role === "analyst") {
          navigate("/portal/analyst/queue");
        } else {
          navigate("/portal/user/overview");
        }
      } else if (res.verificationRequired) {
        setUnverifiedState({ email: res.email, phone: res.phone });
        setError(res.error || "Both email and phone ownership must be verified before signing in.");
      } else {
        setError(res.error || "Authentication failed.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 cyber-grid">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#070b14] rounded-[7px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-wider text-white">
            VERIF<span className="text-cyan-400">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-white">Authenticate to Media Vault</h2>
        <p className="mt-2 text-xs text-slate-400">
          Argon2id password verification &amp; rotating secure sessions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="cyber-card py-8 px-6 sm:px-10 rounded-2xl shadow-xl">
          {/* Quick Demo Access Quick-Fill Banner */}
          <div className="mb-6 p-4 rounded-xl bg-[#090e1a] border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quick Login (Verified Local Credentials)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("admin@verifai.io", "Admin@123456")}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#0e162a] border border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/30 transition text-center group cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400 mb-1 group-hover:scale-110 transition" />
                <span className="text-[10px] font-bold text-purple-300">Admin</span>
                <span className="text-[9px] text-slate-400 font-mono">Full Portal</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("analyst@verifai.io", "Analyst@123456")}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#0e162a] border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/30 transition text-center group cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400 mb-1 group-hover:scale-110 transition" />
                <span className="text-[10px] font-bold text-cyan-300">Analyst</span>
                <span className="text-[9px] text-slate-400 font-mono">Forensic Queue</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("user@verifai.io", "User@123456")}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#0e162a] border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30 transition text-center group cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 mb-1 group-hover:scale-110 transition" />
                <span className="text-[10px] font-bold text-emerald-300">User</span>
                <span className="text-[9px] text-slate-400 font-mono">Vault Desk</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span>{error}</span>
                {unverifiedState && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/verify/email", {
                          state: { email: unverifiedState.email, phone: unverifiedState.phone }
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded hover:bg-cyan-500/30 transition"
                    >
                      <span>Complete Verification Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Master Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs py-3 rounded-lg shadow-md shadow-cyan-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating with Argon2id...</span>
              ) : (
                <>
                  <span>Sign In to Vault</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 border-t border-cyan-500/10 pt-4">
            Need an account?{" "}
            <Link to="/signup" className="text-cyan-400 hover:underline font-semibold">
              Create Vault
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
