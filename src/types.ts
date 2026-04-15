// ── Client Configuration ──

/** Optional persistence for the Bearer session token (e.g. browser localStorage or a server-side store). */
export interface SessionStorageAdapter {
    get: () => string | null;
    set: (token: string | null) => void;
}

export interface SpritzHttpOptions {
    /** Retries for 429/503 (default 2) */
    maxRetries?: number;
    retryBaseDelayMs?: number;
    retryOnStatuses?: number[];
    onRequest?: (info: {
        url: string;
        method: string;
        headers: Record<string, string>;
    }) => void;
    onResponse?: (info: { url: string; response: Response }) => void;
    fetchImpl?: typeof fetch;
}

export interface SpritzClientConfig {
    apiKey: string;
    baseUrl?: string;
    /** Initial session; overridden by sessionStorage.get() when sessionStorage is set */
    sessionToken?: string;
    sessionStorage?: SessionStorageAdapter;
    http?: SpritzHttpOptions;
}

// ── Auth ──

export type AuthMethod = "wallet" | "email" | "passkey" | "world_id" | "alien_id" | "solana";

export interface SessionPayload {
    userAddress: string;
    userId?: string;
    authMethod: AuthMethod;
    authenticated: boolean;
}

export interface SiweChallenge {
    message: string;
    nonce: string;
}

/** SIWS (Sign-In with Solana) challenge — same shape as SiweChallenge. */
export type SiwsChallenge = SiweChallenge;

/** Generic challenge type covering both EVM and Solana sign-in flows. */
export type SignInChallenge = SiweChallenge;

export interface PasskeyOptions {
    challenge: string;
    rpId: string;
    rpName: string;
    allowCredentials?: Array<{ id: string; type: string }>;
    [key: string]: unknown;
}

export interface PasskeyCredential {
    id: string;
    rawId: string;
    type: string;
    response: {
        clientDataJSON: string;
        authenticatorData?: string;
        signature?: string;
        attestationObject?: string;
    };
}

// ── Account / Profile ──

export interface UserProfile {
    wallet_address: string;
    username?: string;
    ens_name?: string;
    display_name?: string;
    avatar_url?: string;
    email?: string;
    email_verified?: boolean;
    bio?: string;
    socials?: Social[];
    widgets?: ProfileWidget[];
}

export interface Social {
    platform: string;
    handle: string;
    url?: string;
}

export interface ProfileWidget {
    id?: string;
    type: string;
    position?: number;
    is_visible?: boolean;
    config?: Record<string, unknown>;
}

export interface ProfileTheme {
    theme_id?: string;
    colors?: Record<string, string>;
    [key: string]: unknown;
}

export interface UpdateProfileData {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
}

// ── Channels ──

export type MessagingType = "standard" | "waku";

export interface PublicChannel {
    id: string;
    name: string;
    description: string | null;
    emoji: string;
    icon_url: string | null;
    slug?: string;
    category: string;
    creator_address: string | null;
    is_official: boolean;
    member_count: number;
    message_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    access_level?: "public" | "staff";
    is_member?: boolean;
    messaging_type: MessagingType;
    waku_symmetric_key?: string | null;
    waku_content_topic?: string | null;
    poap_event_id?: number | null;
    poap_event_name?: string | null;
    poap_image_url?: string | null;
}

export interface ChannelMember {
    user_address: string;
    joined_at: string;
    username?: string;
    avatar?: string;
    ens_name?: string;
}

export interface CreateChannelData {
    name: string;
    description?: string;
    emoji?: string;
    category?: string;
    messagingType?: MessagingType;
    /** Optional. Backend uses session when present; pass when session may not be available (e.g. Bearer token) or to ensure creator is set. */
    creatorAddress?: string;
}

export interface ChannelListFilters {
    category?: string;
    joined?: boolean;
    userAddress?: string;
}

// ── Messages ──

export interface ChannelMessage {
    id: string;
    channel_id: string;
    sender_address: string;
    content: string;
    message_type: string;
    created_at: string;
    reply_to_id?: string | null;
    reply_to?: ChannelMessage | null;
    is_pinned?: boolean;
    pinned_by?: string | null;
    pinned_at?: string | null;
    is_edited?: boolean;
    edited_at?: string | null;
    is_deleted?: boolean;
}

export interface SendMessageData {
    content: string;
    messageType?: string;
    replyToId?: string;
}

export interface MessageListOptions {
    limit?: number;
    before?: string;
    after?: string;
    since?: string;
}

// ── Reactions ──

export interface ChannelReaction {
    id: string;
    message_id: string;
    channel_id: string;
    user_address: string;
    emoji: string;
    created_at: string;
}

// ── Polls ──

export interface Poll {
    id: string;
    channel_id: string;
    question: string;
    options: PollOption[];
    creator_address: string;
    is_active: boolean;
    created_at: string;
    ends_at?: string;
}

export interface PollOption {
    id: string;
    text: string;
    vote_count: number;
}

export interface CreatePollData {
    question: string;
    options: string[];
    endsAt?: string;
}

// ── Agents ──

