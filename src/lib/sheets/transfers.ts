/**
 * Read/write operations for the OwnerTransfers and PresetTransactions sheets.
 */

import type { OwnerTransfer, PresetTransaction } from "@/types/core";
import {
  generateId,
  parseAmount,
  normalizeDate,
  normalizeCategoryFromSheet,
  getSheetValues,
  clearRange,
  updateSheet,
} from "./api";
import { SHEET_RANGES } from "./constants";
import { validateExpenseSource } from "./validate";

/** Read all owner transfers from the OwnerTransfers sheet (A2:F). */
export async function readOwnerTransfersFromSheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<OwnerTransfer[]> {
  const rows = await getSheetValues(accessToken, spreadsheetId, SHEET_RANGES.ownerTransfersRead, "UNFORMATTED_VALUE");
  const transfers: OwnerTransfer[] = [];

  for (const row of rows) {
    const id = String(row[0] ?? "").trim() || generateId();
    const date = normalizeDate(row[1]);
    const fromOwner = String(row[2] ?? "").trim();
    const toOwner = String(row[3] ?? "").trim();
    const amount = parseAmount(row[4]);
    const note = String(row[5] ?? "").trim() || undefined;

    if (!date || !fromOwner || !toOwner || amount == null || amount <= 0) continue;
    transfers.push({ id, date, fromOwner, toOwner, amount, note });
  }

  return transfers;
}

/** Read all preset transactions from the PresetTransactions sheet (A2:E). */
export async function readPresetsFromSheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<PresetTransaction[]> {
  const rows = await getSheetValues(accessToken, spreadsheetId, SHEET_RANGES.presetsRead, "UNFORMATTED_VALUE");
  const presets: PresetTransaction[] = [];

  for (const row of rows) {
    const id = String(row[0] ?? "").trim();
    const rawSource = String(row[1] ?? "").trim().toLowerCase();
    const description = String(row[2] ?? "").trim();
    const category = normalizeCategoryFromSheet(String(row[3] ?? ""));
    const owner = String(row[4] ?? "").trim();

    if (!id) continue;
    presets.push({
      id,
      source: validateExpenseSource(rawSource),
      description,
      category,
      owner,
    });
  }

  return presets;
}

/** Build the header + data rows array for owner transfers (used by batch sync). */
export function buildOwnerTransfersValues(ownerTransfers: OwnerTransfer[]): unknown[][] {
  const headers = [["Id", "Date", "From Owner", "To Owner", "Amount", "Note"]];
  const rows = ownerTransfers.map((t) => [
    t.id,
    t.date,
    t.fromOwner,
    t.toOwner,
    t.amount,
    t.note ?? "",
  ]);
  return [...headers, ...rows];
}

/** Build the header + data rows array for preset transactions (used by batch sync). */
export function buildPresetsValues(presetTransactions: PresetTransaction[]): unknown[][] {
  const headers = [["Id", "Source", "Description", "Category", "Owner"]];
  const rows = presetTransactions.map((p) => [
    p.id,
    p.source,
    p.description,
    p.category || "Uncategorized",
    p.owner,
  ]);
  return [...headers, ...rows];
}

/** Clear and rewrite the PresetTransactions sheet. */
export async function clearAndWritePresets(
  accessToken: string,
  spreadsheetId: string,
  presetTransactions: PresetTransaction[],
): Promise<void> {
  const values = buildPresetsValues(presetTransactions);
  await clearRange(accessToken, spreadsheetId, "PresetTransactions!A1:E10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, "PresetTransactions!A1:E", values, false);
  }
}
