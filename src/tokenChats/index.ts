import type { HttpClient } from "../lib/http";

export interface CreateTokenChatBody {
    userAddress: string;
    tokenAddress: string;
    tokenChainId: number;
    tokenName?: string;
    tokenSymbol?: string;
    tokenDecimals?: number;
    tokenImage?: string;
    minBalance?: string;
    minBalanceDisplay?: string;
    isOfficial?: boolean;
    name: string;
    description?: string;
    emoji?: string;
    messagingType?: "standard" | "waku";
}

export interface TokenChatsListOptions {
    userAddress?: string;
    tokenAddress?: string;
    chainId?: number;
    search?: string;
    mode?: "browse" | "my";
}

export class TokenChatsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async list(options?: TokenChatsListOptions): Promise<{ chats: Record<string, unknown>[] }> {
        const params: Record<string, string> = {};
        if (options?.userAddress) params.userAddress = options.userAddress;
        if (options?.tokenAddress) params.tokenAddress = options.tokenAddress;
        if (options?.chainId !== undefined) params.chainId = String(options.chainId);
        if (options?.search) params.search = options.search;
        if (options?.mode) params.mode = options.mode;
        return this.http.get("/api/token-chats", params);
    }

    async create(body: CreateTokenChatBody): Promise<{ chat: Record<string, unknown> }> {
        return this.http.post("/api/token-chats", body);
    }

    /** Public metadata for a token chat */
    async get(id: string): Promise<Record<string, unknown>> {
        return this.http.get(`/api/public/token-chats/${id}`);
    }
}
