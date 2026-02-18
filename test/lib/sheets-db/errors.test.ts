import { test, expect, describe } from "bun:test";
import {
  SheetsDbError,
  isSheetsDbError,
  authError,
  rateLimitError,
  networkError,
  validationError,
  schemaError,
  apiError,
} from "@/lib/sheets-db/errors";

describe("SheetsDbError", () => {
  test("constructs with kind and message", () => {
    const err = new SheetsDbError("AUTH_ERROR", "token expired");
    expect(err.kind).toBe("AUTH_ERROR");
    expect(err.message).toBe("token expired");
    expect(err.name).toBe("SheetsDbError");
    expect(err).toBeInstanceOf(Error);
  });

  test("stores cause when provided", () => {
    const cause = new Error("original");
    const err = new SheetsDbError("NETWORK_ERROR", "fetch failed", { cause });
    expect(err.cause).toBe(cause);
  });

  test("stores retryAfterMs for rate limits", () => {
    const err = new SheetsDbError("RATE_LIMIT", "slow down", {
      retryAfterMs: 5000,
    });
    expect(err.retryAfterMs).toBe(5000);
  });

  test("stores validationIssues for validation errors", () => {
    const issues = [{ field: "id", message: "required" }];
    const err = new SheetsDbError("VALIDATION_ERROR", "bad data", {
      validationIssues: issues,
    });
    expect(err.validationIssues).toEqual(issues);
  });
});

describe("isSheetsDbError", () => {
  test("returns true for SheetsDbError instances", () => {
    const err = new SheetsDbError("API_ERROR", "test");
    expect(isSheetsDbError(err)).toBe(true);
  });

  test("returns false for regular Error", () => {
    expect(isSheetsDbError(new Error("test"))).toBe(false);
  });

  test("returns false for non-Error values", () => {
    expect(isSheetsDbError("string")).toBe(false);
    expect(isSheetsDbError(null)).toBe(false);
    expect(isSheetsDbError(undefined)).toBe(false);
    expect(isSheetsDbError(42)).toBe(false);
  });
});

describe("factory functions", () => {
  test("authError creates AUTH_ERROR", () => {
    const err = authError("token expired");
    expect(err.kind).toBe("AUTH_ERROR");
    expect(err.message).toBe("token expired");
  });

  test("rateLimitError creates RATE_LIMIT with retryAfterMs", () => {
    const err = rateLimitError("slow down", 3000);
    expect(err.kind).toBe("RATE_LIMIT");
    expect(err.retryAfterMs).toBe(3000);
  });

  test("networkError creates NETWORK_ERROR", () => {
    const cause = new TypeError("Failed to fetch");
    const err = networkError("offline", cause);
    expect(err.kind).toBe("NETWORK_ERROR");
    expect(err.cause).toBe(cause);
  });

  test("validationError creates VALIDATION_ERROR with issues", () => {
    const issues = [
      { field: "amount", message: "must be positive", value: -5 },
    ];
    const err = validationError("invalid record", issues);
    expect(err.kind).toBe("VALIDATION_ERROR");
    expect(err.validationIssues).toEqual(issues);
  });

  test("schemaError creates SCHEMA_ERROR", () => {
    const err = schemaError("missing sheet");
    expect(err.kind).toBe("SCHEMA_ERROR");
  });

  test("apiError creates API_ERROR", () => {
    const err = apiError("500 internal error");
    expect(err.kind).toBe("API_ERROR");
  });
});
