/**
 * Read/write operations for the Debts and DebtPayments sheets.
 */

import type { Debt, DebtPayment } from "@/types/core";
import {
  generateId,
  parseAmount,
  normalizeDate,
  parseOwner,
  getSheetValues,
  clearRange,
  updateSheet,
} from "./api";
import { SHEET_RANGES } from "./constants";

/** Read all debts from the Debts sheet (A2:E). */
export async function readDebtsFromSheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<Debt[]> {
  const rows = await getSheetValues(accessToken, spreadsheetId, SHEET_RANGES.debtsRead, "UNFORMATTED_VALUE");
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

/** Read all debt payments from the DebtPayments sheet (A2:E). */
export async function readDebtPaymentsFromSheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<DebtPayment[]> {
  const rows = await getSheetValues(accessToken, spreadsheetId, SHEET_RANGES.debtPaymentsRead, "UNFORMATTED_VALUE");
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

/** Build the header + data rows array for debts (used by batch sync). */
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

/** Build the header + data rows array for debt payments (used by batch sync). */
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

/** Clear and rewrite the Debts sheet. */
export async function clearAndWriteDebts(
  accessToken: string,
  spreadsheetId: string,
  debts: Debt[],
): Promise<void> {
  const values = buildDebtsValues(debts);
  await clearRange(accessToken, spreadsheetId, "Debts!A1:I10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, "Debts!A1:E", values, false);
  }
}

/** Clear and rewrite the DebtPayments sheet. */
export async function clearAndWriteDebtPayments(
  accessToken: string,
  spreadsheetId: string,
  debtPayments: DebtPayment[],
): Promise<void> {
  const values = buildDebtPaymentsValues(debtPayments);
  await clearRange(accessToken, spreadsheetId, "DebtPayments!A1:E10000");
  if (values.length > 0) {
    await updateSheet(accessToken, spreadsheetId, "DebtPayments!A1:E", values, false);
  }
}
