/**
 * OwnerTransfer and PresetTransaction schema definitions.
 */

import type { SheetSchema } from "@/lib/sheets-db";
import { normalizeDate, parseAmount, generateId } from "@/lib/sheets-db";
import type { OwnerTransfer, PresetTransaction } from "../types";
import { normalizeCategoryFromSheet, validateExpenseSource, validateOwnerTransfer, validatePresetTransaction } from "../normalize";
import { OWNER_TRANSFER_FORMATTING, PRESET_FORMATTING, ORTHO_HEADER_FORMAT } from "../formatting";

export const ownerTransferSchema: SheetSchema<OwnerTransfer> = {
  sheetName: "OwnerTransfers",
  headers: ["Id", "Date", "From Owner", "To Owner", "Amount", "Note"],
  readRange: "OwnerTransfers!A2:F",
  writeRange: "OwnerTransfers!A1:F",
  clearRange: "OwnerTransfers!A1:F10000",
  appendSupported: false,

  parseRow(row) {
    const id = String(row[0] ?? "").trim() || generateId();
    const date = normalizeDate(row[1]);
    const fromOwner = String(row[2] ?? "").trim();
    const toOwner = String(row[3] ?? "").trim();
    const amount = parseAmount(row[4]);
    const note = String(row[5] ?? "").trim() || undefined;

    if (!date || !fromOwner || !toOwner || amount == null || amount <= 0) return null;
    return { id, date, fromOwner, toOwner, amount, note };
  },

  toRow(transfer) {
    return [
      transfer.id,
      transfer.date,
      transfer.fromOwner,
      transfer.toOwner,
      transfer.amount,
      transfer.note ?? "",
    ];
  },

  validate: validateOwnerTransfer,
  formatting: OWNER_TRANSFER_FORMATTING,
  headerFormatting: ORTHO_HEADER_FORMAT,
};

export const presetSchema: SheetSchema<PresetTransaction> = {
  sheetName: "PresetTransactions",
  headers: ["Id", "Source", "Description", "Category", "Owner"],
  readRange: "PresetTransactions!A2:E",
  writeRange: "PresetTransactions!A1:E",
  clearRange: "PresetTransactions!A1:E10000",
  appendSupported: false,

  parseRow(row) {
    const id = String(row[0] ?? "").trim();
    const rawSource = String(row[1] ?? "").trim().toLowerCase();
    const description = String(row[2] ?? "").trim();
    const category = normalizeCategoryFromSheet(String(row[3] ?? ""));
    const owner = String(row[4] ?? "").trim();

    if (!id) return null;
    return {
      id,
      source: validateExpenseSource(rawSource),
      description,
      category,
      owner,
    };
  },

  toRow(preset) {
    return [
      preset.id,
      preset.source,
      preset.description,
      preset.category || "Uncategorized",
      preset.owner,
    ];
  },

  validate: validatePresetTransaction,
  formatting: PRESET_FORMATTING,
  headerFormatting: ORTHO_HEADER_FORMAT,
};
