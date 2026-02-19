/**
 * Public API barrel for the Generic Sheets Database Library.
 * Zero domain knowledge — all domain types live in ortho-sheets.
 */

// Client factory
export { createSheetsClient } from "./client";

// Generic types
export type {
  SheetSchema,
  FormattingRule,
  InferEntity,
  Repository,
  SheetsClientConfig,
  SheetsClient,
} from "./types";

// Error types
export { SheetsDbError, isSheetsDbError, validationError, schemaError } from "./errors";
export type { SheetsDbErrorKind, ValidationIssue } from "./errors";

// Transport
export { extractSpreadsheetId } from "./transport";

// Utilities
export {
  generateId,
  isValidDate,
  normalizeDate,
  looksLikeIsoDate,
  parseAmount,
  hasIdColumn,
  findMissingHeaders,
} from "./utils";
