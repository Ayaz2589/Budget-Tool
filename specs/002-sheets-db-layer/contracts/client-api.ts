/**
 * Google Sheets Database Layer — Client API Contract
 *
 * This file defines the public interface of the sheets-db module.
 * It is a DESIGN ARTIFACT — not compiled or imported by the app.
 * The implementation must conform to these interfaces.
 */

// ─── Configuration ──────────────────────────────────────────────

/** Connection configuration for the sheets database client. */
export interface SheetsDbConfig {
  /** Google OAuth2 access token. */
  token: string;
  /** Google Sheets spreadsheet ID or URL (extracted automatically). */
  spreadsheetId: string;
}

// ─── Error Types ────────────────────────────────────────────────

export type SheetsDbErrorKind =
  | "AUTH_ERROR"
  | "RATE_LIMIT"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "SCHEMA_ERROR"
  | "API_ERROR";

export interface SheetsDbError {
  kind: SheetsDbErrorKind;
  message: string;
  /** Original error or response, if available. */
  cause?: unknown;
  /** For RATE_LIMIT errors: suggested retry delay in ms. */
  retryAfterMs?: number;
  /** For VALIDATION_ERROR: list of field-level issues. */
  validationIssues?: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

// ─── Entity Repository Interface ────────────────────────────────

/**
 * Generic repository pattern for a domain entity.
 * Each entity type gets one of these, pre-bound to the client's connection.
 */
export interface EntityRepository<T> {
  /** Read all records of this entity type from storage. */
  readAll(): Promise<T[]>;

  /** Overwrite all records of this entity type in storage (clear + write). */
  writeAll(records: T[]): Promise<void>;

  /** Append records without clearing existing data. */
  append(records: T[]): Promise<void>;
}

// ─── Specialized Repositories ───────────────────────────────────

/** Expenses have separate read paths for regular vs mortgage expenses. */
export interface ExpenseRepository {
  /** Read all non-mortgage expenses. */
  readAll(): Promise<Expense[]>;

  /** Read mortgage expenses from the dedicated Mortgage sheet. */
  readMortgage(): Promise<Expense[]>;

  /** Overwrite all non-mortgage expenses. */
  writeAll(records: Expense[]): Promise<void>;

  /** Overwrite all mortgage expenses. */
  writeMortgage(records: Expense[]): Promise<void>;

  /** Append non-mortgage expenses. */
  append(records: Expense[]): Promise<void>;
}

/** Totals are write-only from the data layer perspective. */
export interface TotalsRepository {
  /** Write monthly totals + grand total row. */
  write(months: MonthTotals[], grandTotal: MonthTotals): Promise<void>;
}

/** Data blob is a single opaque string (backup/restore). */
export interface DataBlobRepository {
  /** Read the raw data blob string, or null if missing/corrupt. */
  read(): Promise<string | null>;

  /** Write a raw data blob string. */
  write(blob: string): Promise<void>;
}

// ─── Batch Sync Payload ─────────────────────────────────────────

/** All data needed for a full sync push. */
export interface SyncPayload {
  expenses: Expense[];
  mortgageExpenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  ownerTransfers: OwnerTransfer[];
  presetTransactions: PresetTransaction[];
  months: MonthTotals[];
  grandTotal: MonthTotals;
  dataBlob: string;
}

// ─── Client Interface ───────────────────────────────────────────

/** The main database client returned by createSheetsClient(). */
export interface SheetsDbClient {
  /** Expense CRUD (includes separate mortgage operations). */
  expenses: ExpenseRepository;

  /** Income CRUD. */
  income: EntityRepository<Income>;

  /** Debt CRUD. */
  debts: EntityRepository<Debt>;

  /** Debt payment CRUD. */
  debtPayments: EntityRepository<DebtPayment>;

  /** Owner transfer CRUD. */
  ownerTransfers: EntityRepository<OwnerTransfer>;

  /** Preset transaction CRUD. */
  presets: EntityRepository<PresetTransaction>;

  /** Monthly totals (write-only). */
  totals: TotalsRepository;

  /** Full-state data blob (backup). */
  dataBlob: DataBlobRepository;

  /**
   * Batch sync: clear all sheets then write all data in one logical operation.
   * This is the primary "push to sheets" entry point.
   */
  batchSync(payload: SyncPayload): Promise<void>;

  /**
   * Ensure all required sheet tabs exist, creating missing ones.
   * Should be called before first read/write operation.
   */
  ensureSchema(): Promise<void>;

  /**
   * Get numeric sheet IDs (needed for formatting operations).
   */
  getSheetIds(): Promise<SheetIds | null>;

  /**
   * Apply formatting to sheet headers and columns.
   * Optional post-write operation.
   */
  applyFormatting(sheetIds: SheetIds): Promise<void>;

  /**
   * Extract a spreadsheet ID from a URL or raw ID string.
   * Static utility — does not require a connection.
   */
  extractSpreadsheetId: (urlOrId: string) => string | null;
}

// ─── Factory Function ───────────────────────────────────────────

/**
 * Create a new sheets database client bound to the given connection config.
 *
 * @example
 * ```ts
 * import { createSheetsClient } from "@/lib/sheets-db";
 *
 * const db = createSheetsClient({ token, spreadsheetId });
 * await db.ensureSchema();
 * const expenses = await db.expenses.readAll();
 * await db.batchSync(payload);
 * ```
 */
export declare function createSheetsClient(
  config: SheetsDbConfig
): SheetsDbClient;

// ─── Re-exported Types (defined in types.ts) ────────────────────

// These are listed here for completeness. The actual definitions
// live in src/lib/sheets-db/types.ts and are re-exported from index.ts.

export type {
  Expense,
  Income,
  Debt,
  DebtPayment,
  OwnerTransfer,
  PresetTransaction,
  ExpenseSource,
  ExpenseAllocation,
  MonthTotals,
  SheetIds,
} from "../types";
