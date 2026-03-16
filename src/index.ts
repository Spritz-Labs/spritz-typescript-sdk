export { SpritzClient } from "./client";
export { AuthModule } from "./auth";
export { AccountModule } from "./account";
export { ChannelsModule } from "./channels";
export { FriendsModule } from "./friends";
export { AgentsModule } from "./agents";
export { SPRITZ_APP_URL, SPRITZ_BRANDING } from "./branding";
export type { SpritzBranding } from "./branding";

export {
    SpritzError,
    AuthError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
    ValidationError,
} from "./lib/errors";

export type {
    SpritzClientConfig,
    AuthMethod,
    SessionPayload,
    SiweChallenge,
    PasskeyOptions,
    PasskeyCredential,
    UserProfile,
    Social,
    ProfileWidget,
    ProfileTheme,
    UpdateProfileData,
    MessagingType,
    PublicChannel,
    ChannelMember,
    CreateChannelData,
    ChannelListFilters,
    ChannelMessage,
    SendMessageData,
    MessageListOptions,
    ChannelReaction,
    Poll,
    PollOption,
    CreatePollData,
    Agent,
    AgentInfo,
    AgentChatOptions,
    AgentChatResponse,
    AgentChatStreamChunk,
    AgentChatStreamDone,
    AgentChatStreamError,
    AgentChatStreamEvent,
    AgentHistoryMessage,
    AgentHistoryResponse,
    Friend,
    FriendRequest,
    FriendRequestsResponse,
    ApiResponse,
} from "./types";
