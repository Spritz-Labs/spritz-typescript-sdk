import type { HttpClient } from "../lib/http";
import type { DeveloperKey, CreateKeyResponse } from "../types";

export class DeveloperModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async listKeys(): Promise<{ keys: DeveloperKey[] }> {
        return this.http.get("/api/developer/keys");
    }

    async createKey(name?: string, scopes?: string[]): Promise<CreateKeyResponse> {
        return this.http.post<CreateKeyResponse>("/api/developer/keys", { name, scopes });
    }

    async revokeKey(keyId: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/developer/keys/${keyId}`);
    }
}
