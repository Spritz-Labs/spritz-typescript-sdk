import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SPRITZ_BRANDING } from "@spritz-labs/sdk";
import { useSpritz } from "./SpritzContext";
import "./Login.css";

export function Login() {
  const { isReady, isAuthenticated, sendCode, login } = useSpritz();
  const navigate = useNavigate();
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

  const onVerify = async (e: React.FormEvent) => {
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
        <p className="muted">{SPRITZ_BRANDING.signInSubtext}</p>

        {step === "email" ? (
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
          <form onSubmit={onVerify}>
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
