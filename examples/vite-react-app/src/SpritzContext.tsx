import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { SpritzClient } from "@spritzlabs/sdk";

const API_KEY = import.meta.env.VITE_SPRITZ_API_KEY ?? "";

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): ArrayBuffer {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function serializePublicKeyCredential(credential: PublicKeyCredential): {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    authenticatorData?: string;
    signature?: string;
  };
} {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: base64urlEncode(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: base64urlEncode(response.clientDataJSON),
      authenticatorData: response.authenticatorData ? base64urlEncode(response.authenticatorData) : undefined,
      signature: response.signature ? base64urlEncode(response.signature) : undefined,
    },
  };
}
const SESSION_KEY = "spritz_session_token";

type SpritzContextValue = {
  client: SpritzClient | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, code: string) => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  loginWithWallet: (address: string, signMessage: (message: string) => Promise<string>) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
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
    // In dev, use current origin so Vite proxy forwards /api to app.spritz.chat (avoids CORS)
    const baseUrl =
      import.meta.env.DEV && typeof window !== "undefined"
        ? window.location.origin
        : undefined;
    const c = new SpritzClient({
      apiKey: API_KEY,
      baseUrl,
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

  const loginWithWallet = useCallback(
    async (address: string, signMessage: (message: string) => Promise<string>) => {
      if (!client) throw new Error("Spritz client not configured. Set VITE_SPRITZ_API_KEY.");
      const { message } = await client.auth.loginWithWallet(address);
      const signature = await signMessage(message);
      const res = await client.auth.verifyWallet(address, signature, message);
      if (res.sessionToken) setSessionToken(res.sessionToken);
    },
    [client, setSessionToken]
  );

  const loginWithPasskey = useCallback(async () => {
    if (!client) throw new Error("Spritz client not configured. Set VITE_SPRITZ_API_KEY.");
    const { options, rpId } = await client.auth.getPasskeyLoginOptions();
    const credential = await navigator.credentials.get({
      publicKey: {
        ...options,
        rpId: rpId || options.rpId,
        challenge: base64urlDecode(options.challenge),
        allowCredentials: options.allowCredentials?.map((c) => ({
          ...c,
          id: base64urlDecode(c.id),
        })),
      },
    });
    if (!credential || credential.type !== "public-key") {
      throw new Error("Passkey sign-in was cancelled or failed.");
    }
    const pkCred = credential as PublicKeyCredential;
    const payload = serializePublicKeyCredential(pkCred);
    const res = await client.auth.verifyPasskeyLogin(payload, options.challenge);
    if (res.sessionToken) setSessionToken(res.sessionToken);
  }, [client, setSessionToken]);

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
      loginWithWallet,
      loginWithPasskey,
      logout,
      setSessionToken,
    }),
    [client, isReady, isAuthenticated, login, sendCode, loginWithWallet, loginWithPasskey, logout, setSessionToken]
  );

  return <SpritzContext.Provider value={value}>{children}</SpritzContext.Provider>;
}

export function useSpritz() {
  const ctx = useContext(SpritzContext);
  if (!ctx) throw new Error("useSpritz must be used within SpritzProvider");
  return ctx;
}
