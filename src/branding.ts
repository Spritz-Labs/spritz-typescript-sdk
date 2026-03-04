/**
 * Default Spritz branding for auth and other UI.
 * Use these constants so your app shows consistent Spritz branding (e.g. login screens).
 */
export const SPRITZ_APP_URL = "https://app.spritz.chat" as const;

export const SPRITZ_BRANDING = {
    /** Display name */
    name: "Spritz",
    /** Main app URL (dashboard, sign-in, etc.) */
    appUrl: SPRITZ_APP_URL,
    /** Host label for links (e.g. "app.spritz.chat") */
    appHost: "app.spritz.chat",
    /** Default sign-in heading */
    signInHeading: "Sign in with Spritz",
    /** Default sign-in subtext */
    signInSubtext: "Use your email to continue. Auth is powered by Spritz.",
    /** "Powered by" label (link text is `name`) */
    poweredByLabel: "Powered by",
} as const;

export type SpritzBranding = typeof SPRITZ_BRANDING;
