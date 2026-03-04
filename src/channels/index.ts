import type { HttpClient } from "../lib/http";
import type {
    PublicChannel,
    ChannelMember,
    ChannelMessage,
    ChannelReaction,
    CreateChannelData,
    ChannelListFilters,
    SendMessageData,
    MessageListOptions,
    Poll,
    CreatePollData,
} from "../types";

export class ChannelsModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    // ── Channel CRUD ──

    /**
     * List public channels with optional filters.
     */
    async list(filters?: ChannelListFilters): Promise<{ channels: PublicChannel[] }> {
        const params: Record<string, string | boolean> = {};
        if (filters?.category) params.category = filters.category;
        if (filters?.joined !== undefined) params.joined = filters.joined;
        if (filters?.userAddress) params.userAddress = filters.userAddress;
        return this.http.get("/api/channels", params);
    }

    /**
     * Get a channel by ID or slug.
     */
    async get(idOrSlug: string): Promise<PublicChannel> {
        return this.http.get<PublicChannel>(`/api/channels/${idOrSlug}`);
    }

    /**
     * Create a new channel. Supports both standard (Supabase) and waku (Logos) messaging.
     */
    async create(data: CreateChannelData): Promise<PublicChannel> {
        return this.http.post<PublicChannel>("/api/channels", {
            name: data.name,
            description: data.description || "",
            emoji: data.emoji || "💬",
            category: data.category || "general",
            messagingType: data.messagingType || "standard",
        });
    }

    /**
     * Join a channel by ID.
     */
    async join(channelId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/channels/${channelId}/join`, {});
    }

    /**
     * Leave a channel by ID.
     */
    async leave(channelId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/channels/${channelId}/leave`);
    }

    /**
     * Get channel members.
     */
    async getMembers(channelId: string): Promise<{ members: ChannelMember[] }> {
        return this.http.get(`/api/channels/${channelId}/members`);
    }

    // ── Messages ──

    /**
     * Get messages for a channel. Automatically uses the correct endpoint
     * based on channel messaging type (standard vs waku).
     */
    async getMessages(
        channelId: string,
        options?: MessageListOptions & { messagingType?: "standard" | "waku" }
    ): Promise<{ messages: ChannelMessage[] }> {
        const params: Record<string, string | number> = {};
        if (options?.limit) params.limit = options.limit;
        if (options?.before) params.before = options.before;
        if (options?.after) params.after = options.after;
        if (options?.since) params.since = options.since;

        const endpoint =
            options?.messagingType === "waku"
                ? `/api/channels/${channelId}/waku-messages`
                : `/api/channels/${channelId}/messages`;

        return this.http.get(endpoint, params);
    }

    /**
     * Send a message to a channel. Automatically uses the correct endpoint
     * based on channel messaging type.
     */
    async sendMessage(
        channelId: string,
        data: SendMessageData & { messagingType?: "standard" | "waku"; senderAddress?: string }
    ): Promise<ChannelMessage> {
        const endpoint =
            data.messagingType === "waku"
                ? `/api/channels/${channelId}/waku-messages`
                : `/api/channels/${channelId}/messages`;

        return this.http.post<ChannelMessage>(endpoint, {
            content: data.content,
            message_type: data.messageType || "text",
            reply_to_id: data.replyToId,
            senderAddress: data.senderAddress,
        });
    }

    /**
     * Edit a message in a standard channel.
     */
    async editMessage(
        channelId: string,
        messageId: string,
        content: string
    ): Promise<ChannelMessage> {
        return this.http.patch<ChannelMessage>(
            `/api/channels/${channelId}/messages/${messageId}`,
            { content }
        );
    }

    /**
     * Delete a message from a standard channel.
     */
    async deleteMessage(channelId: string, messageId: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/channels/${channelId}/messages/${messageId}`);
    }

    // ── Reactions ──

    /**
     * Get reactions for messages in a channel.
     */
    async getReactions(
        channelId: string,
        messageId?: string
    ): Promise<{ reactions: ChannelReaction[] }> {
        const params: Record<string, string> = {};
        if (messageId) params.message_id = messageId;
        return this.http.get(`/api/channels/${channelId}/reactions`, params);
    }

    // ── Polls ──

    /**
     * Get polls in a channel.
     */
    async getPolls(channelId: string): Promise<{ polls: Poll[] }> {
        return this.http.get(`/api/channels/${channelId}/polls`);
    }

    /**
     * Create a poll in a channel.
     */
    async createPoll(channelId: string, data: CreatePollData): Promise<Poll> {
        return this.http.post<Poll>(`/api/channels/${channelId}/polls`, {
            question: data.question,
            options: data.options,
            ends_at: data.endsAt,
        });
    }

    /**
     * Vote on a poll option.
     */
    async votePoll(
        channelId: string,
        pollId: string,
        optionId: string
    ): Promise<{ success: boolean }> {
        return this.http.post(`/api/channels/${channelId}/polls/${pollId}/vote`, {
            option_id: optionId,
        });
    }

    // ── Icons ──

    /**
     * Upload a channel icon (base64-encoded image data).
     */
    async uploadIcon(
        channelId: string,
        imageData: string,
        mimeType: string = "image/png"
    ): Promise<{ icon_url: string }> {
        return this.http.post(`/api/channels/${channelId}/icon`, {
            image: imageData,
            mimeType,
        });
    }

    /**
     * Remove a channel's icon.
     */
    async removeIcon(channelId: string): Promise<{ success: boolean }> {
        return this.http.delete(`/api/channels/${channelId}/icon`);
    }
}
