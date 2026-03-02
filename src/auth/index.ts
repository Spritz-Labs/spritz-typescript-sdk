import type { HttpClient } from "../lib/http";
import type {
    SessionPayload,
    SiweChallenge,
    PasskeyOptions,
    PasskeyCredential,
} from "../types";

interface AuthResponse {
    authenticated: boolean;
    sessionToken?: string;
    verified?: boolean;
    userAddress?: string;
    user?: Record<string, unknown>;
    [key: string]: unknown;
}

export class AuthModule {
    private http: HttpClient;
    private setToken: (token: string | null) => void;

    constructor(http: HttpClient, setToken: (token: string | null) => void) {
        this.http = http;
        this.setToken = setToken;
    }

    /**
     * Get current session info. Requires a valid session token.
     */
    async getSession(): Promise<SessionPayload> {
        return this.http.get<SessionPayload>("/api/auth/session");
    }

    // ── Wallet (SIWE) ──

    /**
     * Request a SIWE challenge message for the given address.
     * The user must sign this message with their wallet.
     */
    async loginWithWallet(address: string): Promise<SiweChallenge> {
        return this.http.get<SiweChallenge>("/api/auth/verify", { address });
    }

    /**
     * Verify a signed SIWE message and establish a session.
     */
    async verifyWallet(
        address: string,
        signature: string,
        message: string
    ): Promise<AuthResponse> {
        const res = await this.http.post<AuthResponse>("/api/auth/verify", {
            address,
            signature,
            message,
        });
        if (res.sessionToken) {
            this.setToken(res.sessionToken);
        }
        return res;
    }

    // ── Email ──

    /**
     * Send a login code to the given email address.
     */
    async sendEmailCode(email: string): Promise<{ success: boolean; message: string }> {
        return this.http.post("/api/email/login/send-code", { email });
    }

    /**
     * Verify an email login code and establish a session.
     */
    async verifyEmailCode(
        email: string,
        code: string
    ): Promise<AuthResponse> {
        const res = await this.http.post<AuthResponse>("/api/email/login/verify", {
            email,
            code,
        });
        if (res.sessionToken) {
            this.setToken(res.sessionToken);
        }
        return res;
    }

    // ── Passkey (WebAuthn) ──

    /**
     * Get WebAuthn authentication options for passkey login.
     * Pass these to the WebAuthn API (navigator.credentials.get).
     */
    async getPasskeyLoginOptions(
        userAddress?: string,
        useDevicePasskey?: boolean
    ): Promise<{ options: PasskeyOptions; rpId: string }> {
        return this.http.post("/api/passkey/login/options", {
            userAddress,
            useDevicePasskey,
        });
    }

    /**
     * Verify a passkey authentication and establish a session.
     */
    async verifyPasskeyLogin(
        credential: PasskeyCredential,
        challenge: string
    ): Promise<AuthResponse> {
        const res = await this.http.post<AuthResponse>("/api/passkey/login/verify", {
            credential,
            challenge,
        });
        if (res.sessionToken) {
            this.setToken(res.sessionToken);
        }
        return res;
    }

    /**
     * Get WebAuthn registration options to create a new passkey.
     */
    async getPasskeyRegisterOptions(
        userAddress: string,
        userName?: string
    ): Promise<{ options: PasskeyOptions; rpId: string }> {
        return this.http.post("/api/passkey/register/options", {
            userAddress,
            userName,
        });
    }

    /**
     * Verify a passkey registration and establish a session.
     */
    async verifyPasskeyRegister(
        credential: PasskeyCredential,
        challenge: string,
        userAddress: string
    ): Promise<AuthResponse> {
        const res = await this.http.post<AuthResponse>("/api/passkey/register/verify", {
            credential,
            challenge,
            userAddress,
        });
        if (res.sessionToken) {
            this.setToken(res.sessionToken);
        }
        return res;
    }

    /**
     * Log out and clear the session token.
     */
    async logout(): Promise<void> {
        try {
            await this.http.post("/api/auth/logout");
        } finally {
            this.setToken(null);
        }
    }
}
