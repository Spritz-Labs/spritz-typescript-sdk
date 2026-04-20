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
import { SearchModule } from "./search";
import { EventsModule } from "./events";
import { TokenChatsModule } from "./tokenChats";
import { StreamsModule } from "./streams";
import { UsernameModule } from "./username";
import { WalletModule } from "./wallet";
import { LeaderboardModule } from "./leaderboard";
import { PointsModule } from "./points";
import { SchedulingModule } from "./scheduling";

const DEFAULT_BASE_URL = "https://app.spritz.chat";

export class SpritzClient {
    private httpClient: HttpClient;
    private _sessionToken: string | null;
    private sessionStorageAdapter?: SpritzClientConfig["sessionStorage"];

    public readonly auth: AuthModule;
    public readonly account: AccountModule;
    public readonly channels: ChannelsModule;
    public readonly friends: FriendsModule;
    public readonly agents: AgentsModule;
    public readonly resolve: ResolveModule;
    public readonly users: UsersModule;
    public readonly developer: DeveloperModule;
    public readonly inbox: InboxModule;
    public readonly search: SearchModule;
    public readonly events: EventsModule;
    public readonly tokenChats: TokenChatsModule;
    public readonly streams: StreamsModule;
    public readonly username: UsernameModule;
    public readonly wallet: WalletModule;
    public readonly leaderboard: LeaderboardModule;
    public readonly points: PointsModule;
    public readonly scheduling: SchedulingModule;

    constructor(config: SpritzClientConfig) {
        if (!config.apiKey) {
            throw new Error("SpritzClient requires an apiKey. Get one at app.spritz.chat/developer");
        }

        this.sessionStorageAdapter = config.sessionStorage;
        const stored = config.sessionStorage?.get() ?? null;
        this._sessionToken = config.sessionToken ?? stored ?? null;

        this.httpClient = new HttpClient({
            baseUrl: config.baseUrl || DEFAULT_BASE_URL,
            apiKey: config.apiKey,
            getSessionToken: () => this._sessionToken,
            maxRetries: config.http?.maxRetries,
            retryBaseDelayMs: config.http?.retryBaseDelayMs,
            retryOnStatuses: config.http?.retryOnStatuses,
            onRequest: config.http?.onRequest,
            onResponse: config.http?.onResponse,
            fetchImpl: config.http?.fetchImpl,
        });

        this.auth = new AuthModule(this.httpClient, (token) => {
            this.applySessionToken(token);
        });

        this.httpClient.setOnUnauthorized(async () => this.auth.extendSession());

        this.account = new AccountModule(this.httpClient);
        this.channels = new ChannelsModule(this.httpClient);
        this.friends = new FriendsModule(this.httpClient);
        this.agents = new AgentsModule(this.httpClient);
        this.resolve = new ResolveModule(this.httpClient);
        this.users = new UsersModule(this.httpClient);
        this.developer = new DeveloperModule(this.httpClient);
        this.inbox = new InboxModule(this.httpClient);
        this.search = new SearchModule(this.httpClient);
        this.events = new EventsModule(this.httpClient);
        this.tokenChats = new TokenChatsModule(this.httpClient);
        this.streams = new StreamsModule(this.httpClient);
        this.username = new UsernameModule(this.httpClient);
        this.wallet = new WalletModule(this.httpClient);
        this.leaderboard = new LeaderboardModule(this.httpClient);
        this.points = new PointsModule(this.httpClient);
        this.scheduling = new SchedulingModule(this.httpClient);
    }

    private applySessionToken(token: string | null): void {
        this._sessionToken = token;
        this.sessionStorageAdapter?.set(token);
    }

    get sessionToken(): string | null {
        return this._sessionToken;
    }

    set sessionToken(token: string | null) {
        this.applySessionToken(token);
    }

    get isAuthenticated(): boolean {
        return this._sessionToken !== null;
    }

    /** Low-level HTTP client (retries, hooks, session refresh). */
    get http(): HttpClient {
        return this.httpClient;
    }
}
