"use client";

import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { SpritzClient } from "../client";
import type { SessionStorageAdapter, SpritzHttpOptions } from "../types";

const SpritzReactContext = createContext<SpritzClient | null>(null);

export type SpritzProviderProps = {
    apiKey: string;
    baseUrl?: string;
    sessionToken?: string | null;
    sessionStorage?: SessionStorageAdapter;
    http?: SpritzHttpOptions;
    children: ReactNode;
};

/**
 * React context provider for a single `SpritzClient` instance.
 * Pass `sessionToken` from React state (e.g. after email or wallet login).
 */
export function SpritzProvider({
    apiKey,
    baseUrl,
    sessionToken,
    sessionStorage,
    http,
    children,
}: SpritzProviderProps): React.ReactElement {
    const client = useMemo(
        () =>
            new SpritzClient({
                apiKey,
                baseUrl,
                sessionToken: sessionToken ?? undefined,
                sessionStorage,
                http,
            }),
        [apiKey, baseUrl, sessionToken, sessionStorage, http]
    );

    return <SpritzReactContext.Provider value={client}>{children}</SpritzReactContext.Provider>;
}

export function useSpritzClient(): SpritzClient {
    const c = useContext(SpritzReactContext);
    if (!c) {
        throw new Error("useSpritzClient must be used within <SpritzProvider>");
    }
    return c;
}

/** Safe variant: returns null outside of a provider */
export function useOptionalSpritzClient(): SpritzClient | null {
    return useContext(SpritzReactContext);
}
