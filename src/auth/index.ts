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
     * Normalizes nested response shape ({ session: { userAddress, ... } }) to flat SessionPayload.
     */
    async getSession(): Promise<SessionPayload> {
        const raw = await this.http.get<SessionPayload | { session: SessionPayload; authenticated?: boolean }>("/api/auth/session");
        if (raw && typeof raw === "object" && "session" in raw && raw.session && typeof raw.session === "object") {
            return { ...raw.session, authenticated: (raw as { authenticated?: boolean }).authenticated ?? true };
        }
        return raw as SessionPayload;
    }

    // ── Wallet (SIWE) ──

    private walletAddressHeaders(address: string): Record<string, string> {
        return {
            "X-Address": address,
            "X-User-Address": address,
            "X-Wallet-Address": address,
        };
    }

    /**
     * Request a SIWE challenge message for the given address.
     * Sends address in query params and headers for backend compatibility.
     */
    async loginWithWallet(address: string): Promise<SiweChallenge> {
        return this.http.get<SiweChallenge>(
            "/api/auth/verify",
            { address, userAddress: address, user_address: address },
            this.walletAddressHeaders(address)
        );
    }

    /**
     * Verify a signed SIWE message and establish a session.
     * Sends address in query, body, and headers for backend compatibility.
     */
    async verifyWallet(
        address: string,
        signature: string,
        message: string
    ): Promise<AuthResponse> {
        const body = {
            address,
            userAddress: address,
            user_address: address,
            message,
            signature,
        };
        const res = await this.http.post<AuthResponse>(
            "/api/auth/verify",
            body,
            { address, userAddress: address, user_address: address },
            this.walletAddressHeaders(address)
        );
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
