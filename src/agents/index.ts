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

    /**
     * Get public agent details (name, personality, avatar, tags, suggested questions, etc.).
     */
    async get(agentId: string): Promise<Agent> {
        return this.http.get<Agent>(`/api/public/agents/${agentId}`);
    }

    /**
     * Get agent info including pricing and feature flags.
     */
    async getInfo(agentId: string): Promise<AgentInfo> {
        return this.http.get<AgentInfo>(`/api/public/agents/${agentId}/chat`);
    }

    /**
     * Send a message to an agent and get a complete response (non-streaming).
     *
     * @example
     * ```ts
     * const reply = await client.agents.chat("agent-id", {
     *   message: "Hello!",
     * });
     * console.log(reply.message);
     * // Continue the conversation using the returned sessionId
     * const followUp = await client.agents.chat("agent-id", {
     *   message: "Tell me more",
     *   sessionId: reply.sessionId,
     * });
     * ```
     */
    async chat(agentId: string, options: Omit<AgentChatOptions, "stream">): Promise<AgentChatResponse> {
        return this.http.post<AgentChatResponse>(`/api/public/agents/${agentId}/chat`, {
            message: options.message,
            sessionId: options.sessionId,
            stream: false,
        });
    }

    /**
     * Send a message to an agent and receive a streaming response.
     * Returns an async iterable of NDJSON events.
     *
     * Event types:
     *  - `{ type: "chunk", text: "..." }` — incremental text
     *  - `{ type: "done", sessionId, message }` — final complete message
     *  - `{ type: "error", error: "..." }` — an error occurred
     *
     * @example
     * ```ts
     * for await (const event of client.agents.chatStream("agent-id", { message: "Hello!" })) {
     *   if (event.type === "chunk") process.stdout.write(event.text);
     *   if (event.type === "done") console.log("\nSession:", event.sessionId);
     *   if (event.type === "error") console.error(event.error);
     * }
     * ```
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

        const body = response.body;
        if (!body) {
            throw new Error("No response body for streaming chat");
        }

        const reader = body.getReader();
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
                        // Skip malformed lines
                    }
                }
            }

            if (buffer.trim()) {
                try {
                    yield JSON.parse(buffer.trim()) as AgentChatStreamEvent;
                } catch {
                    // Skip malformed trailing data
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Get chat history for a specific session.
     */
    async getHistory(agentId: string, sessionId: string): Promise<AgentHistoryResponse> {
        return this.http.get<AgentHistoryResponse>(
            `/api/public/agents/${agentId}/history`,
            { sessionId }
        );
    }
}
