/**
 * Custom error classes for API error handling
 * Provides user-friendly messages and error type differentiation
 */

/**
 * Base class for all API-related errors
 */
export class ApiError extends Error {
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    isRetryable: boolean = true,
    originalError?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Error thrown when a requested resource is not found (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = "The requested item was not found.", originalError?: unknown) {
    super(message, 404, false, originalError);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error thrown when there are network connectivity issues
 */
export class NetworkError extends ApiError {
  constructor(
    message: string = "Unable to connect. Please check your connection and try again.",
    originalError?: unknown
  ) {
    super(message, undefined, true, originalError);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error thrown for authentication/authorization failures (401/403)
 */
export class AuthenticationError extends ApiError {
  constructor(
    message: string = "You need to log in to access this page.",
    statusCode: number = 401,
    originalError?: unknown
  ) {
    super(message, statusCode, false, originalError);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown for server errors (500+)
 */
export class ServerError extends ApiError {
  constructor(
    message: string = "Something went wrong on our end. Please try again later.",
    statusCode: number = 500,
    originalError?: unknown
  ) {
    super(message, statusCode, true, originalError);
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Error thrown for validation errors (400)
 */
export class ValidationError extends ApiError {
  constructor(
    message: string = "Invalid request. Please check your input.",
    originalError?: unknown
  ) {
    super(message, 400, false, originalError);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown for conflicts, such as duplicate resources (409)
 */
export class ConflictError extends ApiError {
  constructor(
    message: string = "A conflict occurred. The resource may already exist.",
    originalError?: unknown
  ) {
    super(message, 409, false, originalError);
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Utility function to parse error responses from API
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;

    // Sanitize raw database exception strings
    if (msg.includes("duplicate key value violates unique constraint") || msg.includes("ConstraintViolationException")) {
      return "A record with this information already exists.";
    }
    if (msg.includes("could not execute statement") || msg.includes("SQL [insert")) {
      return "An unexpected database error occurred. Please verify your data and try again.";
    }

    return msg;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Utility function to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.isRetryable;
  }
  return false;
}
