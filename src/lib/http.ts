import {
    SpritzError,
    AuthError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
    ValidationError,
    InvalidResponseError,
} from "./errors";

export type HttpRequestHook = (info: {
    url: string;
    method: string;
    headers: Record<string, string>;
}) => void;

export type HttpResponseHook = (info: { url: string; response: Response }) => void;

function parseRetryAfterSeconds(header: string | null): number | undefined {
    if (!header?.trim()) return undefined;
    const n = parseInt(header, 10);
    if (!Number.isNaN(n) && n >= 0) return n;
    const d = Date.parse(header);
    if (!Number.isNaN(d)) {
        const sec = Math.ceil((d - Date.now()) / 1000);
        return sec > 0 ? sec : 0;
    }
    return undefined;
}

export interface HttpClientConfig {
    baseUrl: string;
    apiKey: string;
    getSessionToken: () => string | null;
    /** Called after a 401 to refresh the Bearer token (e.g. POST /api/auth/session). Return true if a new token is available. */
    onUnauthorized?: () => Promise<boolean>;
    maxRetries?: number;
    /** Base delay for exponential backoff on retriable failures (default 300ms) */
    retryBaseDelayMs?: number;
    /** HTTP status codes that trigger retry with backoff (default [429, 503]) */
    retryOnStatuses?: number[];
    onRequest?: HttpRequestHook;
    onResponse?: HttpResponseHook;
    fetchImpl?: typeof fetch;
}

export class HttpClient {
    private baseUrl: string;
    private apiKey: string;
    private getSessionToken: () => string | null;
    private onUnauthorized?: () => Promise<boolean>;
    private maxRetries: number;
    private retryBaseDelayMs: number;
    private retryOnStatuses: Set<number>;
    private onRequest?: HttpRequestHook;
    private onResponse?: HttpResponseHook;
    private fetchImpl: typeof fetch;

