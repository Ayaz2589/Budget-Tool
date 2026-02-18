/**
 * Contract: Generic Sheets Database Client API
 *
 * This file defines the public API surface of the generic sheets-db library.
 * Implementation must conform to these interfaces exactly.
 */

// ---------------------------------------------------------------------------
// Schema Definition (consumer-provided)
// ---------------------------------------------------------------------------

/** Formatting rule for a column range within a sheet. */
export interface FormattingRule {
  startCol: number;
  endCol: number;
  startRow?: number; // default: 1 (skip header row)
  endRow?: number;   // default: 10000
  bold?: boolean;
  fontSize?: number;
  horizontalAlignment?: "LEFT" | "CENTER" | "RIGHT";
  numberFormat?: { type: string; pattern?: string };
}

/** Schema definition for mapping an entity type to a Google Sheet. */
export interface SheetSchema<T> {
  /** Tab name in the spreadsheet */
  sheetName: string;
  /** Column header labels, in order */
  headers: string[];
  /** A1 range for reading data (e.g., "Expenses!A1:G") */
  readRange: string;
  /** A1 range for writing headers + data (e.g., "Expenses!A1:G") */
  writeRange: string;
  /** A1 range to clear before full writes (e.g., "Expenses!A1:G10000") */
  clearRange: string;
  /** Convert a raw sheet row to a typed entity. Return null to skip row. */
  parseRow(row: unknown[], rowIndex: number): T | null;
  /** Convert a typed entity to a sheet row (string/number array). */
  toRow(entity: T): unknown[];
  /** Optional: validate entity before write. Throw SheetsDbError on failure. */
  validate?: (entity: T) => void;
  /** Whether append operations are supported (default: false). */
  appendSupported?: boolean;
  /** Optional: formatting rules for this sheet's columns. */
  formatting?: FormattingRule[];
  /** Optional: header formatting (bold, font size). Applied to row 0. */
  headerFormatting?: {
    bold?: boolean;
    fontSize?: number;
    horizontalAlignment?: "LEFT" | "CENTER" | "RIGHT";
  };
}

// ---------------------------------------------------------------------------
// Type Inference Helper
// ---------------------------------------------------------------------------

/** Extract the entity type T from a SheetSchema<T>. */
export type InferEntity<S> = S extends SheetSchema<infer T> ? T : never;

// ---------------------------------------------------------------------------
// Repository (library-generated per schema)
// ---------------------------------------------------------------------------

/** Bound CRUD operations for a single entity type. */
export interface Repository<T> {
  /** Read all rows from the sheet, applying parseRow to each. */
  readAll(): Promise<T[]>;
  /** Validate all records, clear the sheet, write headers + data rows. */
  writeAll(records: T[]): Promise<void>;
  /** Validate and append records. Throws if schema.appendSupported is false. */
  append(records: T[]): Promise<void>;
}

// ---------------------------------------------------------------------------
// Client Configuration
// ---------------------------------------------------------------------------

/** Configuration for creating a sheets client. */
export interface SheetsClientConfig<S extends Record<string, SheetSchema<unknown>>> {
  /** Google OAuth access token */
  token: string;
  /** Google Sheets spreadsheet ID */
  spreadsheetId: string;
  /** Map of schema key → schema definition */
  schemas: S;
}

// ---------------------------------------------------------------------------
// Client (library-provided)
// ---------------------------------------------------------------------------

/** The main client returned by createSheetsClient. */
export interface SheetsClient<S extends Record<string, SheetSchema<unknown>>> {
  /** Get a typed repository by schema key. */
  repo<K extends keyof S & string>(key: K): Repository<InferEntity<S[K]>>;

  /**
   * Batch sync: clear all registered sheets, then write all data.
   * Executes in two API calls (batchClear + batchUpdate).
   * Payload keys must match registered schema keys.
   */
  batchSync(payload: Partial<{ [K in keyof S]: InferEntity<S[K]>[] }>): Promise<void>;

  /** Create any missing sheets based on registered schema sheetNames. */
  ensureSchema(): Promise<void>;

  /** Apply all registered formatting rules across all schemas. */
  applyFormatting(): Promise<void>;

  /** Extract spreadsheet ID from a URL or return the raw ID. */
  extractSpreadsheetId(urlOrId: string): string | null;
}

// ---------------------------------------------------------------------------
// Error Types (unchanged from sheets-db)
// ---------------------------------------------------------------------------

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
}

/**
 * All errors thrown by the library are SheetsDbError instances.
 * Use isSheetsDbError() to type-narrow in catch blocks.
 */
export interface SheetsDbError extends Error {
  kind: SheetsDbErrorKind;
  issues?: ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Factory Function
// ---------------------------------------------------------------------------

/**
 * Create a typed Google Sheets client from schema definitions.
 *
 * @example
 * ```ts
 * const db = createSheetsClient({
 *   token: "ya29...",
 *   spreadsheetId: "1abc...",
 *   schemas: {
 *     contacts: contactSchema,
 *     orders: orderSchema,
 *   },
 * });
 *
 * const contacts = await db.repo("contacts").readAll();
 * await db.repo("orders").writeAll(myOrders);
 * await db.batchSync({ contacts: allContacts, orders: allOrders });
 * ```
 */
export declare function createSheetsClient<
  S extends Record<string, SheetSchema<unknown>>,
>(config: SheetsClientConfig<S>): SheetsClient<S>;

/** Type guard for SheetsDbError instances. */
export declare function isSheetsDbError(err: unknown): err is SheetsDbError;

// ---------------------------------------------------------------------------
// Utility Exports
// ---------------------------------------------------------------------------

/** Extract spreadsheet ID from a Google Sheets URL or return raw ID. */
export declare function extractSpreadsheetId(urlOrId: string): string | null;

/** Generate a unique ID (timestamp-based). */
export declare function generateId(): string;

// ---------------------------------------------------------------------------
// Generic Utility Functions
// ---------------------------------------------------------------------------

/** Validate an ISO date string (YYYY-MM-DD). */
export declare function isValidDate(date: string): boolean;

/** Attempt to repair/normalize a date value to ISO format. */
export declare function normalizeDate(value: unknown): string | null;

/** Parse a string/number into a numeric amount. */
export declare function parseAmount(value: unknown): number | null;

/** Find required headers missing from actual headers (case-insensitive). */
export declare function findMissingHeaders(
  actual: string[],
  required: string[],
): string[];

/** Detect if the first column is an ID (not a date). */
export declare function hasIdColumn(
  row: unknown[],
  minLength: number,
  looksLikeDate: (v: string) => boolean,
): boolean;
