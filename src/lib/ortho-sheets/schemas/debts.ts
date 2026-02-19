/**
 * Debt and DebtPayment schema definitions using the generic SheetSchema<T> interface.
 */

import type { SheetSchema } from "@/lib/sheets-db";
import { normalizeDate, parseAmount, generateId } from "@/lib/sheets-db";
import type { Debt, DebtPayment } from "../types";
import { parseOwner, validateDebt, validateDebtPayment } from "../normalize";
import { DEBT_FORMATTING, DEBT_PAYMENT_FORMATTING, ORTHO_HEADER_FORMAT } from "../formatting";

export const debtSchema: SheetSchema<Debt> = {
  sheetName: "Debts",
  headers: ["Id", "Name", "Initial Amount", "Start Date", "Owner"],
  readRange: "Debts!A2:E",
  writeRange: "Debts!A1:E",
  clearRange: "Debts!A1:I10000",
  appendSupported: false,

  parseRow(row) {
    const id = String(row[0] ?? "").trim();
    const name = String(row[1] ?? "").trim();
    const initialAmount = parseAmount(row[2]);
    const startDate = normalizeDate(row[3]);
    const owner = row[4] != null ? parseOwner(row[4]) : undefined;

    if (!name || initialAmount == null || initialAmount < 0) return null;
    return {
      id: id || generateId(),
      name,
      initialAmount,
      startDate: startDate ?? undefined,
      owner: owner || undefined,
    };
  },

  toRow(debt) {
    return [
      debt.id,
      debt.name,
      debt.initialAmount,
      debt.startDate ?? "",
      debt.owner ?? "",
    ];
  },

  validate: validateDebt,
  formatting: DEBT_FORMATTING,
  headerFormatting: ORTHO_HEADER_FORMAT,
};

export const debtPaymentSchema: SheetSchema<DebtPayment> = {
  sheetName: "DebtPayments",
  headers: ["Id", "Debt Id", "Date", "Amount", "Note"],
  readRange: "DebtPayments!A2:E",
  writeRange: "DebtPayments!A1:E",
  clearRange: "DebtPayments!A1:E10000",
  appendSupported: false,

  parseRow(row) {
    const id = String(row[0] ?? "").trim();
    const debtId = String(row[1] ?? "").trim();
    const date = normalizeDate(row[2]);
    const amount = parseAmount(row[3]);
    const note = String(row[4] ?? "").trim() || undefined;

    if (!debtId || !date || amount == null || amount <= 0) return null;
    return {
      id: id || generateId(),
      debtId,
      date,
      amount,
      note,
    };
  },

  toRow(payment) {
    return [
      payment.id,
      payment.debtId,
      payment.date,
      payment.amount,
      payment.note ?? "",
    ];
  },

  validate: validateDebtPayment,
  formatting: DEBT_PAYMENT_FORMATTING,
  headerFormatting: ORTHO_HEADER_FORMAT,
};
