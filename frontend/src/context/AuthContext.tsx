import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../services/api";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "user" | "analyst" | "admin";
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled?: boolean;
  privacyConsent?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; verificationRequired?: boolean; email?: string; phone?: string }>;
  signup: (data: { fullName: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string; deliveryStatus?: any }>;
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string; fullyActivated?: boolean }>;
  verifyPhone: (phone: string, code: string) => Promise<{ success: boolean; error?: string; fullyActivated?: boolean }>;
  resendEmailOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendPhoneOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const res = await apiRequest("/auth/me");
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: pass })
    });

    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, user: res.user };
    }

    if (res.verificationRequired) {
      return {
        success: false,
        error: res.error,
        verificationRequired: true,
        email: res.email,
        phone: res.phone
      };
    }

    return { success: false, error: res.error };
  };

  const signup = async (data: { fullName: string; email: string; phone: string; password: string }) => {
    const res = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data)
    });
    return res;
  };

  const verifyEmail = async (email: string, otp: string) => {
    const res = await apiRequest("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp })
    });
    if (res.success && res.fullyActivated) {
      await refreshProfile();
    }
    return res;
  };

  const verifyPhone = async (phone: string, code: string) => {
    const res = await apiRequest("/auth/verify-phone", {
      method: "POST",
      body: JSON.stringify({ phone, code })
    });
    if (res.success && res.fullyActivated) {
      await refreshProfile();
    }
    return res;
  };

  const resendEmailOtp = async (email: string) => {
    return await apiRequest("/auth/resend-email-otp", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  };

  const resendPhoneOtp = async (phone: string) => {
    return await apiRequest("/auth/resend-phone-otp", {
      method: "POST",
      body: JSON.stringify({ phone })
    });
  };

  const logout = async () => {
    await apiRequest("/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && user.emailVerified && user.phoneVerified,
        isLoading,
        login,
        signup,
        verifyEmail,
        verifyPhone,
        resendEmailOtp,
        resendPhoneOtp,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
