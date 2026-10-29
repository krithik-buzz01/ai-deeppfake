import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  UploadCloud,
  FileSearch,
  Layers,
  History,
  FileText,
  Settings,
  Users,
  Cpu,
  Activity,
  LogOut,
  FolderLock,
  GitCompare,
  Camera,
  CheckCircle2,
  AlertTriangle,
  BadgeAlert
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const PortalLayout: React.FC<{ portalType: "user" | "analyst" | "admin" }> = ({ portalType }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  const userNav = [
    { label: "Overview", to: "/portal/user/overview", icon: LayoutDashboard },
    { label: "New Analysis", to: "/portal/user/new", icon: UploadCloud },
    { label: "Live Capture", to: "/portal/user/live", icon: Camera },
    { label: "Compare Evidence", to: "/portal/user/compare", icon: GitCompare },
    { label: "Claim Verification", to: "/portal/user/claims", icon: FileSearch },
    { label: "Investigation History", to: "/portal/user/history", icon: History },
    { label: "Forensic Reports", to: "/portal/user/reports", icon: FileText },
    { label: "Vault Settings", to: "/portal/user/settings", icon: Settings }
  ];

  const analystNav = [
    { label: "Investigation Queue", to: "/portal/analyst/queue", icon: FolderLock },
    { label: "Case Timeline", to: "/portal/analyst/timeline", icon: Layers },
    { label: "Frame Annotations", to: "/portal/analyst/annotations", icon: FileSearch },
    { label: "Report Approvals", to: "/portal/analyst/approvals", icon: CheckCircle2 }
  ];

  const adminNav = [
    { label: "Admin Console", to: "/portal/admin/dashboard", icon: Activity },
    { label: "User Directory", to: "/portal/admin/users", icon: Users },
    { label: "AI Model Registry", to: "/portal/admin/models", icon: Cpu },
    { label: "Provider Health", to: "/portal/admin/providers", icon: ShieldCheck },
    { label: "Tamper Audit Logs", to: "/portal/admin/audit", icon: FileText }
  ];

  const navItems = portalType === "admin" ? adminNav : portalType === "analyst" ? analystNav : userNav;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-cyan-500/10 bg-[#0a0f1d] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="h-16 flex items-center px-5 border-b border-cyan-500/10 gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070b14] rounded flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-white">VERIF<span className="text-cyan-400">AI</span></span>
              <span className="block text-[9px] font-mono text-cyan-500 uppercase tracking-widest">
                {portalType.toUpperCase()} PORTAL
              </span>
            </div>
          </div>

          {/* User badge */}
          <div className="p-4 mx-3 my-3 rounded-lg bg-[#0e162a] border border-cyan-500/10 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-200 truncate">{user?.fullName || "Operator"}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                {user?.role || "USER"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Email
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Phone
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition duration-150 ${
                      isActive
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-semibold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-cyan-500/10 space-y-2">
          {/* Cross portal switcher */}
          {user?.role === "admin" && (
            <div className="space-y-1 text-xs">
              <Link to="/portal/user/overview" className="block text-[11px] text-slate-400 hover:text-cyan-400 transition">
                &rarr; Switch to User View
              </Link>
              <Link to="/portal/analyst/queue" className="block text-[11px] text-slate-400 hover:text-cyan-400 transition">
                &rarr; Switch to Analyst View
              </Link>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 px-3 py-2 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-cyan-500/10 bg-[#0a0f1d]/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-mono text-cyan-400 uppercase tracking-widest">{portalType}</span>
            <span>/</span>
            <span className="text-slate-200 font-medium capitalize">Forensics Workspace</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#0e162a] border border-cyan-500/20 px-3 py-1 rounded-full text-[11px] text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>INFERENCE SERVICE ACTIVE</span>
            </div>
            <Link to="/" className="text-xs text-slate-400 hover:text-cyan-300 transition">
              Home
            </Link>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 overflow-y-auto p-6 cyber-grid">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
