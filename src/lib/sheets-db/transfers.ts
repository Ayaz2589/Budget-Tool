/**
 * OwnerTransfers and PresetTransactions repository for the sheets database layer.
 */

import type { OwnerTransfer, PresetTransaction } from "./types";
import type { TransportContext } from "./transport";
import { getSheetValues, clearRange, updateSheet, generateId } from "./transport";
import { SHEET_RANGES, SHEET_WRITE_RANGES } from "./schema";
import {
  parseAmount,
  normalizeDate,
  normalizeCategoryFromSheet,
  validateExpenseSource,
  validateOwnerTransfer as validateOwnerTransferRecord,
  validatePresetTransaction as validatePresetRecord,
} from "./normalize";

export async function readOwnerTransfers(ctx: TransportContext): Promise<OwnerTransfer[]> {
  const rows = await getSheetValues(ctx, SHEET_RANGES.ownerTransfersRead, "UNFORMATTED_VALUE");
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

export async function readPresets(ctx: TransportContext): Promise<PresetTransaction[]> {
  const rows = await getSheetValues(ctx, SHEET_RANGES.presetsRead, "UNFORMATTED_VALUE");
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

export async function writeOwnerTransfers(
  ctx: TransportContext,
  ownerTransfers: OwnerTransfer[],
): Promise<void> {
  for (const t of ownerTransfers) validateOwnerTransferRecord(t);
  const values = buildOwnerTransfersValues(ownerTransfers);
  await clearRange(ctx, "OwnerTransfers!A1:F10000");
  if (values.length > 0) {
    await updateSheet(ctx, SHEET_WRITE_RANGES.ownerTransfers, values, false);
  }
}

export async function writePresets(
  ctx: TransportContext,
  presetTransactions: PresetTransaction[],
): Promise<void> {
  for (const p of presetTransactions) validatePresetRecord(p);
  const values = buildPresetsValues(presetTransactions);
  await clearRange(ctx, "PresetTransactions!A1:E10000");
  if (values.length > 0) {
    await updateSheet(ctx, SHEET_WRITE_RANGES.presets, values, false);
  }
}
