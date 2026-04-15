import type { HttpClient } from "../lib/http";

export class UsernameModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Resolve a Spritz username to a wallet address (public).
     */
    async resolve(username: string): Promise<{ username: string; address: string }> {
        const normalized = username.replace(/^@/, "").trim();
        return this.http.get("/api/username/resolve", { username: normalized });
    }
}
