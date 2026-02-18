/**
 * Client factory for the Google Sheets database layer.
 * Creates a bound client with all repository namespaces.
 */

import type { SheetsDbConfig, SyncPayload, SheetIds, Expense, Income, Debt, DebtPayment, OwnerTransfer, PresetTransaction, MonthTotals } from "./types";
import type { TransportContext } from "./transport";
import { extractSpreadsheetId, SHEETS_API } from "./transport";
import { ALL_SHEET_TITLES } from "./schema";
import { schemaError } from "./errors";
import { readExpenses, readMortgage, writeExpenses, writeMortgage, appendExpenses } from "./expenses";
import { readIncome, writeIncome, appendIncome } from "./income";
import { readDebts, readDebtPayments, writeDebts, writeDebtPayments } from "./debts";
import { readOwnerTransfers, readPresets, writeOwnerTransfers, writePresets } from "./transfers";
import { writeTotals } from "./totals";
import { readDataBlob, writeDataBlob } from "./data-blob";
import { syncAllSheetsBatch } from "./sync";
import { getSheetIds, applyFormatting } from "./formatting";

export interface ExpenseRepository {
  readAll(): Promise<Expense[]>;
  readMortgage(): Promise<Expense[]>;
  writeAll(records: Expense[]): Promise<void>;
  writeMortgage(records: Expense[]): Promise<void>;
  append(records: Expense[]): Promise<void>;
}

export interface EntityRepository<T> {
  readAll(): Promise<T[]>;
  writeAll(records: T[]): Promise<void>;
  append(records: T[]): Promise<void>;
}

export interface TotalsRepository {
  write(months: MonthTotals[], grandTotal: MonthTotals): Promise<void>;
}

export interface DataBlobRepository {
  read(): Promise<string | null>;
  write(blob: string): Promise<void>;
}

export interface SheetsDbClient {
  expenses: ExpenseRepository;
  income: EntityRepository<Income>;
  debts: EntityRepository<Debt>;
  debtPayments: EntityRepository<DebtPayment>;
  ownerTransfers: EntityRepository<OwnerTransfer>;
  presets: EntityRepository<PresetTransaction>;
  totals: TotalsRepository;
  dataBlob: DataBlobRepository;
  batchSync(payload: SyncPayload): Promise<void>;
  ensureSchema(): Promise<void>;
  getSheetIds(): Promise<SheetIds | null>;
  applyFormatting(sheetIds: SheetIds): Promise<void>;
  extractSpreadsheetId: (urlOrId: string) => string | null;
}

export function createSheetsClient(config: SheetsDbConfig): SheetsDbClient {
  const ctx: TransportContext = {
    token: config.token,
    spreadsheetId: config.spreadsheetId,
  };

  // Write mutex: serializes all write operations
  let writeLock: Promise<void> = Promise.resolve();

  function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    const prev = writeLock;
    let resolve: () => void;
    writeLock = new Promise<void>((r) => { resolve = r; });
    return prev.then(fn).finally(() => resolve!());
  }

  return {
    expenses: {
      readAll: () => readExpenses(ctx),
      readMortgage: () => readMortgage(ctx),
      writeAll: (records) => withWriteLock(() => writeExpenses(ctx, records)),
      writeMortgage: (records) => withWriteLock(() => writeMortgage(ctx, records)),
      append: (records) => withWriteLock(() => appendExpenses(ctx, records)),
    },

    income: {
      readAll: () => readIncome(ctx),
      writeAll: (records) => withWriteLock(() => writeIncome(ctx, records)),
      append: (records) => withWriteLock(() => appendIncome(ctx, records)),
    },

    debts: {
      readAll: () => readDebts(ctx),
      writeAll: (records) => withWriteLock(() => writeDebts(ctx, records)),
      append: async () => { throw new Error("Debts append not supported"); },
    },

    debtPayments: {
      readAll: () => readDebtPayments(ctx),
      writeAll: (records) => withWriteLock(() => writeDebtPayments(ctx, records)),
      append: async () => { throw new Error("DebtPayments append not supported"); },
    },

    ownerTransfers: {
      readAll: () => readOwnerTransfers(ctx),
      writeAll: (records) => withWriteLock(() => writeOwnerTransfers(ctx, records)),
      append: async () => { throw new Error("OwnerTransfers append not supported"); },
    },

    presets: {
      readAll: () => readPresets(ctx),
      writeAll: (records) => withWriteLock(() => writePresets(ctx, records)),
      append: async () => { throw new Error("Presets append not supported"); },
    },

    totals: {
      write: (months, grandTotal) => withWriteLock(() => writeTotals(ctx, months, grandTotal)),
    },

    dataBlob: {
      read: () => readDataBlob(ctx),
      write: (blob) => withWriteLock(() => writeDataBlob(ctx, blob)),
    },

    batchSync: (payload) => withWriteLock(() => syncAllSheetsBatch(ctx, payload)),

    ensureSchema: async () => {
      const metaUrl = `${SHEETS_API}/${ctx.spreadsheetId}?fields=sheets.properties(sheetId,title)`;
      const res = await fetch(metaUrl, {
        headers: { Authorization: `Bearer ${ctx.token}` },
      });
      if (!res.ok) throw schemaError("Failed to get spreadsheet metadata");
      const data = (await res.json()) as {
        sheets?: { properties: { sheetId: number; title: string } }[];
      };
      const titles = new Set((data.sheets ?? []).map((s) => s.properties.title));
      const toAdd = ALL_SHEET_TITLES.filter((t) => !titles.has(t));
      if (toAdd.length === 0) return;

      const addRes = await fetch(`${SHEETS_API}/${ctx.spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctx.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: toAdd.map((title) => ({
            addSheet: { properties: { title } },
          })),
        }),
      });
      if (!addRes.ok) {
        const err = await addRes.text();
        throw schemaError(`Failed to add sheets: ${addRes.status} ${err}`);
      }
    },

    getSheetIds: () => getSheetIds(ctx),
    applyFormatting: (sheetIds) => applyFormatting(ctx, sheetIds),

    extractSpreadsheetId,
  };
}
