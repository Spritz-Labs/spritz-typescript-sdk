import type { HttpClient } from "../lib/http";
import type { InboxMessage, InboxSendOptions, InboxListOptions } from "../types";

export class InboxModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Send a deferred message to any recipient identifier.
     * The recipient can be an SNS name (alice.sol), ENS name (vitalik.eth),
     * Spritz subname (alice.spritz.eth), or a raw wallet address.
     *
     * The recipient does NOT need to be a Spritz user — the message will be
     * waiting for them when they eventually sign in.
     */
    async send(
        to: string,
        content: string,
        options?: InboxSendOptions
    ): Promise<InboxMessage> {
        const res = await this.http.post<{ success: boolean; message: InboxMessage }>(
            "/api/inbox/send",
            {
                to,
                content,
                messageType: options?.messageType,
                metadata: options?.metadata,
                expiresInDays: options?.expiresInDays,
            }
        );
        return res.message;
    }

    /**
     * List inbox messages for the authenticated user.
     * Includes both messages sent to the user's wallet address and messages
     * sent to name identifiers that resolve to the user's wallet.
     */
    async list(options?: InboxListOptions): Promise<{ messages: InboxMessage[]; unclaimed: number }> {
        const params: Record<string, string | number> = {};
        if (options?.status) params.status = options.status;
        if (options?.limit) params.limit = options.limit;
        if (options?.before) params.before = options.before;
        return this.http.get("/api/inbox", params);
    }

    /**
     * Get the count of unclaimed inbox messages (useful for badges/notifications).
     */
    async count(): Promise<{ unclaimed: number }> {
        const res = await this.http.get<{ messages: InboxMessage[]; unclaimed: number }>(
            "/api/inbox",
            { status: "unclaimed", limit: 0 }
        );
        return { unclaimed: res.unclaimed };
    }

    /**
     * Mark specific messages as claimed, or claim all pending messages.
     */
    async claim(messageIds?: string[]): Promise<{ claimed: number }> {
        const body = messageIds ? { messageIds } : { all: true };
        return this.http.post("/api/inbox/claim", body);
    }
}
