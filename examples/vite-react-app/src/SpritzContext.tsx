import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { SpritzClient } from "@spritz-labs/sdk";

const API_KEY = import.meta.env.VITE_SPRITZ_API_KEY ?? "";
const SESSION_KEY = "spritz_session_token";

type SpritzContextValue = {
  client: SpritzClient | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, code: string) => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  setSessionToken: (token: string | null) => void;
};

const SpritzContext = createContext<SpritzContextValue | null>(null);

export function SpritzProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionTokenState] = useState<string | null>(() => {
    return typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
  });

  const setSessionToken = useCallback((token: string | null) => {
    setSessionTokenState(token);
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem(SESSION_KEY, token);
      else localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const client = useMemo(() => {
    if (!API_KEY) return null;
    const c = new SpritzClient({
      apiKey: API_KEY,
      sessionToken: sessionToken ?? undefined,
    });
    if (sessionToken) c.sessionToken = sessionToken;
    return c;
  }, [API_KEY, sessionToken]);

  const isAuthenticated = client?.isAuthenticated ?? false;
  const isReady = !!API_KEY;

  const sendCode = useCallback(
    async (email: string) => {
      if (!client) throw new Error("Spritz client not configured. Set VITE_SPRITZ_API_KEY.");
      await client.auth.sendEmailCode(email);
    },
    [client]
  );

  const login = useCallback(
    async (email: string, code: string) => {
      if (!client) throw new Error("Spritz client not configured. Set VITE_SPRITZ_API_KEY.");
      const res = await client.auth.verifyEmailCode(email, code);
      if (res.sessionToken) setSessionToken(res.sessionToken);
    },
    [client, setSessionToken]
  );

  const logout = useCallback(async () => {
    if (client?.isAuthenticated) {
      try {
        await client.auth.logout();
      } catch {
        // clear local session anyway
      }
    }
    setSessionToken(null);
  }, [client, setSessionToken]);

  const value: SpritzContextValue = useMemo(
    () => ({
      client,
      isReady,
      isAuthenticated,
      login,
      sendCode,
      logout,
      setSessionToken,
    }),
    [client, isReady, isAuthenticated, login, sendCode, logout, setSessionToken]
  );

  return <SpritzContext.Provider value={value}>{children}</SpritzContext.Provider>;
}

export function useSpritz() {
  const ctx = useContext(SpritzContext);
  if (!ctx) throw new Error("useSpritz must be used within SpritzProvider");
  return ctx;
}
