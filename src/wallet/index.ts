import type { HttpClient } from "../lib/http";

export class WalletModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * Portfolio balances across supported chains (authenticated).
     */
    async balances(address: string, options?: { refresh?: boolean }): Promise<Record<string, unknown>> {
        const params: Record<string, string | boolean> = { address };
        if (options?.refresh) params.refresh = true;
        return this.http.get("/api/wallet/balances", params);
    }

    /**
     * Recent transactions (authenticated). `address` must be a 0x EVM address.
     */
    async transactions(
        address: string,
        options?: { chain?: string }
    ): Promise<{ transactions: Record<string, unknown>[]; count: number; address: string }> {
        const params: Record<string, string> = { address };
        if (options?.chain) params.chain = options.chain;
        return this.http.get("/api/wallet/transactions", params);
    }
}
