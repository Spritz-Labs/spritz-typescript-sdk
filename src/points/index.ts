import type { HttpClient } from "../lib/http";

export interface PointsBalance {
    address: string;
    balance: number;
    lifetime_earned: number;
}

export interface PointsTransaction {
    id: string;
    amount: number;
    reason: string;
    created_at: string;
}

export class PointsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async getBalance(): Promise<PointsBalance> {
        return this.http.get<PointsBalance>("/api/points/balance");
    }

    async getHistory(opts?: { limit?: number; before?: string }): Promise<{ transactions: PointsTransaction[] }> {
        const params: Record<string, string | number> = {};
        if (opts?.limit) params.limit = opts.limit;
        if (opts?.before) params.before = opts.before;
        return this.http.get("/api/points/history", params);
    }
}
