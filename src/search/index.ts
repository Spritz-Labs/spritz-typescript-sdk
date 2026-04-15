import type { HttpClient } from "../lib/http";
import type { SearchResult } from "../types";

export interface SearchOptions {
    q: string;
    type?: "all" | "channels" | "dms" | "groups" | "alpha";
    limit?: number;
    /** Required when not using a session; must match the searching user's wallet */
    userAddress?: string;
}

export class SearchModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Full-text search across joined channel messages and Spritz Global (alpha).
     * Requires authentication or `userAddress` query param.
     */
    async query(options: SearchOptions): Promise<{
        results: SearchResult[];
        total: number;
        query: string;
    }> {
        const params: Record<string, string | number> = { q: options.q };
        if (options.type) params.type = options.type;
        if (options.limit) params.limit = options.limit;
        if (options.userAddress) params.userAddress = options.userAddress;
        return this.http.get("/api/search", params);
    }
}
