import { describe, expect, it, vi } from "vitest";
import { HttpClient } from "./http";
import { InvalidResponseError } from "./errors";

function createClient(fetchImpl: typeof fetch): HttpClient {
    return new HttpClient({
        baseUrl: "https://api.example.com",
        apiKey: "test-key",
        getSessionToken: () => null,
        maxRetries: 2,
        retryBaseDelayMs: 1,
        fetchImpl,
    });
}

describe("HttpClient.handleResponse (via get)", () => {
    it("throws InvalidResponseError on empty 200 body", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(
            new Response("", { status: 200, headers: { "Content-Type": "application/json" } })
        );
        const http = createClient(fetchImpl);
        await expect(http.get("/x")).rejects.toThrow(InvalidResponseError);
    });

    it("throws InvalidResponseError on non-JSON body", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(new Response("not json", { status: 200 }));
        const http = createClient(fetchImpl);
        await expect(http.get("/x")).rejects.toThrow(InvalidResponseError);
    });

    it("parses valid JSON", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
        const http = createClient(fetchImpl);
        await expect(http.get<{ ok: boolean }>("/x")).resolves.toEqual({ ok: true });
    });
});

describe("HttpClient retries", () => {
    it("retries on 429 and succeeds", async () => {
        let n = 0;
        const fetchImpl = vi.fn().mockImplementation(() => {
            n += 1;
            if (n === 1) {
                return Promise.resolve(new Response("{}", { status: 429, headers: { "Retry-After": "0" } }));
            }
            return Promise.resolve(new Response(JSON.stringify({ data: 1 }), { status: 200 }));
        });
        const http = createClient(fetchImpl);
        const out = await http.get<{ data: number }>("/r");
        expect(out.data).toBe(1);
        expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it("throws RateLimitError after max retries on 429", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(
            new Response("{}", { status: 429, headers: { "Retry-After": "0" } })
        );
        const http = createClient(fetchImpl);
        await expect(http.get("/r")).rejects.toMatchObject({
            name: "RateLimitError",
            retryAfterSeconds: 0,
        });
        expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
});

describe("HttpClient 401 refresh", () => {
    it("calls onUnauthorized and retries once with new token", async () => {
        let token: string | null = null;
        const onUnauthorized = vi.fn(async () => {
            token = "fresh";
            return true;
        });
        const fetchImpl = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
            const auth = (init?.headers as Record<string, string>)?.Authorization;
            if (!auth?.includes("Bearer")) {
                return Promise.resolve(new Response(JSON.stringify({ error: "no" }), { status: 401 }));
            }
            return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
        });

        const http = new HttpClient({
            baseUrl: "https://api.example.com",
            apiKey: "k",
            getSessionToken: () => token,
            onUnauthorized,
            maxRetries: 0,
            fetchImpl,
        });

        const out = await http.get<{ ok: boolean }>("/p");
        expect(out.ok).toBe(true);
        expect(onUnauthorized).toHaveBeenCalledTimes(1);
        expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it("does not call onUnauthorized for POST /api/auth/session", async () => {
        const onUnauthorized = vi.fn().mockResolvedValue(true);
        const fetchImpl = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ error: "no" }), { status: 401 })
        );
        const http = new HttpClient({
            baseUrl: "https://api.example.com",
            apiKey: "k",
            getSessionToken: () => null,
            onUnauthorized,
            maxRetries: 0,
            fetchImpl,
        });

        await expect(http.post("/api/auth/session", {})).rejects.toThrow();
        expect(onUnauthorized).not.toHaveBeenCalled();
    });
});
