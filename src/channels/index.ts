import type { HttpClient } from "../lib/http";
import type {
    PublicChannel,
    ChannelMember,
    ChannelMessage,
    ChannelReaction,
    ChannelBan,
    CreateChannelData,
    ChannelListFilters,
    SendMessageData,
    MessageListOptions,
    Poll,
    CreatePollData,
    UploadImageResponse,
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
        const body: Record<string, unknown> = {
            name: data.name,
            description: data.description || "",
            emoji: data.emoji || "💬",
            category: data.category || "general",
            messagingType: data.messagingType || "standard",
        };
        if (data.creatorAddress) {
            body.creatorAddress = data.creatorAddress;
        }
        if (data.ownerAddress) {
            body.ownerAddress = data.ownerAddress;
        }
        const raw = await this.http.post<PublicChannel | { channel: PublicChannel }>("/api/channels", body);
        if (raw && typeof raw === "object" && "channel" in raw && raw.channel) {
            return raw.channel as PublicChannel;
        }
        return raw as PublicChannel;
    }

    /**
     * Join a channel by ID.
     * Backend may require userAddress in the body; pass it from session (e.g. (await client.auth.getSession()).userAddress).
     */
    async join(channelId: string, userAddress?: string): Promise<{ success: boolean }> {
        const body = userAddress ? { userAddress } : {};
        return this.http.post(`/api/channels/${channelId}/join`, body);
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

    // ── Pins (admin) ──

    /**
     * Pin or unpin a message in a channel (Spritz admins only).
     */
    async setPinned(
        channelId: string,
        messageId: string,
        pin: boolean
    ): Promise<{ success: boolean }> {
        return this.http.post(`/api/channels/${channelId}/messages/pin`, {
            messageId,
            pin,
        });
    }

    // ── Agents in channel ──

    /**
     * List AI agents attached to a channel (or pass `"global"` for Spritz Global).
     */
    async listAgents(channelIdOrGlobal: string): Promise<{
        agents: Array<{
            id: string;
            name: string;
            avatar_emoji: string;
            avatar_url: string | null;
            personality: string | null;
            isAgent: boolean;
        }>;
    }> {
        return this.http.get(`/api/channels/${channelIdOrGlobal}/agents`);
    }

    // ── Moderation ──

    /**
     * Upload an image for use in channel messages.
     * Returns the URL to embed in a message with messageType "image".
     */
    async uploadImage(
        file: File,
        conversationId?: string
    ): Promise<UploadImageResponse> {
        const formData = new FormData();
        formData.append("file", file);
        if (conversationId) formData.append("conversationId", conversationId);
        formData.append("originalType", file.type);

        const url = "/api/upload/image";
        const headers = {
            "X-API-Key": (this as any).http["apiKey"],
        } as Record<string, string>;
        const token = (this as any).http["getSessionToken"]();
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const fetchImpl = (this as any).http["fetchImpl"] || fetch;
        const baseUrl = (this as any).http["baseUrl"];
        const fullUrl = new URL(url, baseUrl).toString();

        const response = await fetchImpl(fullUrl, {
            method: "POST",
            headers,
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Upload failed (${response.status})`);
        }

        return response.json();
    }

    /**
     * Set a member's role in a channel. Requires admin+ permissions.
     * Valid roles: "admin", "moderator", "member". Cannot assign "owner".
     */
    async setMemberRole(
        channelId: string,
        memberAddress: string,
        role: "admin" | "moderator" | "member"
    ): Promise<{ success: boolean }> {
        return this.http.patch(
            `/api/channels/${channelId}/members/${encodeURIComponent(memberAddress)}/role`,
            { role }
        );
    }

    /**
     * Kick a member from a channel. Requires moderator+ permissions.
     */
    async kickMember(
        channelId: string,
        memberAddress: string
    ): Promise<{ success: boolean }> {
        return this.http.post(
            `/api/channels/${channelId}/members/${encodeURIComponent(memberAddress)}/kick`
        );
    }

    /**
     * Ban a user from a channel. Removes them if currently a member. Requires admin+ permissions.
     */
    async banUser(
        channelId: string,
        userAddress: string,
        reason?: string
    ): Promise<{ success: boolean }> {
        return this.http.post(`/api/channels/${channelId}/ban`, {
            userAddress,
            reason,
        });
    }

    /**
     * Unban a user from a channel. Requires admin+ permissions.
     */
    async unbanUser(
        channelId: string,
        userAddress: string
    ): Promise<{ success: boolean }> {
        return this.http.delete(`/api/channels/${channelId}/ban`, {
            userAddress,
        });
    }

    /**
     * List banned users in a channel. Requires moderator+ permissions.
     */
    async getBans(channelId: string): Promise<{ bans: ChannelBan[] }> {
        return this.http.get(`/api/channels/${channelId}/ban`);
    }

    /**
     * Archive a channel (sets is_active to false). Owner only.
     */
    async archiveChannel(channelId: string): Promise<{ success: boolean }> {
        return this.http.post(`/api/channels/${channelId}/archive`);
    }
}
