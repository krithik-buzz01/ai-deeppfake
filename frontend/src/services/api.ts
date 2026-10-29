export const API_BASE = "/api/v1";

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers
      },
      credentials: "include"
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP error ${res.status}: ${res.statusText}`,
        status: res.status,
        ...data
      };
    }

    return { success: true, ...data };
  } catch (err: any) {
    return { success: false, error: err.message || "Network communication error." };
  }
}
