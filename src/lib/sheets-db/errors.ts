/**
 * Typed error handling for the Google Sheets database layer.
 */

export type SheetsDbErrorKind =
  | "AUTH_ERROR"
  | "RATE_LIMIT"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "SCHEMA_ERROR"
  | "API_ERROR";

export interface ValidationIssue {
  field: string;
  message: string;
  value?: unknown;
}

export class SheetsDbError extends Error {
  readonly kind: SheetsDbErrorKind;
  readonly cause?: unknown;
  readonly retryAfterMs?: number;
  readonly validationIssues?: ValidationIssue[];

  constructor(
    kind: SheetsDbErrorKind,
    message: string,
    options?: {
      cause?: unknown;
      retryAfterMs?: number;
      validationIssues?: ValidationIssue[];
    },
  ) {
    super(message);
    this.name = "SheetsDbError";
    this.kind = kind;
    this.cause = options?.cause;
    this.retryAfterMs = options?.retryAfterMs;
    this.validationIssues = options?.validationIssues;
  }
}

export function isSheetsDbError(err: unknown): err is SheetsDbError {
  return err instanceof SheetsDbError;
}

export function authError(message: string, cause?: unknown): SheetsDbError {
  return new SheetsDbError("AUTH_ERROR", message, { cause });
}

export function rateLimitError(
  message: string,
  retryAfterMs?: number,
  cause?: unknown,
): SheetsDbError {
  return new SheetsDbError("RATE_LIMIT", message, { cause, retryAfterMs });
}

export function networkError(message: string, cause?: unknown): SheetsDbError {
  return new SheetsDbError("NETWORK_ERROR", message, { cause });
}

export function validationError(
  message: string,
  issues: ValidationIssue[],
): SheetsDbError {
  return new SheetsDbError("VALIDATION_ERROR", message, {
    validationIssues: issues,
  });
}

export function schemaError(message: string, cause?: unknown): SheetsDbError {
  return new SheetsDbError("SCHEMA_ERROR", message, { cause });
}

export function apiError(message: string, cause?: unknown): SheetsDbError {
  return new SheetsDbError("API_ERROR", message, { cause });
}
