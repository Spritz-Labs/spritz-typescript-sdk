import type { HttpClient } from "../lib/http";

export class PointsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /** Points balance and recent history for the authenticated user */
    async get(): Promise<{
        points: number;
        claimed: Record<string, unknown>;
        history: Record<string, unknown>[];
    }> {
        return this.http.get("/api/points");
    }

    /** Daily bonus availability */
    async dailyStatus(address?: string): Promise<{
        available: boolean;
        lastClaimed: string | null;
        nextResetAt: string;
        points: number;
    }> {
        const params: Record<string, string> = {};
        if (address) params.address = address;
        return this.http.get("/api/points/daily", params);
    }

    /** Claim daily bonus (authenticated) */
    async claimDaily(): Promise<{ success: boolean; points?: number }> {
        return this.http.post("/api/points/daily", {});
    }
}
