import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SPRITZ_BRANDING } from "@spritz-labs/sdk";
import { useSpritz } from "./SpritzContext";
import "./Login.css";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

type AuthMethod = "email" | "wallet" | "passkey";

export function Login() {
  const { isReady, isAuthenticated, sendCode, login, loginWithWallet, loginWithPasskey } = useSpritz();
  const navigate = useNavigate();
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  if (isAuthenticated) {
    navigate("/chat", { replace: true });
    return null;
  }

  if (!isReady) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="spritz-brand">
            <span className="spritz-logo">{SPRITZ_BRANDING.name}</span>
            <a href={SPRITZ_BRANDING.appUrl} target="_blank" rel="noopener noreferrer" className="spritz-link">
              {SPRITZ_BRANDING.appHost}
            </a>
          </div>
          <p className="error">
            Configure <code>VITE_SPRITZ_API_KEY</code> in <code>.env</code> to use this app.
          </p>
        </div>
      </div>
    );
  }

  const onSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendCode(email);
      setSentMessage(`Check ${email} for the verification code.`);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, code);
      navigate("/chat", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const onWallet = async () => {
    setError(null);
    setLoading(true);
    try {
      const ethereum = window.ethereum;
      if (!ethereum) {
        setError("No wallet found. Install MetaMask or another Web3 wallet.");
        return;
      }
      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0];
      if (!address) {
        setError("No account selected.");
        return;
      }
      await loginWithWallet(address, async (message: string) => {
        const sig = (await ethereum.request({
          method: "personal_sign",
          params: [message, address],
        })) as string;
        return sig;
      });
      navigate("/chat", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const onPasskey = async () => {
    if (!window.PublicKeyCredential) {
      setError("Passkeys are not supported in this browser.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginWithPasskey();
      navigate("/chat", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="spritz-brand">
          <span className="spritz-logo">{SPRITZ_BRANDING.name}</span>
          <a
            href={SPRITZ_BRANDING.appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="spritz-link"
          >
            {SPRITZ_BRANDING.appHost}
          </a>
        </div>
        <h1>{SPRITZ_BRANDING.signInHeading}</h1>
        <p className="muted">Choose how you’d like to sign in.</p>

        <div className="auth-methods">
          <button
            type="button"
            className={`auth-method-tab ${method === "email" ? "active" : ""}`}
            onClick={() => { setMethod("email"); setError(null); }}
          >
            Email
          </button>
          <button
            type="button"
            className={`auth-method-tab ${method === "wallet" ? "active" : ""}`}
            onClick={() => { setMethod("wallet"); setError(null); }}
          >
            Wallet
          </button>
          <button
            type="button"
            className={`auth-method-tab ${method === "passkey" ? "active" : ""}`}
            onClick={() => { setMethod("passkey"); setError(null); }}
          >
            Passkey
          </button>
        </div>

        {method === "email" && (
          step === "email" ? (
            <form onSubmit={onSendCode}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send verification code"}
              </button>
            </form>
          ) : (
            <form onSubmit={onVerifyEmail}>
              {sentMessage && <p className="sent-msg">{sentMessage}</p>}
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
                autoFocus
              />
              <button type="submit" disabled={loading || code.length < 6}>
                {loading ? "Verifying…" : "Verify & sign in"}
              </button>
              <button
                type="button"
                className="link"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setSentMessage(null);
                  setError(null);
                }}
              >
                Use a different email
              </button>
            </form>
          )
        )}

        {method === "wallet" && (
          <div className="auth-action">
            <p className="auth-hint">Connect your wallet and sign the message to sign in.</p>
            <button type="button" className="btn btn-primary btn-block" onClick={onWallet} disabled={loading}>
              {loading ? "Check your wallet…" : "Sign in with Wallet"}
            </button>
          </div>
        )}

        {method === "passkey" && (
          <div className="auth-action">
            <p className="auth-hint">Use your device passkey or security key to sign in.</p>
            <button type="button" className="btn btn-primary btn-block" onClick={onPasskey} disabled={loading}>
              {loading ? "Use your passkey…" : "Sign in with Passkey"}
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}
        <p className="powered-by">
          {SPRITZ_BRANDING.poweredByLabel}{" "}
          <a href={SPRITZ_BRANDING.appUrl} target="_blank" rel="noopener noreferrer">
            {SPRITZ_BRANDING.name}
          </a>
        </p>
      </div>
    </div>
  );
}
