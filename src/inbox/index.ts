import type { HttpClient } from "../lib/http";
import type { InboxMessage, InboxSendOptions, InboxListOptions } from "../types";

export class InboxModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async send(
        recipientIdentifier: string,
        content: string,
        opts?: InboxSendOptions,
    ): Promise<InboxMessage> {
        return this.http.post<InboxMessage>("/api/inbox", {
            recipient_identifier: recipientIdentifier,
            content,
            message_type: opts?.messageType ?? "text",
            metadata: opts?.metadata,
            expires_in_days: opts?.expiresInDays,
        });
    }

    async list(opts?: InboxListOptions): Promise<{ messages: InboxMessage[] }> {
        const params: Record<string, string | number> = {};
        if (opts?.status) params.status = opts.status;
        if (opts?.limit) params.limit = opts.limit;
        if (opts?.before) params.before = opts.before;
        return this.http.get("/api/inbox", params);
    }

    async claim(messageId: string): Promise<InboxMessage> {
        return this.http.post<InboxMessage>(`/api/inbox/${messageId}/claim`);
    }
}