export interface Agent {
    id: string;
    name: string;
    personality: string | null;
    avatar_emoji: string;
    avatar_url: string | null;
    visibility: string;
    x402_enabled: boolean;
    x402_price_cents: number;
    x402_network: string;
    owner_address: string;
    tags: string[] | null;
    suggested_questions?: string[] | null;
    has_events?: boolean;
    events_count?: number;
}

export interface AgentInfo {
    agent: {
        id: string;
        name: string;
        personality: string | null;
        emoji: string;
        tags: string[] | null;
        features: {
            webSearch: boolean;
            knowledgeBase: boolean;
        };
        stats: {
            totalMessages: number;
        };
        createdAt: string;
    };
    pricing: {
        enabled: boolean;
        pricePerMessage?: string;
        priceCents?: number;
        network?: string;
        currency?: string;
    };
    endpoints: {
        chat: string;
        info: string;
    };
}

export interface AgentChatOptions {
    message: string;
    sessionId?: string;
    stream?: boolean;
}

export interface AgentChatResponse {
    success: boolean;
    sessionId: string;
    message: string;
    scheduling?: unknown;
    agent?: {
        id: string;
        name: string;
        emoji: string;
    };
}

export interface AgentChatStreamChunk {
    type: "chunk";
    text: string;
}

export interface AgentChatStreamDone {
    type: "done";
    sessionId: string;
    message: string;
    scheduling?: unknown;
}

export interface AgentChatStreamError {
    type: "error";
    error: string;
}

export type AgentChatStreamEvent =
    | AgentChatStreamChunk
    | AgentChatStreamDone
    | AgentChatStreamError;

export interface AgentHistoryMessage {
    role: "user" | "assistant";
    content: string;
}

export interface AgentHistoryResponse {
    messages: AgentHistoryMessage[];
    sessionId: string;
}

// ── Friends ──

export interface Friend {
    id: string;
    user_address: string;
    friend_address: string;
    nickname: string | null;
    created_at: string;
}

export interface FriendRequest {
    id: string;
    from_address: string;
    to_address: string;
    status: "pending" | "accepted" | "rejected";
    created_at: string;
    memo?: string | null;
}

export interface FriendRequestsResponse {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
}

// ── Name Resolution ──

export interface SnsForwardResult {
    kind: "forward";
    name: string;
    address: string;
}

export interface SnsReverseResult {
    kind: "reverse";
    address: string;
    name: string | null;
}

export interface EnsResolveResult {
    found: boolean;
    name: string;
    username?: string;
    claimed?: boolean;
    eligible?: boolean;
    reason?: string;
    resolveAddress?: string | null;
    walletType?: string;
    displayName?: string;
    avatarUrl?: string;
    enabled?: boolean;
}

// ── Public Users ──

export interface PublicUserProfile {
    user: {
        address: string;
        displayName?: string;
        username?: string;
        ensName?: string;
        avatarUrl?: string;
        bio?: string;
        chain?: string;
    } | null;
    socials?: Array<{ platform: string; handle: string; url?: string }>;
    agents?: Array<{ id: string; name: string; personality: string | null; avatar_emoji: string; avatar_url: string | null; visibility: string }>;
    scheduling?: Record<string, unknown> | null;
}

export interface PublicUserLookup {
    user: {
        username?: string;
        display_name?: string;
        ens_name?: string;
        avatar_url?: string;
    } | null;
}

// ── Developer Keys ──

export interface DeveloperKey {
    id: string;
    name: string | null;
    api_key_preview: string;
    scopes: string[];
    status: string;
    created_at: string;
    approved_at?: string | null;
    revoked_at?: string | null;
}

export interface CreateKeyResponse {
    key: DeveloperKey & { api_key: string };
    warning?: string;
}

// ── Inbox (Deferred Messages) ──

export interface InboxSendOptions {
    messageType?: string;
    metadata?: Record<string, unknown>;
    expiresInDays?: number;
}

export interface InboxMessage {
    id: string;
    sender_address: string;
    sender_display_name?: string;
    recipient_identifier: string;
    recipient_address?: string | null;
    content: string;
    message_type: string;
    metadata?: Record<string, unknown> | null;
    claimed: boolean;
    claimed_at?: string | null;
    created_at: string;
    expires_at?: string | null;
}

export interface InboxListOptions {
    status?: "unclaimed" | "claimed" | "all";
    limit?: number;
    before?: string;
}

// ── Search ──

export interface SearchResult {
    type: "channel_message" | "dm" | "group";
    id: string;
    content: string;
    sender_address: string;
    sender_name?: string;
    created_at: string;
    channel_id?: string;
    channel_name?: string;
    channel_emoji?: string;
    peer_address?: string;
    peer_name?: string;
    group_id?: string;
    group_name?: string;
    highlight?: string;
}

// ── Webhooks (future / integration contracts) ──

export type SpritzWebhookEvent =
    | {
          type: "inbox.message_received";
          id: string;
          recipientAddress: string;
          senderAddress: string;
          createdAt: string;
      }
    | {
          type: "channel.message_created";
          channelId: string;
          messageId: string;
          senderAddress: string;
          createdAt: string;
      }
    | {
          type: "friend.request_received";
          requestId: string;
          fromAddress: string;
          toAddress: string;
          createdAt: string;
      };

// ── API Responses ──

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    [key: string]: unknown;
}
