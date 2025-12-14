import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiRequest } from "@/lib/api-client";
import type { AuthResponse, AuthUser } from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOutUser: () => void;
  token: string | null;
}

const TOKEN_KEY = "ai-workshop-token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function hydrate() {
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }
      try {
        setLoading(true);
        const currentUser = await apiRequest<AuthUser>("/auth/me", { authToken: token });
        setUser(currentUser);
      } catch (err) {
        console.error(err);
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    void hydrate();
  }, [token]);

  const authActions = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      error,
      async signIn(email, password) {
        setError(null);
        try {
          const result = await apiRequest<AuthResponse>("/auth/signin", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          localStorage.setItem(TOKEN_KEY, result.token);
          setToken(result.token);
          setUser(result.user);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to sign in");
          throw err;
        }
      },
      async signUp(email, password) {
        setError(null);
        try {
          const result = await apiRequest<AuthResponse>("/auth/signup", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          localStorage.setItem(TOKEN_KEY, result.token);
          setToken(result.token);
          setUser(result.user);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to create account");
          throw err;
        }
      },
      signOutUser() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [user, token, loading, error],
  );

  return <AuthContext.Provider value={authActions}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

