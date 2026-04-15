import type { HttpClient } from "../lib/http";
import type { DeveloperKey, CreateKeyResponse } from "../types";

export class DeveloperModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * List all API keys for the authenticated user.
     * Keys are returned with masked previews (full key is only shown on creation).
     */
    async listKeys(): Promise<DeveloperKey[]> {
        const res = await this.http.get<{ keys: DeveloperKey[] }>("/api/developer/keys");
        return res.keys ?? [];
    }

    /**
     * Create a new API key.
     * The full key value is only returned once in the response — store it securely.
     * Non-admin keys require approval before they become active.
     *
     * @param name - Optional display name for the key.
     * @param scopes - Optional scopes (defaults to ["read", "write"]).
     */
    async createKey(name?: string, scopes?: string[]): Promise<CreateKeyResponse> {
        const body: Record<string, unknown> = {};
        if (name) body.name = name;
        if (scopes) body.scopes = scopes;
        return this.http.post<CreateKeyResponse>("/api/developer/keys", body);
    }

    /**
     * Revoke (delete) an API key by its ID.
     */
    async revokeKey(keyId: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/developer/keys/${keyId}`);
    }
}
