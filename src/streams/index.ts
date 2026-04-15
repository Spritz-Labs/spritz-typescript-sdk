import type { HttpClient } from "../lib/http";

export interface StreamsListOptions {
    userAddress?: string;
    live?: boolean;
    limit?: number;
}

export interface CreateStreamBody {
    userAddress?: string;
    title?: string;
    description?: string;
    record?: boolean;
}

export class StreamsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async list(options?: StreamsListOptions): Promise<{ streams: Record<string, unknown>[] }> {
        const params: Record<string, string | number | boolean> = {};
        if (options?.userAddress) params.userAddress = options.userAddress;
        if (options?.live !== undefined) params.live = options.live;
        if (options?.limit) params.limit = options.limit;
        return this.http.get("/api/streams", params);
    }

    async create(body: CreateStreamBody): Promise<{ stream: Record<string, unknown> }> {
        return this.http.post("/api/streams", body);
    }

    async get(id: string): Promise<{ stream: Record<string, unknown> }> {
        return this.http.get(`/api/streams/${id}`);
    }

    async end(id: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/streams/${id}/end`, {});
    }
}
