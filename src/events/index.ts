import type { HttpClient } from "../lib/http";

export interface SpritzEvent {
    id: string;
    title: string;
    description?: string;
    start_at: string;
    end_at?: string;
    location?: string;
    creator_address: string;
    created_at: string;
    rsvp_count?: number;
}

export class EventsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async list(opts?: { upcoming?: boolean; limit?: number }): Promise<{ events: SpritzEvent[] }> {
        const params: Record<string, string | number | boolean> = {};
        if (opts?.upcoming !== undefined) params.upcoming = opts.upcoming;
        if (opts?.limit) params.limit = opts.limit;
        return this.http.get("/api/events", params);
    }

    async get(eventId: string): Promise<SpritzEvent> {
        return this.http.get<SpritzEvent>(`/api/events/${eventId}`);
    }

    async create(data: Omit<SpritzEvent, "id" | "created_at" | "creator_address" | "rsvp_count">): Promise<SpritzEvent> {
        return this.http.post<SpritzEvent>("/api/events", data);
    }

    async rsvp(eventId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/events/${eventId}/rsvp`);
    }

    async cancelRsvp(eventId: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/events/${eventId}/rsvp`);
    }
}
