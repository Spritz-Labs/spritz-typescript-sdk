import type { HttpClient } from "../lib/http";
import type { SnsForwardResult, SnsReverseResult, EnsResolveResult } from "../types";

export interface EnsSubnameEligibility {
    /** Whether ENS subnames are enabled on this Spritz instance. */
    enabled: boolean;
    /** Whether the authenticated user is eligible to claim. */
    eligible: boolean;
    /** Human-readable reason when not eligible. */
    reason?: string;
    /** Whether the user has already claimed a subname. */
    claimed: boolean;
    /** The parent ENS name (e.g. "spritz.eth"). */
    parentName: string;
    /** The user's claimed subname, if already claimed (e.g. "alice.spritz.eth"). */
    subname: string | null;
    /** The subname the user would get if they claimed now. */
    suggestedSubname: string | null;
    /** The address the subname resolves to. */
    resolveAddress: string | null;
    /** The user's current username (used as the subname label). */
    username: string | null;
    walletType: string | null;
}

export interface EnsSubnameClaimed {
    success: boolean;
    /** The full claimed subname, e.g. "alice.spritz.eth". */
    subname: string;
    /** The address the subname resolves to. */
    resolveAddress: string | null;
}

export class ResolveModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /** Resolve an ENS name to an address and metadata. */
    async ensLookup(name: string): Promise<EnsResolveResult> {
        return this.http.get<EnsResolveResult>("/api/ens/resolve", { name });
    }

    // ── ENS Subnames (username.spritz.eth) ──

    /**
     * Check whether the authenticated user is eligible to claim a
     * `username.spritz.eth` subname and whether they have already claimed one.
     * Requires authentication.
     */
    async checkEnsEligibility(): Promise<EnsSubnameEligibility> {
        return this.http.get<EnsSubnameEligibility>("/api/ens/claim");
    }

    /**
     * Claim a `username.spritz.eth` subname for the authenticated user.
     * The user must have a valid username set first (`UsernameModule.claim`).
     * Returns 409 if already claimed, 400 if username is not set/valid,
     * 403 if the user is not eligible, 503 if the feature is disabled.
     * Requires authentication.
     */
    async claimEnsSubname(): Promise<EnsSubnameClaimed> {
        return this.http.post<EnsSubnameClaimed>("/api/ens/claim");
    }

    // ── SNS (Solana Name Service) ──

    async snsForward(name: string): Promise<SnsForwardResult> {
        return this.http.get<SnsForwardResult>("/api/sns/forward", { name });
    }

    async snsReverse(address: string): Promise<SnsReverseResult> {
        return this.http.get<SnsReverseResult>("/api/sns/reverse", { address });
    }
}
