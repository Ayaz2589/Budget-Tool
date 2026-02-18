/**
 * Debts and DebtPayments repository for the sheets database layer.
 */

import type { Debt, DebtPayment } from "./types";
import type { TransportContext } from "./transport";
import { getSheetValues, clearRange, updateSheet, generateId } from "./transport";
import { SHEET_RANGES, SHEET_WRITE_RANGES } from "./schema";
import { parseAmount, normalizeDate, parseOwner, validateDebt as validateDebtRecord, validateDebtPayment as validateDebtPaymentRecord } from "./normalize";

export async function readDebts(ctx: TransportContext): Promise<Debt[]> {
  const rows = await getSheetValues(ctx, SHEET_RANGES.debtsRead, "UNFORMATTED_VALUE");
  const debts: Debt[] = [];

  for (const row of rows) {
    const id = String(row[0] ?? "").trim();
    const name = String(row[1] ?? "").trim();
    const initialAmount = parseAmount(row[2]);
    const startDate = normalizeDate(row[3]);
    const owner = row[4] != null ? parseOwner(row[4]) : undefined;

    if (!name || initialAmount == null || initialAmount < 0) continue;
    debts.push({
      id: id || generateId(),
      name,
      initialAmount,
      startDate: startDate ?? undefined,
      owner: owner || undefined,
    });
  }

  return debts;
}

export async function readDebtPayments(ctx: TransportContext): Promise<DebtPayment[]> {
  const rows = await getSheetValues(ctx, SHEET_RANGES.debtPaymentsRead, "UNFORMATTED_VALUE");
  const payments: DebtPayment[] = [];

  for (const row of rows) {
    const id = String(row[0] ?? "").trim();
    const debtId = String(row[1] ?? "").trim();
    const date = normalizeDate(row[2]);
    const amount = parseAmount(row[3]);
    const note = String(row[4] ?? "").trim() || undefined;

    if (!debtId || !date || amount == null || amount <= 0) continue;
    payments.push({
      id: id || generateId(),
      debtId,
      date,
      amount,
      note,
    });
  }

  return payments;
}

export function buildDebtsValues(debts: Debt[]): unknown[][] {
  const headers = [["Id", "Name", "Initial Amount", "Start Date", "Owner"]];
  const rows = debts.map((d) => [
    d.id,
    d.name,
    d.initialAmount,
    d.startDate ?? "",
    d.owner ?? "",
  ]);
  return [...headers, ...rows];
}

export function buildDebtPaymentsValues(debtPayments: DebtPayment[]): unknown[][] {
  const headers = [["Id", "Debt Id", "Date", "Amount", "Note"]];
  const rows = debtPayments.map((p) => [
    p.id,
    p.debtId,
    p.date,
    p.amount,
    p.note ?? "",
  ]);
  return [...headers, ...rows];
}

export async function writeDebts(
  ctx: TransportContext,
  debts: Debt[],
): Promise<void> {
  for (const d of debts) validateDebtRecord(d);
  const values = buildDebtsValues(debts);
  await clearRange(ctx, "Debts!A1:I10000");
  if (values.length > 0) {
    await updateSheet(ctx, SHEET_WRITE_RANGES.debts, values, false);
  }
}

export async function writeDebtPayments(
  ctx: TransportContext,
  debtPayments: DebtPayment[],
): Promise<void> {
  for (const p of debtPayments) validateDebtPaymentRecord(p);
  const values = buildDebtPaymentsValues(debtPayments);
  await clearRange(ctx, "DebtPayments!A1:E10000");
  if (values.length > 0) {
    await updateSheet(ctx, SHEET_WRITE_RANGES.debtPayments, values, false);
  }
}
