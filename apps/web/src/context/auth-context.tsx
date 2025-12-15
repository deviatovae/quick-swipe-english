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
import { useQuizStore } from "@/store/use-quiz-store";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOutUser: () => void;
  token: string | null;
  isNewUser: boolean;
  clearNewUserFlag: () => void;
}

const TOKEN_KEY = "ai-workshop-token";

const clearQuizStore = () => {
  if (typeof window === "undefined") return;
  try {
    // Clear persisted storage
    useQuizStore.persist.clearStorage();
    // Reset in-memory state
    useQuizStore.setState({
      wordOrder: [],
      currentIndex: 0,
      knownWordIds: [],
      unknownWordIds: [],
      sessionDate: new Date().toISOString().slice(0, 10),
      reviewedToday: [],
    });
  } catch (err) {
    console.error("Failed to clear quiz store", err);
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

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
        clearQuizStore();
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
      isNewUser,
      clearNewUserFlag() {
        setIsNewUser(false);
      },
      async signIn(email, password) {
        setError(null);
        try {
          const result = await apiRequest<AuthResponse>("/auth/signin", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          clearQuizStore();
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
          clearQuizStore();
          localStorage.setItem(TOKEN_KEY, result.token);
          setToken(result.token);
          setUser(result.user);
          setIsNewUser(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to create account");
          throw err;
        }
      },
      signOutUser() {
        localStorage.removeItem(TOKEN_KEY);
        clearQuizStore();
        setToken(null);
        setUser(null);
      },
    }),
    [user, token, loading, error, isNewUser],
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

