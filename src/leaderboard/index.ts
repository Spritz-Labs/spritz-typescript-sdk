import type { HttpClient } from "../lib/http";

export interface LeaderboardEntry {
    address: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    score: number;
    rank: number;
}

export class LeaderboardModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async get(opts?: { limit?: number; period?: string }): Promise<{ entries: LeaderboardEntry[] }> {
        const params: Record<string, string | number> = {};
        if (opts?.limit) params.limit = opts.limit;
        if (opts?.period) params.period = opts.period;
        return this.http.get("/api/leaderboard", params);
    }

    async getMyRank(): Promise<LeaderboardEntry | null> {
        const res = await this.http.get<{ entry: LeaderboardEntry | null }>("/api/leaderboard/me");
        return res.entry ?? null;
    }
}
