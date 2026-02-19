/**
 * Generic types for the Google Sheets database library.
 * This module defines the schema-driven API: SheetSchema<T>, Repository<T>,
 * SheetsClient<S>, and supporting types. Zero domain knowledge.
 */

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Formatting rule for a column range within a sheet. */
export interface FormattingRule {
  startCol: number;
  endCol: number;
  startRow?: number;
  endRow?: number;
  bold?: boolean;
  fontSize?: number;
  horizontalAlignment?: "LEFT" | "CENTER" | "RIGHT";
  numberFormat?: { type: string; pattern?: string };
}

// ---------------------------------------------------------------------------
// Schema Definition
// ---------------------------------------------------------------------------

/** Schema definition for mapping an entity type to a Google Sheet. */
export interface SheetSchema<T> {
  sheetName: string;
  headers: string[];
  readRange: string;
  writeRange: string;
  clearRange: string;
  parseRow(row: unknown[], rowIndex: number): T | null;
  toRow(entity: T): unknown[];
  validate?: (entity: T) => void;
  appendSupported?: boolean;
  formatting?: FormattingRule[];
  headerFormatting?: {
    bold?: boolean;
    fontSize?: number;
    horizontalAlignment?: "LEFT" | "CENTER" | "RIGHT";
  };
}

// ---------------------------------------------------------------------------
// Type Inference
// ---------------------------------------------------------------------------

/** Extract the entity type T from a SheetSchema<T>. */
export type InferEntity<S> = S extends SheetSchema<infer T> ? T : never;

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

/** Bound CRUD operations for a single entity type. */
export interface Repository<T> {
  readAll(): Promise<T[]>;
  writeAll(records: T[]): Promise<void>;
  append(records: T[]): Promise<void>;
}

// ---------------------------------------------------------------------------
// Client Configuration
// ---------------------------------------------------------------------------

/** Configuration for creating a sheets client. */
export interface SheetsClientConfig<S extends Record<string, SheetSchema<any>>> {
  token: string;
  spreadsheetId: string;
  schemas: S;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/** The main client returned by createSheetsClient. */
export interface SheetsClient<S extends Record<string, SheetSchema<any>>> {
  repo<K extends keyof S & string>(key: K): Repository<InferEntity<S[K]>>;
  batchSync(payload: Partial<{ [K in keyof S]: InferEntity<S[K]>[] }>): Promise<void>;
  ensureSchema(): Promise<void>;
  applyFormatting(): Promise<void>;
  extractSpreadsheetId(urlOrId: string): string | null;
}
