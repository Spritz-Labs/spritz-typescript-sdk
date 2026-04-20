import type { HttpClient } from "../lib/http";

export class WalletModule {
    private http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    async getSmartWallet(): Promise<{ smartWalletAddress: string | null; isDeployed: boolean }> {
        return this.http.get("/api/wallet/smart-wallet");
    }

    async getRecoverySigner(): Promise<{ address: string | null }> {
        return this.http.get("/api/wallet/recovery-signer");
    }
}
