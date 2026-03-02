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
    constructor(message: string = "Rate limit exceeded") {
        super(message, 429, "RATE_LIMIT");
        this.name = "RateLimitError";
    }
}

export class ValidationError extends SpritzError {
    constructor(message: string = "Invalid request") {
        super(message, 400, "VALIDATION_ERROR");
        this.name = "ValidationError";
    }
}
