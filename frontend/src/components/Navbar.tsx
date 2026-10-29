import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Terminal, UserCheck, ChevronRight, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070b14]/80 border-b border-cyan-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
            <div className="w-full h-full bg-[#070b14] rounded-[7px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition duration-300" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-wider text-white">
            VERIF<span className="text-cyan-400">AI</span>
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded ml-1">
            SEC-VAULT
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <Link to="/#features" className="hover:text-cyan-400 transition">Features</Link>
          <Link to="/#how-it-works" className="hover:text-cyan-400 transition">Methodology</Link>
          <Link to="/#demonstration" className="hover:text-cyan-400 transition">Live Demo</Link>
          <Link to="/#provenance" className="hover:text-cyan-400 transition">C2PA Credentials</Link>
          <Link to="/#privacy" className="hover:text-cyan-400 transition">Privacy & Ethics</Link>
        </nav>

        {/* Right side CTAs */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                to={user.role === "admin" ? "/portal/admin/dashboard" : user.role === "analyst" ? "/portal/analyst/queue" : "/portal/user/overview"}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg shadow-md shadow-cyan-500/20 transition"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{user.role === "admin" ? "Admin Portal" : user.role === "analyst" ? "Analyst Portal" : "Investigation Desk"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => logout()}
                className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-cyan-400 px-3 py-1.5 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Create Vault</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
