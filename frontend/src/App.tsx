import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Public Pages
import { Home } from "./pages/public/Home";
import { SignUp } from "./pages/auth/SignUp";
import { Login } from "./pages/auth/Login";
import { VerifyEmail } from "./pages/auth/VerifyEmail";
import { VerifyPhone } from "./pages/auth/VerifyPhone";

// Portal Layout & Pages
import { PortalLayout } from "./components/PortalLayout";
import { Overview } from "./pages/user/Overview";
import { NewAnalysis } from "./pages/user/NewAnalysis";
import { Results } from "./pages/user/Results";
import { LiveCapture } from "./pages/user/LiveCapture";
import { CompareEvidence } from "./pages/user/CompareEvidence";
import { ClaimVerification } from "./pages/user/ClaimVerification";
import { History } from "./pages/user/History";
import { Reports } from "./pages/user/Reports";
import { Settings } from "./pages/user/Settings";

// Analyst Pages
import { InvestigationQueue } from "./pages/analyst/InvestigationQueue";
import { CaseDetail } from "./pages/analyst/CaseDetail";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UserManagement } from "./pages/admin/UserManagement";
import { ProviderHealth } from "./pages/admin/ProviderHealth";
import { ModelRegistryView } from "./pages/admin/ModelRegistryView";
import { AuditLogsView } from "./pages/admin/AuditLogsView";

const ProtectedRoute: React.FC<{ children: React.ReactElement; requiredRole?: string }> = ({
  children,
  requiredRole
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center font-mono text-cyan-400 text-xs">
        Authenticating session tokens...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return <Navigate to="/portal/user/overview" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Views */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify/email" element={<VerifyEmail />} />
          <Route path="/verify/phone" element={<VerifyPhone />} />

          {/* User Portal */}
          <Route
            path="/portal/user"
            element={
              <ProtectedRoute>
                <PortalLayout portalType="user" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="new" element={<NewAnalysis />} />
            <Route path="live" element={<LiveCapture />} />
            <Route path="compare" element={<CompareEvidence />} />
            <Route path="claims" element={<ClaimVerification />} />
            <Route path="history" element={<History />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="results/:analysisId" element={<Results />} />
          </Route>

          {/* Analyst Portal */}
          <Route
            path="/portal/analyst"
            element={
              <ProtectedRoute requiredRole="analyst">
                <PortalLayout portalType="analyst" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="queue" replace />} />
            <Route path="queue" element={<InvestigationQueue />} />
            <Route path="case/:caseId" element={<CaseDetail />} />
            <Route path="timeline" element={<InvestigationQueue />} />
            <Route path="annotations" element={<InvestigationQueue />} />
            <Route path="approvals" element={<InvestigationQueue />} />
          </Route>

          {/* Admin Portal */}
          <Route
            path="/portal/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <PortalLayout portalType="admin" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="providers" element={<ProviderHealth />} />
            <Route path="models" element={<ModelRegistryView />} />
            <Route path="audit" element={<AuditLogsView />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
