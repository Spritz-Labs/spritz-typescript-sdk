import type { HttpClient } from "../lib/http";

export class LeaderboardModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /** Top users by points (public). */
    async list(options?: { limit?: number }): Promise<{
        leaderboard: Array<{
            rank: number;
            address: string;
            username: string | null;
            ensName: string | null;
            points: number;
        }>;
        total: number;
    }> {
        const params: Record<string, number> = {};
        if (options?.limit) params.limit = options.limit;
        return this.http.get("/api/leaderboard", params);
    }
}
