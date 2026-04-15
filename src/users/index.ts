import type { HttpClient } from "../lib/http";
import type { PublicUserProfile, PublicUserLookup } from "../types";

export class UsersModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Get a full public profile by wallet address, username, or ENS name.
     * Includes socials, public agents, and scheduling info.
     * No authentication required.
     */
    async getProfile(addressOrName: string): Promise<PublicUserProfile> {
        return this.http.get<PublicUserProfile>(`/api/public/user/${encodeURIComponent(addressOrName)}`);
    }

    /**
     * Lightweight user lookup by wallet address.
     * Returns basic display info (username, display name, ENS, avatar).
     * No authentication required.
     */
    async lookup(address: string): Promise<PublicUserLookup> {
        return this.http.get<PublicUserLookup>("/api/public/user", { address });
    }
}