    constructor(config: HttpClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, "");
        this.apiKey = config.apiKey;
        this.getSessionToken = config.getSessionToken;
        this.onUnauthorized = config.onUnauthorized;
        this.maxRetries = config.maxRetries ?? 2;
        this.retryBaseDelayMs = config.retryBaseDelayMs ?? 300;
        this.retryOnStatuses = new Set(config.retryOnStatuses ?? [429, 503]);
        this.onRequest = config.onRequest;
        this.onResponse = config.onResponse;
        this.fetchImpl = config.fetchImpl ?? fetch;
    }

    setOnUnauthorized(handler: (() => Promise<boolean>) | undefined): void {
        this.onUnauthorized = handler;
    }

    private buildHeaders(extra?: Record<string, string>): Record<string, string> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
        };

        const token = this.getSessionToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        if (extra) {
            Object.assign(headers, extra);
        }

        return headers;
    }

    private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
        const url = new URL(path, this.baseUrl);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, String(value));
                }
            }
        }
        return url.toString();
    }

    private mapErrorStatus(status: number, errorMessage: string, response: Response): never {
        switch (status) {
            case 400:
                throw new ValidationError(errorMessage);
            case 401:
                throw new AuthError(errorMessage);
            case 403:
                throw new ForbiddenError(errorMessage);
            case 404:
                throw new NotFoundError(errorMessage);
            case 429:
                throw new RateLimitError(
                    errorMessage,
                    parseRetryAfterSeconds(response.headers.get("Retry-After"))
                );
            default:
                throw new SpritzError(errorMessage, status);
        }
    }

    private async parseErrorBody(response: Response): Promise<string> {
        let errorMessage = `HTTP ${response.status}`;
        try {
            const clone = response.clone();
            const body = await clone.json();
            const err = body.error;
            errorMessage =
                (typeof err === "object" && err && "message" in err && String((err as { message: unknown }).message)) ||
                (typeof body.error === "string" ? body.error : null) ||
                (typeof body.message === "string" ? body.message : null) ||
                errorMessage;
        } catch {
            // keep status-based message
        }
        return errorMessage;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (response.ok) {
            const text = await response.text();
            if (!text.trim()) {
                throw new InvalidResponseError("Empty response body");
            }
            try {
                return JSON.parse(text) as T;
            } catch {
                throw new InvalidResponseError("Response was not valid JSON");
            }
        }

        const errorMessage = await this.parseErrorBody(response);
        this.mapErrorStatus(response.status, errorMessage, response);
    }

    private async sleep(ms: number): Promise<void> {
        await new Promise((r) => setTimeout(r, ms));
    }

    private async fetchOnce(url: string, init: RequestInit, authRefreshAttempted: boolean): Promise<Response> {
        const headersObj =
            init.headers && typeof init.headers === "object" && !Array.isArray(init.headers)
                ? (init.headers as Record<string, string>)
                : this.buildHeaders();
        this.onRequest?.({ url, method: (init.method as string) || "GET", headers: headersObj });

        const response = await this.fetchImpl(url, init);
        this.onResponse?.({ url, response });

        const isSessionExtendPost =
            url.includes("/api/auth/session") && (init.method === "POST" || init.method === "post");

        if (
            response.status === 401 &&
            !authRefreshAttempted &&
            this.onUnauthorized &&
            !isSessionExtendPost
        ) {
            const refreshed = await this.onUnauthorized();
            if (refreshed) {
                const nextHeaders = this.buildHeaders(
                    init.headers && typeof init.headers === "object" && !Array.isArray(init.headers)
                        ? (init.headers as Record<string, string>)
                        : undefined
                );
                return this.fetchOnce(url, { ...init, headers: nextHeaders }, true);
            }
        }

        return response;
    }

    private async fetchWithRetries(url: string, init: RequestInit): Promise<Response> {
        let attempt = 0;
        let response = await this.fetchOnce(url, init, false);

        while (
            !response.ok &&
            attempt < this.maxRetries &&
            this.retryOnStatuses.has(response.status)
        ) {
            const retryAfter = parseRetryAfterSeconds(response.headers.get("Retry-After"));
            const delay =
                retryAfter !== undefined
                    ? retryAfter * 1000
                    : this.retryBaseDelayMs * Math.pow(2, attempt);
            await this.sleep(delay);
            attempt += 1;
            response = await this.fetchOnce(url, init, false);
        }

        return response;
    }

    async get<T = unknown>(
        path: string,
        params?: Record<string, string | number | boolean | undefined>,
        extraHeaders?: Record<string, string>
    ): Promise<T> {
        const url = this.buildUrl(path, params);
        const response = await this.fetchWithRetries(url, {
            method: "GET",
            headers: { ...this.buildHeaders(), ...extraHeaders },
        });
        return this.handleResponse<T>(response);
    }

    async post<T = unknown>(
        path: string,
        body?: unknown,
        params?: Record<string, string | number | boolean | undefined>,
        extraHeaders?: Record<string, string>
    ): Promise<T> {
        const url = params ? this.buildUrl(path, params) : this.buildUrl(path);
        const response = await this.fetchWithRetries(url, {
            method: "POST",
            headers: { ...this.buildHeaders(), ...extraHeaders },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    }

    async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
        const url = this.buildUrl(path);
        const response = await this.fetchWithRetries(url, {
            method: "PATCH",
            headers: this.buildHeaders(),
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    }

    async put<T = unknown>(path: string, body?: unknown): Promise<T> {
        const url = this.buildUrl(path);
        const response = await this.fetchWithRetries(url, {
            method: "PUT",
            headers: this.buildHeaders(),
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    }

    async delete<T = unknown>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
        const url = this.buildUrl(path, params);
        const response = await this.fetchWithRetries(url, {
            method: "DELETE",
            headers: this.buildHeaders(),
        });
        return this.handleResponse<T>(response);
    }

    /**
     * Raw POST that returns the fetch Response directly (for NDJSON streaming).
     */
    async rawPost(path: string, body?: unknown): Promise<Response> {
        const url = this.buildUrl(path);
        const response = await this.fetchWithRetries(url, {
            method: "POST",
            headers: this.buildHeaders(),
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorMessage = await this.parseErrorBody(response);
            switch (response.status) {
                case 400:
                    throw new ValidationError(errorMessage);
                case 401:
                    throw new AuthError(errorMessage);
                case 403:
                    throw new ForbiddenError(errorMessage);
                case 404:
                    throw new NotFoundError(errorMessage);
                case 429:
                    throw new RateLimitError(
                        errorMessage,
                        parseRetryAfterSeconds(response.headers.get("Retry-After"))
                    );
                default:
                    throw new SpritzError(errorMessage, response.status);
            }
        }

        return response;
    }
}
