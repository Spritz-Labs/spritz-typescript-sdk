import type { HttpClient } from "../lib/http";
import type {
    Agent,
    AgentInfo,
    AgentChatOptions,
    AgentChatResponse,
    AgentChatStreamEvent,
    AgentHistoryResponse,
} from "../types";

export class AgentsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    // ── Discovery ──

    /**
     * List the authenticated user's own agents.
     */
    async list(userAddress: string): Promise<Agent[]> {
        const res = await this.http.get<{ agents: Agent[] }>("/api/agents", { userAddress });
        return res.agents ?? [];
    }

    /**
     * Discover public, friends', and official agents.
     */
    async discover(
        userAddress: string,
        options?: { filter?: "all" | "public" | "friends" | "official"; search?: string; limit?: number }
    ): Promise<{ agents: Agent[]; total: number }> {
        const params: Record<string, string | number> = { userAddress };
        if (options?.filter) params.filter = options.filter;
        if (options?.search) params.search = options.search;
        if (options?.limit) params.limit = options.limit;
        return this.http.get("/api/agents/discover", params);
    }

    // ── Public Agent Endpoints (no auth required) ──

    /**
     * Get public info for an agent by ID.
     */
    async get(agentId: string): Promise<Agent> {
        return this.http.get<Agent>(`/api/public/agents/${agentId}`);
    }

    /**
     * Get agent info including pricing and endpoints.
     */
    async getInfo(agentId: string): Promise<AgentInfo> {
        return this.http.get<AgentInfo>(`/api/public/agents/${agentId}/chat`);
    }

    /**
     * Send a chat message to a public agent (non-streaming).
     */
    async chat(agentId: string, options: AgentChatOptions): Promise<AgentChatResponse> {
        return this.http.post<AgentChatResponse>(`/api/public/agents/${agentId}/chat`, {
            message: options.message,
            sessionId: options.sessionId,
            stream: false,
        });
    }

    /**
     * Stream a chat response from a public agent via NDJSON.
     * Yields AgentChatStreamEvent objects as they arrive.
     */
    async *chatStream(
        agentId: string,
        options: Omit<AgentChatOptions, "stream">
    ): AsyncGenerator<AgentChatStreamEvent> {
        const response = await this.http.rawPost(`/api/public/agents/${agentId}/chat`, {
            message: options.message,
            sessionId: options.sessionId,
            stream: true,
        });

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    try {
                        yield JSON.parse(trimmed) as AgentChatStreamEvent;
                    } catch {
                        // skip malformed lines
                    }
                }
            }

            if (buffer.trim()) {
                try {
                    yield JSON.parse(buffer.trim()) as AgentChatStreamEvent;
                } catch {
                    // skip
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Get chat history for a session.
     */
    async getHistory(agentId: string, sessionId: string): Promise<AgentHistoryResponse> {
        return this.http.get<AgentHistoryResponse>(`/api/public/agents/${agentId}/history`, {
            sessionId,
        });
    }
}
