import { useEffect, useState } from "react";
import { apiRequest, refreshAccessToken } from "../lib/api";
import { clearTokens, getAccessToken, setTokens } from "../lib/token";

export interface MeResponse {
  id: number;
  username: string;
  nickname: string;
  display_name: string;
  email: string;
  email_verified: boolean;
  phone: string | null;
  phone_verified: boolean;
  last_login_at: string | null;
  auth_provider: string;
  is_profile_completed: boolean;
  providers: string[];
  wallet_address: string | null;
  wallet_chain_id: number | null;
  wallet_type: string;
}

interface AuthTokens {
  access: string;
}

interface LoginResponse extends AuthTokens {
  user: MeResponse;
}

interface SignupResponse extends AuthTokens {
  user: MeResponse;
  created: boolean;
}

interface SignupPayload {
  email: string;
  nickname: string;
  password: string;
  terms_agreed: boolean;
  privacy_agreed: boolean;
}

interface UpdateProfilePayload {
  display_name?: string;
  email?: string;
}

export function useAuth() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      const me = await apiRequest<MeResponse>("/accounts/me/", {
        auth: true,
      });
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(() => {
      void (async () => {
        let token = getAccessToken();
        if (!token) {
          token = await refreshAccessToken({ dispatchEvents: false });
        }
        if (cancelled) return;
        if (token) {
          await fetchMe();
          return;
        }
        setLoading(false);
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  async function login(email: string, password: string) {
    const data = await apiRequest<LoginResponse>("/accounts/login/", {
      method: "POST",
      body: { email, password },
    });

    setTokens(data.access);
    setUser(data.user);
    return data.user;
  }

  async function signup(payload: SignupPayload) {
    const data = await apiRequest<SignupResponse>("/accounts/signup/", {
      method: "POST",
      body: payload,
    });

    setTokens(data.access);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await apiRequest("/accounts/logout/", {
        method: "POST",
      });
    } finally {
      clearTokens();
      setUser(null);
    }
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    const data = await apiRequest<MeResponse>("/accounts/me/", {
      method: "PATCH",
      auth: true,
      body: payload,
    });

    setUser(data);
    return data;
  }

  async function withdraw() {
    await apiRequest<{ message: string }>("/accounts/withdraw/", {
      method: "DELETE",
      auth: true,
    });
    clearTokens();
    setUser(null);
  }

  return {
    user,
    loading,
    isLoggedIn: !!user,
    login,
    signup,
    logout,
    withdraw,
    refreshMe: fetchMe,
    updateProfile,
  };
}
