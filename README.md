# @spritzlabs/sdk

TypeScript SDK for building apps on [Spritz](https://spritz.chat) — censorship-resistant Web3 chat.

## Installation

```bash
npm install @spritzlabs/sdk
```

## Quick Start

```typescript
import { SpritzClient } from "@spritzlabs/sdk";

const spritz = new SpritzClient({
    apiKey: "sk_live_...", // Get your API key in app.spritz.chat under Settings
});

// Login with email
await spritz.auth.sendEmailCode("user@example.com");
await spritz.auth.verifyEmailCode("user@example.com", "123456");

// Browse and join channels
const { channels } = await spritz.channels.list();
await spritz.channels.join(channels[0].id);

// Send a message
await spritz.channels.sendMessage(channels[0].id, {
    content: "Hello from the SDK!",
});
```

## Authentication

The SDK supports four authentication methods: wallet (SIWE), Solana (SIWS), email, and passkey.

### Wallet (SIWE — Ethereum)

```typescript
// 1. Get the SIWE challenge
const { message, nonce } = await spritz.auth.loginWithWallet("0x...");

// 2. Sign the message with the user's wallet (use viem, ethers, etc.)
const signature = await wallet.signMessage(message);

// 3. Verify the signature
await spritz.auth.verifyWallet("0x...", signature, message);
```

### Wallet (SIWS — Solana)

```typescript
// 1. Get the SIWS challenge
const { message, nonce } = await spritz.auth.loginWithSolana("base58Address...");

// 2. Sign the message with the user's Solana wallet
const signatureBytes = nacl.sign.detached(
    new TextEncoder().encode(message),
    keypair.secretKey
);
const signature = bs58.encode(signatureBytes);

// 3. Verify the signature — session is established automatically
await spritz.auth.verifySolana("base58Address...", signature, message);
```

### Email

```typescript
await spritz.auth.sendEmailCode("user@example.com");
await spritz.auth.verifyEmailCode("user@example.com", "123456");
```

### Passkey (WebAuthn)

```typescript
// Get options for the browser's WebAuthn API
const { options } = await spritz.auth.getPasskeyLoginOptions();

// Use navigator.credentials.get() with these options
const credential = await navigator.credentials.get({ publicKey: options });

// Verify with the SDK
await spritz.auth.verifyPasskeyLogin(credential, options.challenge);
```

### Using with Privy (messaging only)

You can use [Privy](https://privy.io) for login and then the SDK only for messaging. After the user authenticates with Privy, use their wallet to complete Spritz's SIWE flow and get a session:

```typescript
import { SpritzClient } from "@spritzlabs/sdk";
import { usePrivy, useSignMessage, useWallets } from "@privy-io/react-auth";

// In your app: user is already logged in via Privy
const { user } = usePrivy();
const { signMessage } = useSignMessage();
const { wallets } = useWallets();
const spritz = new SpritzClient({ apiKey: "sk_live_..." });

const address = user?.wallet?.address ?? wallets[0]?.address;

// 1. Get the SIWE message from Spritz
const { message } = await spritz.auth.loginWithWallet(address);

// 2. Sign with Privy (useSignMessage)
const { signature } = await signMessage({ message }, { address });

// 3. Verify with Spritz — you now have a session and can use channels/messaging
await spritz.auth.verifyWallet(address, signature, message);

// Use the SDK for messaging only
const { channels } = await spritz.channels.list();
await spritz.channels.join(channels[0].id);
await spritz.channels.sendMessage(channels[0].id, { content: "Hello!" });
```

Privy handles auth and the wallet; the SDK only needs the SIWE signature to create a Spritz session, then you use `spritz.channels.*` (and optionally `spritz.account.*`) without touching Privy again.

## Account Management

```typescript
// Get a user's public profile
const profile = await spritz.account.getProfile("0x...");

// Update your profile
await spritz.account.updateProfile({
    username: "alice",
    display_name: "Alice",
});

// Set social links
await spritz.account.setSocials([
    { platform: "twitter", handle: "@alice" },
    { platform: "github", handle: "alice" },
]);

// Manage profile widgets
await spritz.account.addWidget({
    type: "social_link",
    config: { platform: "twitter", handle: "@alice", url: "https://x.com/alice" },
});
```

## Name Resolution

Resolve SNS (.sol) and ENS (spritz.eth) names without needing direct RPC access.

```typescript
// SNS: Resolve a .sol domain to a Solana wallet
const { address } = await spritz.resolve.snsForward("alice.sol");

// SNS: Reverse-resolve a wallet to its primary .sol name
const { name } = await spritz.resolve.snsReverse("base58Address...");

// ENS: Resolve a spritz.eth subname
const result = await spritz.resolve.ensResolve("alice.spritz.eth");

// Convenience: resolve any identifier to a wallet address
const wallet = await spritz.resolve.resolveToAddress("alice.sol");
```

## Public User Lookup

Look up any user's public profile without authentication — useful for rendering user cards, social previews, or verifying identities.

```typescript
// Full profile with socials, agents, and scheduling info
const profile = await spritz.users.getProfile("0x...");
// or by username/ENS:
const profile2 = await spritz.users.getProfile("alice");

// Lightweight lookup (just display info)
const { user } = await spritz.users.lookup("0x...");
console.log(user?.username, user?.avatar_url);
```

## Channels

### Browsing and Joining

```typescript
// List all public channels
const { channels } = await spritz.channels.list();

// Filter by category
const { channels: devChannels } = await spritz.channels.list({
    category: "development",
});

// Get a specific channel
const channel = await spritz.channels.get("channel-id-or-slug");

// Join / leave
await spritz.channels.join(channel.id);
await spritz.channels.leave(channel.id);
```

### Creating Channels

```typescript
// Standard channel (Supabase-backed)
const standardChannel = await spritz.channels.create({
    name: "My Channel",
    description: "A place to chat",
    category: "general",
    messagingType: "standard",
});

// Decentralized channel (Logos/Waku-backed)
const wakuChannel = await spritz.channels.create({
    name: "Decentralized Chat",
    description: "Messages via Logos network",
    messagingType: "waku",
});
```

### Messaging

```typescript
// Get messages (auto-detects standard vs waku based on messagingType param)
const { messages } = await spritz.channels.getMessages(channelId, {
    limit: 50,
    messagingType: "standard",
});

// Send a message
await spritz.channels.sendMessage(channelId, {
    content: "Hello!",
    messagingType: "standard",
});

// Edit / delete
await spritz.channels.editMessage(channelId, messageId, "Updated text");
await spritz.channels.deleteMessage(channelId, messageId);
```

### Polls

```typescript
// Create a poll
const poll = await spritz.channels.createPoll(channelId, {
    question: "Which network?",
    options: ["Ethereum", "Base", "Arbitrum"],
});

// Vote
await spritz.channels.votePoll(channelId, poll.id, poll.options[0].id);
```

## Friends

```typescript
// List your friends
const friends = await spritz.friends.list();

// Get friend requests
const { incoming, outgoing } = await spritz.friends.getRequests("all");

// Send a friend request
await spritz.friends.sendRequest("0x...", "Hi, let's connect!");

// Accept or reject an incoming request
await spritz.friends.acceptRequest(requestId);
await spritz.friends.rejectRequest(requestId);

// Cancel an outgoing request
await spritz.friends.cancelRequest(requestId);

// Remove a friend
await spritz.friends.remove(friendId);
```

## Agents

```typescript
// Discover public agents
const { agents } = await spritz.agents.discover(myAddress, {
    filter: "public",
    search: "weather",
});

// Get agent info and pricing
const info = await spritz.agents.getInfo(agentId);
console.log(info.pricing); // { enabled: true, pricePerMessage: "$0.01", ... }

// Chat with an agent
const response = await spritz.agents.chat(agentId, {
    message: "What's the weather in NYC?",
    sessionId: "my-session",
});

// Stream a response
for await (const event of spritz.agents.chatStream(agentId, { message: "Tell me a story" })) {
    if (event.type === "chunk") process.stdout.write(event.text);
    if (event.type === "done") console.log("\n\nSession:", event.sessionId);
}

// Get chat history
const history = await spritz.agents.getHistory(agentId, sessionId);
```

## Inbox (Deferred Messages)

Send messages to any wallet or name service identifier — even if the recipient hasn't signed up for Spritz yet. Messages are stored and delivered when the recipient eventually logs in.

This is ideal for use cases like SNS-to-SNS messaging, community onboarding, or cross-chain social outreach.

```typescript
// Send a message to an SNS name (recipient doesn't need to be on Spritz)
const msg = await spritz.inbox.send("alice.sol", "Hey Alice! Saw your project on Solana.");

// Send with metadata and custom expiry
await spritz.inbox.send("vitalik.eth", "Check out this NFT", {
    messageType: "link",
    metadata: { url: "https://example.com/nft/123", title: "Cool NFT" },
    expiresInDays: 30,
});

// Check for pending messages (as recipient)
const { unclaimed } = await spritz.inbox.count();
console.log(`You have ${unclaimed} new messages`);

// List inbox messages
const { messages } = await spritz.inbox.list({ status: "unclaimed" });

// Claim (acknowledge) messages
await spritz.inbox.claim(messages.map(m => m.id));

// Or claim all at once
await spritz.inbox.claim();
```

## Developer Keys

Manage API keys programmatically.

```typescript
// List your API keys
const keys = await spritz.developer.listKeys();

// Create a new key (full key is only shown once!)
const { key, warning } = await spritz.developer.createKey("My App", ["read", "write"]);
console.log(key.api_key); // sk_live_... — save this!

// Revoke a key
await spritz.developer.revokeKey(keyId);
```

## Error Handling

The SDK throws typed errors for different failure scenarios:

```typescript
import {
    SpritzError,
    AuthError,
    NotFoundError,
    RateLimitError,
} from "@spritzlabs/sdk";

try {
    await spritz.channels.get("nonexistent");
} catch (error) {
    if (error instanceof NotFoundError) {
        console.log("Channel not found");
    } else if (error instanceof AuthError) {
        console.log("Not authenticated");
    } else if (error instanceof RateLimitError) {
        console.log("Rate limited, try again later");
    }
}
```

## Session Management

```typescript
// Check authentication status
console.log(spritz.isAuthenticated); // true/false

// Access the raw session token
const token = spritz.sessionToken;

// Set a token from a previous session
spritz.sessionToken = savedToken;

// Restore session from token
const session = await spritz.auth.getSession();
```

## Configuration

You need an API key to use the SDK. Get one by signing in at [app.spritz.chat](https://app.spritz.chat) and going to **Settings** to create or copy your API key.

```typescript
const spritz = new SpritzClient({
    apiKey: "sk_live_...",               // Required: get it in app.spritz.chat under Settings
    baseUrl: "https://app.spritz.chat",  // Optional: defaults to production
    sessionToken: "saved-jwt-token",     // Optional: restore a previous session
});
```

## Modules

| Module | Access | Description |
|--------|--------|-------------|
| `spritz.auth` | — | SIWE, SIWS, email, passkey authentication |
| `spritz.account` | Authenticated | Profile, widgets, socials, themes |
| `spritz.channels` | Authenticated | Channel CRUD, messaging, polls, reactions |
| `spritz.friends` | Authenticated | Friend list, requests, accept/reject |
| `spritz.agents` | Public | Discover, chat, stream, history |
| `spritz.resolve` | Public | SNS (.sol) and ENS (.spritz.eth) resolution |
| `spritz.users` | Public | Public profile and user lookups |
| `spritz.inbox` | Authenticated | Deferred messages to any name/address |
| `spritz.developer` | Authenticated | API key management |

## Branding

Use the built-in constants for consistent Spritz branding in your auth UI (e.g. login screens):

```typescript
import { SPRITZ_APP_URL, SPRITZ_BRANDING } from "@spritzlabs/sdk";

// Single URL constant
console.log(SPRITZ_APP_URL); // "https://app.spritz.chat"

// Default copy and links for auth screens
console.log(SPRITZ_BRANDING.name);           // "Spritz"
console.log(SPRITZ_BRANDING.appUrl);         // "https://app.spritz.chat"
console.log(SPRITZ_BRANDING.appHost);        // "app.spritz.chat"
console.log(SPRITZ_BRANDING.signInHeading);  // "Sign in with Spritz"
console.log(SPRITZ_BRANDING.signInSubtext);  // "Use your email to continue..."
console.log(SPRITZ_BRANDING.poweredByLabel);  // "Powered by"
```

Use these in your login form so users see consistent Spritz branding and links to [app.spritz.chat](https://app.spritz.chat).

## Requirements

- Node.js 18+ (uses native `fetch`)
- Works in browsers, Deno, and Bun

## License

MIT
