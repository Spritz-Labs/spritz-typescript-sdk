import type { HttpClient } from "../lib/http";

export interface UsernameInfo {
    wallet_address: string;
    username: string | null;
}

export class UsernameModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Get the username for a wallet address.
     * Returns null if the address has no username set.
     */
    async getForAddress(address: string): Promise<UsernameInfo> {
        return this.http.get<UsernameInfo>("/api/username", { address });
    }

    /**
     * Claim or update the authenticated user's username.
     * Rules: 3–20 chars, a–z / 0–9 / underscore only.
     * Returns 409 if the name is already taken or reserved.
     */
    async claim(username: string): Promise<{ success: boolean; username: string; isNew: boolean }> {
        return this.http.post("/api/username", { username });
    }

    /**
     * Remove the authenticated user's username.
     * Also clears the linked ENS subname claim if present.
     */
    async remove(): Promise<{ success: boolean }> {
        return this.http.delete("/api/username");
    }

    /**
     * Resolve a Spritz username to a wallet address.
     * Returns null if the username doesn't exist.
     */
    async resolve(username: string): Promise<{ address: string | null }> {
        return this.http.get("/api/username/resolve", { username });
    }
}
