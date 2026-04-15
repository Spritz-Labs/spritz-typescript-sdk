import type { HttpClient } from "../lib/http";
import type { SnsForwardResult, SnsReverseResult, EnsResolveResult } from "../types";

export class ResolveModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    // ── SNS (Solana Name Service) ──

    /**
     * Forward-resolve a .sol domain to its owner wallet address.
     * @param name - e.g. "alice.sol"
     */
    async snsForward(name: string): Promise<SnsForwardResult> {
        return this.http.get<SnsForwardResult>("/api/sns/resolve", { name });
    }

    /**
     * Reverse-resolve a Solana wallet to its primary .sol name.
     * @param wallet - Base58 Solana address
     * @returns Result with name (null if no primary .sol set)
     */
    async snsReverse(wallet: string): Promise<SnsReverseResult> {
        return this.http.get<SnsReverseResult>("/api/sns/resolve", { wallet });
    }

    // ── ENS (Spritz subnames) ──

    /**
     * Resolve a spritz.eth subname to its on-chain data.
     * @param name - e.g. "alice.spritz.eth"
     */
    async ensResolve(name: string): Promise<EnsResolveResult> {
        return this.http.get<EnsResolveResult>("/api/ens/resolve", { name });
    }

    // ── Convenience ──

    /**
     * Resolve any name identifier (.sol, .spritz.eth, or raw address) to a wallet address.
     * Returns the resolved address or null if not found.
     */
    async resolveToAddress(identifier: string): Promise<string | null> {
        const trimmed = identifier.trim().toLowerCase();

        if (trimmed.endsWith(".sol")) {
            try {
                const result = await this.snsForward(trimmed);
                return result.address;
            } catch {
                return null;
            }
        }

        if (trimmed.endsWith(".spritz.eth")) {
            try {
                const result = await this.ensResolve(trimmed);
                return result.resolveAddress ?? null;
            } catch {
                return null;
            }
        }

        // Already an address
        return identifier;
    }
}
