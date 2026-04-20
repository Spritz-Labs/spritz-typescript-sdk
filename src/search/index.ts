import type { HttpClient } from "../lib/http";
import type { SearchResult } from "../types";

export class SearchModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async query(
        q: string,
        opts?: { types?: string[]; limit?: number; offset?: number },
    ): Promise<{ results: SearchResult[]; total: number }> {
        const params: Record<string, string | number> = { q };
        if (opts?.types?.length) params.types = opts.types.join(",");
        if (opts?.limit) params.limit = opts.limit;
        if (opts?.offset) params.offset = opts.offset;
        return this.http.get("/api/search", params);
    }
}
