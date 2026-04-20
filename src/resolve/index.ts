import type { HttpClient } from "../lib/http";
import type { SnsForwardResult, SnsReverseResult, EnsResolveResult } from "../types";

export class ResolveModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async ensLookup(name: string): Promise<EnsResolveResult> {
        return this.http.get<EnsResolveResult>("/api/ens/resolve", { name });
    }

    async snsForward(name: string): Promise<SnsForwardResult> {
        return this.http.get<SnsForwardResult>("/api/sns/forward", { name });
    }

    async snsReverse(address: string): Promise<SnsReverseResult> {
        return this.http.get<SnsReverseResult>("/api/sns/reverse", { address });
    }
}
