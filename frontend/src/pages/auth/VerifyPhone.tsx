import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Phone, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const VerifyPhone: React.FC = () => {
  const { verifyPhone, resendPhoneOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [phone, setPhone] = useState<string>(location.state?.phone || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length < 4) {
      setError("Please enter the complete SMS verification code.");
      return;
    }

    if (!phone) {
      setError("Mobile phone number is missing. Please restart registration.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await verifyPhone(phone, code.trim());
      if (!res.success) {
        setError(res.error || "Phone verification failed.");
      } else {
        setSuccessMsg("Mobile phone ownership confirmed! Both authentication factors satisfied.");
        setTimeout(() => {
          navigate("/portal/user/overview");
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !phone) return;
    setResending(true);
    setError(null);
    try {
      const res = await resendPhoneOtp(phone);
      if (res.success) {
        setCooldown(60);
        setSuccessMsg("New SMS verification code dispatched to your mobile number.");
      } else {
        setError(res.error || "Failed to resend SMS.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 cyber-grid">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 mx-auto mb-4 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
            <Phone className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-white">Verify Mobile Ownership</h2>
        <p className="mt-2 text-xs text-slate-400">
          Enter the SMS code delivered to your registered mobile number <strong className="text-cyan-300 font-mono">{phone || "your phone"}</strong>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="cyber-card py-8 px-6 sm:px-10 rounded-2xl shadow-xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {!phone && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Mobile Number (E.164)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full px-3 py-2 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-xs text-slate-200 font-mono"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-center text-slate-400 mb-3 uppercase tracking-wider">
                SMS One-Time Code
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center font-mono text-2xl tracking-[0.5em] font-bold py-3 bg-[#0a0f1d] border border-cyan-500/30 rounded-lg text-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="text-center text-xs text-slate-400">
              <span>Verified via SMS Gateway. Code expires in <strong>5 minutes</strong>.</span>
            </div>

            <button
              type="submit"
              disabled={loading || code.trim().length < 4}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs py-3 rounded-lg shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Confirming Provider Delivery...</span>
              ) : (
                <>
                  <span>Activate Account &amp; Enter Vault</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend Cooldown */}
          <div className="mt-6 text-center text-xs text-slate-400 border-t border-cyan-500/10 pt-4 flex items-center justify-between">
            <span>Didn't receive SMS?</span>
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="flex items-center gap-1.5 text-cyan-400 hover:underline disabled:text-slate-600 font-semibold"
            >
              <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
              <span>{cooldown > 0 ? `Resend SMS (${cooldown}s)` : "Resend SMS"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
