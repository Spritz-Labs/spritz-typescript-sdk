import { describe, expect, it } from "vitest";
import {
    AuthError,
    InvalidResponseError,
    RateLimitError,
    SpritzError,
    isSpritzError,
} from "./errors";

describe("isSpritzError", () => {
    it("returns true for SpritzError subclasses", () => {
        expect(isSpritzError(new AuthError())).toBe(true);
        expect(isSpritzError(new InvalidResponseError())).toBe(true);
        expect(isSpritzError(new RateLimitError("slow down", 30))).toBe(true);
    });

    it("returns false for plain errors and non-errors", () => {
        expect(isSpritzError(new Error("x"))).toBe(false);
        expect(isSpritzError("string")).toBe(false);
        expect(isSpritzError(null)).toBe(false);
    });
});

describe("RateLimitError", () => {
    it("stores retryAfterSeconds when provided", () => {
        const e = new RateLimitError("wait", 42);
        expect(e.retryAfterSeconds).toBe(42);
        expect(e.status).toBe(429);
    });
});

describe("SpritzError", () => {
    it("defaults status and code", () => {
        const e = new SpritzError("msg");
        expect(e.status).toBe(500);
        expect(e.code).toBe("SPRITZ_ERROR");
    });
});
