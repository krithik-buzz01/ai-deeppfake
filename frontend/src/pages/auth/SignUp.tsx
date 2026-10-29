import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Phone, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const SignUp: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time password requirement checks
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasDigit && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("Please satisfy all password security requirements.");
      return;
    }

    const fullPhone = `${countryCode}${phoneDigits.replace(/\D/g, "")}`;
    if (fullPhone.length < 11) {
      setError("Please enter a valid mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await signup({
        fullName,
        email: email.trim().toLowerCase(),
        phone: fullPhone,
        password
      });

      if (!res.success) {
        setError(res.error || "Signup request failed.");
      } else {
        // Navigate to email verification step with email in state
        navigate("/verify/email", { state: { email: email.trim().toLowerCase(), phone: fullPhone } });
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
        <h2 className="text-2xl font-extrabold text-white">Create Forensic Vault Account</h2>
        <p className="mt-2 text-xs text-slate-400">
          Dual ownership verification (email &amp; mobile) required before activation.
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Jordan Vance"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Corporate or Primary Email</label>
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

            {/* Mobile Number with country selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number (E.164 SMS Verification)</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-28 py-2.5 px-2 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="+91">🇮🇳 +91 (IN)</option>
                  <option value="+1">🇺🇸 +1 (US)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+61">🇦🇺 +61 (AU)</option>
                  <option value="+49">🇩🇪 +49 (DE)</option>
                  <option value="+65">🇸🇬 +65 (SG)</option>
                  <option value="+971">🇦🇪 +971 (AE)</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phoneDigits}
                    onChange={(e) => setPhoneDigits(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Strong Master Password</label>
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

              {/* Password checklist */}
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                <span className={`flex items-center gap-1 ${hasLength ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-3 h-3" /> 8+ Characters
                </span>
                <span className={`flex items-center gap-1 ${hasUpper ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-3 h-3" /> Uppercase letter
                </span>
                <span className={`flex items-center gap-1 ${hasDigit ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-3 h-3" /> Number digit
                </span>
                <span className={`flex items-center gap-1 ${hasSpecial ? "text-emerald-400" : "text-slate-500"}`}>
                  <CheckCircle2 className="w-3 h-3" /> Symbol character
                </span>
              </div>
            </div>

            {/* Consent check */}
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="consent"
                required
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="consent" className="text-[11px] text-slate-400 leading-snug">
                I agree to the VERIFAI Zero-Trust media handling policy. I understand uploads are processed with private signed URLs and never used for public model training.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs py-3 rounded-lg shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Registering &amp; Disagreeing OTPs...</span>
              ) : (
                <>
                  <span>Create Account &amp; Proceed to Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 border-t border-cyan-500/10 pt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
