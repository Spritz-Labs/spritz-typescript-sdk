import type { SpritzClientConfig } from "./types";
import { HttpClient } from "./lib/http";
import { AuthModule } from "./auth";
import { AccountModule } from "./account";
import { ChannelsModule } from "./channels";
import { FriendsModule } from "./friends";
import { AgentsModule } from "./agents";
import { ResolveModule } from "./resolve";
import { UsersModule } from "./users";
import { DeveloperModule } from "./developer";
import { InboxModule } from "./inbox";

const DEFAULT_BASE_URL = "https://app.spritz.chat";

export class SpritzClient {
    private httpClient: HttpClient;
    private _sessionToken: string | null;

    public readonly auth: AuthModule;
    public readonly account: AccountModule;
    public readonly channels: ChannelsModule;
    public readonly friends: FriendsModule;
    public readonly agents: AgentsModule;
    public readonly resolve: ResolveModule;
    public readonly users: UsersModule;
    public readonly developer: DeveloperModule;
    public readonly inbox: InboxModule;

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
        this.friends = new FriendsModule(this.httpClient);
        this.agents = new AgentsModule(this.httpClient);
        this.resolve = new ResolveModule(this.httpClient);
        this.users = new UsersModule(this.httpClient);
        this.developer = new DeveloperModule(this.httpClient);
        this.inbox = new InboxModule(this.httpClient);
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
