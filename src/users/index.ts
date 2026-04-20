import type { HttpClient } from "../lib/http";
import type { PublicUserProfile, PublicUserLookup } from "../types";

export class UsersModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async getProfile(address: string): Promise<PublicUserProfile> {
        return this.http.get<PublicUserProfile>(`/api/public/user/${address}`);
    }

    async lookup(address: string): Promise<PublicUserLookup> {
        return this.http.get<PublicUserLookup>("/api/public/user", { address });
    }

    async getOnlineStatus(addresses: string[]): Promise<Record<string, boolean>> {
        return this.http.post<Record<string, boolean>>("/api/presence/status", { addresses });
    }
}
