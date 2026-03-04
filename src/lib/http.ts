import {
    SpritzError,
    AuthError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
    ValidationError,
} from "./errors";

export interface HttpClientConfig {
    baseUrl: string;
    apiKey: string;
    getSessionToken: () => string | null;
}

export class HttpClient {
    private baseUrl: string;
    private apiKey: string;
    private getSessionToken: () => string | null;

    constructor(config: HttpClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, "");
        this.apiKey = config.apiKey;
        this.getSessionToken = config.getSessionToken;
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

    private async handleResponse<T>(response: Response): Promise<T> {
        if (response.ok) {
            const text = await response.text();
            if (!text) return {} as T;
            try {
                return JSON.parse(text) as T;
            } catch {
                return {} as T;
            }
        }

        let errorMessage = `HTTP ${response.status}`;
        try {
            const body = await response.json();
            const err = body.error;
            errorMessage =
                (typeof err === "object" && err && "message" in err && String(err.message)) ||
                (typeof body.error === "string" ? body.error : null) ||
                body.message ||
                errorMessage;
        } catch {
            // Use status-based message
        }

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
                throw new RateLimitError(errorMessage);
            default:
                throw new SpritzError(errorMessage, response.status);
        }
    }

    async get<T = unknown>(
        path: string,
        params?: Record<string, string | number | boolean | undefined>,
        extraHeaders?: Record<string, string>
    ): Promise<T> {
        const url = this.buildUrl(path, params);
        const response = await fetch(url, {
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
        const response = await fetch(url, {
            method: "POST",
            headers: { ...this.buildHeaders(), ...extraHeaders },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    }

    async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
        const url = this.buildUrl(path);
        const response = await fetch(url, {
            method: "PATCH",
            headers: this.buildHeaders(),
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    }

    async put<T = unknown>(path: string, body?: unknown): Promise<T> {
        const url = this.buildUrl(path);
        const response = await fetch(url, {
            method: "PUT",
            headers: this.buildHeaders(),
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    }

    async delete<T = unknown>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
        const url = this.buildUrl(path, params);
        const response = await fetch(url, {
            method: "DELETE",
            headers: this.buildHeaders(),
        });
        return this.handleResponse<T>(response);
    }
}
