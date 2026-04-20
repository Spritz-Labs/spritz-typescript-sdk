import type { HttpClient } from "../lib/http";

export interface LiveStream {
    id: string;
    user_address: string;
    title: string;
    status: "live" | "ended";
    viewer_count: number;
    playback_id?: string;
    stream_key?: string;
    created_at: string;
}

export class StreamsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async list(opts?: { status?: "live" | "ended" }): Promise<{ streams: LiveStream[] }> {
        const params: Record<string, string> = {};
        if (opts?.status) params.status = opts.status;
        return this.http.get("/api/streams", params);
    }

    async get(streamId: string): Promise<LiveStream> {
        return this.http.get<LiveStream>(`/api/streams/${streamId}`);
    }

    async create(title: string): Promise<LiveStream> {
        return this.http.post<LiveStream>("/api/streams", { title });
    }

    async end(streamId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/streams/${streamId}/end`);
    }
}
