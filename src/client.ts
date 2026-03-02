import type { SpritzClientConfig } from "./types";
import { HttpClient } from "./lib/http";
import { AuthModule } from "./auth";
import { AccountModule } from "./account";
import { ChannelsModule } from "./channels";

const DEFAULT_BASE_URL = "https://app.spritz.chat";

export class SpritzClient {
    private httpClient: HttpClient;
    private _sessionToken: string | null;

    public readonly auth: AuthModule;
    public readonly account: AccountModule;
    public readonly channels: ChannelsModule;

    constructor(config: SpritzClientConfig) {
        if (!config.apiKey) {
            throw new Error("SpritzClient requires an apiKey. Get one at app.spritz.chat/developer");
        }

        this._sessionToken = config.sessionToken ?? null;

        this.httpClient = new HttpClient({
            baseUrl: config.baseUrl || DEFAULT_BASE_URL,
            apiKey: config.apiKey,
            getSessionToken: () => this._sessionToken,
        });

        this.auth = new AuthModule(this.httpClient, (token) => {
            this._sessionToken = token;
        });
        this.account = new AccountModule(this.httpClient);
        this.channels = new ChannelsModule(this.httpClient);
    }

    get sessionToken(): string | null {
        return this._sessionToken;
    }

    set sessionToken(token: string | null) {
        this._sessionToken = token;
    }

    get isAuthenticated(): boolean {
        return this._sessionToken !== null;
    }
}
