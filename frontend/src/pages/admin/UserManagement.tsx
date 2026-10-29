import React, { useState, useEffect } from "react";
import { Users, CheckCircle2, AlertCircle, Shield, UserCheck } from "lucide-react";
import { apiRequest } from "../../services/api";

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/admin/users");
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await apiRequest(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole })
      });
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        alert(res.error || "Failed to update role.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Authorized User Directory &amp; RBAC</h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect registered operator accounts and assign server-side analyst or administrator authorization roles.
        </p>
      </div>

      <div className="cyber-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-cyan-500/10">
          <h3 className="font-bold text-sm text-white">Registered User Accounts</h3>
          <p className="text-xs text-slate-400">Public registration always assigns User role. Professional analyst access requires administrator authorization.</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-cyan-400">Loading user directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#090f20] text-slate-400 font-mono uppercase text-[10px] border-b border-cyan-500/10">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Mobile (E.164)</th>
                  <th className="px-5 py-3.5">Dual Verification</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5 text-right">Modify Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-cyan-500/5 transition">
                    <td className="px-5 py-4 font-semibold text-white">{u.fullName}</td>
                    <td className="px-5 py-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">{u.phone}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            u.emailVerified ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400"
                          }`}
                        >
                          {u.emailVerified ? "EMAIL OK" : "EMAIL PENDING"}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            u.phoneVerified ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400"
                          }`}
                        >
                          {u.phoneVerified ? "PHONE OK" : "PHONE PENDING"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold uppercase text-[10px] text-cyan-400">
                      {u.role}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <select
                        disabled={updatingId === u._id}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="bg-[#090e1a] border border-cyan-500/30 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none font-mono"
                      >
                        <option value="user">User</option>
                        <option value="analyst">Analyst</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
