# Spritz Vite + React Example

Standalone example app using the [Spritz SDK](https://github.com/Spritz-Labs/spritz-typescript-sdk) for **email auth** and **chat** (channels + messages). Built with Vite and React.

This example lives in the SDK repo under `examples/vite-react-app` and is separate from the SDK package itself.

## Setup

1. **Build the SDK** (from repo root, two levels up):

   ```bash
   cd ../.. && npm install && npm run build
   ```

2. **Install example dependencies**:

   ```bash
   npm install
   ```

3. **Configure API key**. Get an API key by signing in at [app.spritz.chat](https://app.spritz.chat) and going to **Settings**. Copy `.env.example` to `.env` and set your key:

   ```bash
   cp .env.example .env
   # Edit .env and set VITE_SPRITZ_API_KEY=sk_live_...
   ```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to **Login**; after signing in with email (send code → enter code), you’ll see the **Chat** view with channel list and messages.

## Features

- **Auth**: Email send-code → verify code; session stored in `localStorage`. Uses SDK branding constants for Spritz UI.
- **Chat**: List public channels, join, view messages (polling every 5s), send messages.
