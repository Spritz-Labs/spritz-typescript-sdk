import React, { createContext, useContext, useMemo, useRef } from "react";
import { SpritzClient } from "../client";
import type { SpritzClientConfig } from "../types";

const SpritzContext = createContext<SpritzClient | null>(null);

export interface SpritzProviderProps extends SpritzClientConfig {
    children: React.ReactNode;
}

/**
 * React context provider for the Spritz SDK.
 * Wraps your app in `<SpritzProvider apiKey="...">` to use `useSpritzClient()`.
 */
export function SpritzProvider({ children, ...config }: SpritzProviderProps) {
    const configRef = useRef(config);
    const client = useMemo(() => new SpritzClient(configRef.current), []);

    return (
        <SpritzContext.Provider value={client}>
            {children}
        </SpritzContext.Provider>
    );
}

/**
 * Access the SpritzClient instance from React context.
 * Must be used inside a `<SpritzProvider>`.
 */
export function useSpritzClient(): SpritzClient {
    const client = useContext(SpritzContext);
    if (!client) {
        throw new Error(
            "useSpritzClient must be used within a <SpritzProvider>. " +
            "Wrap your app with <SpritzProvider apiKey=\"...\">.",
        );
    }
    return client;
}

export { SpritzContext };
