export class SpritzError extends Error {
    public readonly status: number;
    public readonly code: string;

    constructor(message: string, status: number = 500, code: string = "SPRITZ_ERROR") {
        super(message);
        this.name = "SpritzError";
        this.status = status;
        this.code = code;
    }
}

export class AuthError extends SpritzError {
    constructor(message: string = "Authentication required") {
        super(message, 401, "AUTH_ERROR");
        this.name = "AuthError";
    }
}

export class ForbiddenError extends SpritzError {
    constructor(message: string = "Access denied") {
        super(message, 403, "FORBIDDEN");
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends SpritzError {
    constructor(message: string = "Resource not found") {
        super(message, 404, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}

export class RateLimitError extends SpritzError {
    /** Seconds to wait before retrying, from Retry-After header when present */
    public readonly retryAfterSeconds?: number;

    constructor(message: string = "Rate limit exceeded", retryAfterSeconds?: number) {
        super(message, 429, "RATE_LIMIT");
        this.name = "RateLimitError";
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

export class ValidationError extends SpritzError {
    constructor(message: string = "Invalid request") {
        super(message, 400, "VALIDATION_ERROR");
        this.name = "ValidationError";
    }
}

/** Successful HTTP status but body was empty or not valid JSON when JSON was expected */
export class InvalidResponseError extends SpritzError {
    constructor(message: string = "Invalid or empty response body") {
        super(message, 200, "INVALID_RESPONSE");
        this.name = "InvalidResponseError";
    }
}

export function isSpritzError(e: unknown): e is SpritzError {
    return e instanceof SpritzError;
}
