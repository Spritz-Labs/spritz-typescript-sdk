import type { HttpClient } from "../lib/http";

export class UsernameModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async check(username: string): Promise<{ available: boolean; username: string }> {
        return this.http.get("/api/username/check", { username });
    }

    async claim(username: string): Promise<{ success: boolean; username: string }> {
        return this.http.post("/api/username/claim", { username });
    }

    async lookup(username: string): Promise<{ address: string | null }> {
        return this.http.get("/api/username/lookup", { username });
    }
}
