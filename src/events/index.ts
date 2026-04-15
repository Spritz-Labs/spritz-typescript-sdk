import type { HttpClient } from "../lib/http";

export interface PublicEventsListOptions {
    type?: string;
    city?: string;
    country?: string;
    blockchain?: string;
    featured?: boolean;
    search?: string;
    from?: string;
    to?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
}

export class EventsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * List published public events (no auth).
     */
    async list(options?: PublicEventsListOptions): Promise<{
        events: Record<string, unknown>[];
        total: number;
        limit: number;
        offset: number;
        filters: {
            eventTypes: string[];
            cities: string[];
            countries: string[];
            blockchains: string[];
        };
    }> {
        const params: Record<string, string | number | boolean> = {};
        if (options?.type) params.type = options.type;
        if (options?.city) params.city = options.city;
        if (options?.country) params.country = options.country;
        if (options?.blockchain) params.blockchain = options.blockchain;
        if (options?.featured === true) params.featured = "true";
        if (options?.search) params.search = options.search;
        if (options?.from) params.from = options.from;
        if (options?.to) params.to = options.to;
        if (options?.upcoming !== undefined) params.upcoming = options.upcoming;
        if (options?.limit) params.limit = options.limit;
        if (options?.offset !== undefined) params.offset = options.offset;
        return this.http.get("/api/events", params);
    }

    /** Events created by the authenticated user */
    async listMine(): Promise<{ events: Record<string, unknown>[] }> {
        return this.http.get("/api/events/mine");
    }

    /** Single published event by URL slug */
    async getBySlug(slug: string): Promise<{
        event: Record<string, unknown>;
        isRegistered: boolean;
    }> {
        return this.http.get(`/api/events/by-slug/${encodeURIComponent(slug)}`);
    }
}
