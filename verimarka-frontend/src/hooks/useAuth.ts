import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
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
}

interface AuthTokens {
  access: string;
  refresh: string;
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
  username: string;
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
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    void fetchMe();
  }, []);

  async function login(email: string, password: string) {
    const data = await apiRequest<LoginResponse>("/accounts/login/", {
      method: "POST",
      body: { email, password },
    });

    setTokens(data.access, data.refresh);
    setUser(data.user);
    return data.user;
  }

  async function signup(payload: SignupPayload) {
    const data = await apiRequest<SignupResponse>("/accounts/signup/", {
      method: "POST",
      body: payload,
    });

    setTokens(data.access, data.refresh);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearTokens();
    setUser(null);
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
