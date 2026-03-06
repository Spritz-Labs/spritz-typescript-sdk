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

The SDK supports three authentication methods: wallet (SIWE), email, and passkey.

### Wallet (SIWE)

```typescript
// 1. Get the SIWE challenge
const { message, nonce } = await spritz.auth.loginWithWallet("0x...");

// 2. Sign the message with the user's wallet (use viem, ethers, etc.)
const signature = await wallet.signMessage(message);

// 3. Verify the signature
await spritz.auth.verifyWallet("0x...", signature, message);
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
