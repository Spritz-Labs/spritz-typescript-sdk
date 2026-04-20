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

    async list(): Promise<Agent[]> {
        const res = await this.http.get<{ agents: Agent[] }>("/api/agents");
        return res.agents ?? [];
    }

    async get(agentId: string): Promise<AgentInfo> {
        return this.http.get<AgentInfo>(`/api/agents/${agentId}`);
    }

    async create(data: Partial<Agent>): Promise<Agent> {
        return this.http.post<Agent>("/api/agents", data);
    }

    async update(agentId: string, data: Partial<Agent>): Promise<Agent> {
        return this.http.patch<Agent>(`/api/agents/${agentId}`, data);
    }

    async remove(agentId: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/agents/${agentId}`);
    }

    async chat(agentId: string, opts: AgentChatOptions): Promise<AgentChatResponse> {
        return this.http.post<AgentChatResponse>(`/api/agents/${agentId}/chat`, opts);
    }

    async *chatStream(agentId: string, opts: AgentChatOptions): AsyncGenerator<AgentChatStreamEvent> {
        const response = await this.http.rawPost(`/api/agents/${agentId}/chat`, {
            ...opts,
            stream: true,
        });

        if (!response.body) throw new Error("No stream body returned");

        const reader = response.body.getReader();
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
        } finally {
            reader.releaseLock();
        }
    }

    async getHistory(agentId: string, sessionId?: string): Promise<AgentHistoryResponse> {
        const params: Record<string, string> = {};
        if (sessionId) params.sessionId = sessionId;
        return this.http.get<AgentHistoryResponse>(`/api/agents/${agentId}/history`, params);
    }

    async favorite(agentId: string): Promise<{ success: boolean }> {
        return this.http.post("/api/agents/favorites", { agentId });
    }

    async unfavorite(agentId: string): Promise<{ success: boolean }> {
        return this.http.delete("/api/agents/favorites", { agentId });
    }

    async listFavorites(): Promise<Agent[]> {
        const res = await this.http.get<{ favorites: Agent[] }>("/api/agents/favorites");
        return res.favorites ?? [];
    }
}
