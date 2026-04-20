import type { HttpClient } from "../lib/http";

export interface TokenChat {
    id: string;
    token_address: string;
    chain_id: number;
    name: string;
    symbol: string;
    member_count: number;
    message_count: number;
    created_at: string;
}

export class TokenChatsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async list(): Promise<{ chats: TokenChat[] }> {
        return this.http.get("/api/token-chats");
    }

    async get(chatId: string): Promise<TokenChat> {
        return this.http.get<TokenChat>(`/api/token-chats/${chatId}`);
    }

    async getMessages(chatId: string, opts?: { limit?: number; before?: string }): Promise<{ messages: unknown[] }> {
        const params: Record<string, string | number> = {};
        if (opts?.limit) params.limit = opts.limit;
        if (opts?.before) params.before = opts.before;
        return this.http.get(`/api/token-chats/${chatId}/messages`, params);
    }

    async sendMessage(chatId: string, content: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/token-chats/${chatId}/messages`, { content });
    }
}
