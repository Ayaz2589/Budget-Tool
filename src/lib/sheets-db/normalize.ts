/**
 * Data normalization and parsing utilities for the sheets database layer.
 * Consolidates date repair, category normalization, source validation,
 * and legacy format detection.
 */

import type { ExpenseSource, Expense, Income, Debt, DebtPayment, OwnerTransfer, PresetTransaction } from "./types";
import { ALL_EXPENSE_SOURCES } from "./types";
import { validationError } from "./errors";
import type { ValidationIssue } from "./errors";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(date: string): boolean {
  return ISO_DATE_PATTERN.test(date);
}

function serialToIsoDate(serial: number): string {
  const epoch = new Date(1899, 11, 30).getTime();
  const ms = serial * 86400000 + epoch;
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function tryRepairDate(value: string): string | null {
  if (ISO_DATE_PATTERN.test(value.trim())) return value.trim();
  const num = parseFloat(value.replace(/[$,\s]/g, ""));
  if (!Number.isNaN(num) && num > 0 && num < 1000000) {
    return serialToIsoDate(num);
  }
  return null;
}

export function normalizeDate(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (ISO_DATE_PATTERN.test(s)) return s;
  return tryRepairDate(s);
}

export function looksLikeIsoDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value.trim());
}

export function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const s = String(value ?? "").replace(/[$,\s]/g, "");
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

export function normalizeCategoryFromSheet(value: string): string {
  const t = value.trim();
  if (!t || t.toLowerCase() === "uncategorized") return "";
  return t;
}

export function parseOwner(value: unknown): string {
  return String(value ?? "").trim();
}

export function validateExpenseSource(rawSource: string): ExpenseSource {
  const lower = rawSource.trim().toLowerCase();
  return ALL_EXPENSE_SOURCES.includes(lower as ExpenseSource)
    ? (lower as ExpenseSource)
    : "manual";
}

export function hasIdColumn(
  row: unknown[],
  minLength: number,
  looksLikeDate: (v: string) => boolean,
): boolean {
  const first = String(row[0] ?? "").trim();
  return row.length >= minLength && first.length > 0 && !looksLikeDate(first);
}

export function findMissingHeaders(
  actualHeaders: string[],
  requiredHeaders: string[],
): string[] {
  const normalized = new Set(actualHeaders.map((h) => h.trim().toLowerCase()));
  return requiredHeaders.filter((h) => !normalized.has(h.toLowerCase()));
}

// ─── Write-side validation ─────────────────────────────────────

function throwIfIssues(entityName: string, issues: ValidationIssue[]): void {
  if (issues.length > 0) {
    throw validationError(`Invalid ${entityName}: ${issues.map((i) => i.message).join(", ")}`, issues);
  }
}

export function validateExpense(expense: Expense): void {
  const issues: ValidationIssue[] = [];
  if (!expense.id || !expense.id.trim()) {
    issues.push({ field: "id", message: "id is required", value: expense.id });
  }
  if (!isValidDate(expense.date)) {
    issues.push({ field: "date", message: "date must be a valid ISO date (YYYY-MM-DD)", value: expense.date });
  }
  if (!Number.isFinite(expense.amount) || expense.amount <= 0) {
    issues.push({ field: "amount", message: "amount must be a positive finite number", value: expense.amount });
  }
  throwIfIssues("Expense", issues);
}

export function validateIncome(income: Income): void {
  const issues: ValidationIssue[] = [];
  if (!income.id || !income.id.trim()) {
    issues.push({ field: "id", message: "id is required", value: income.id });
  }
  if (!isValidDate(income.date)) {
    issues.push({ field: "date", message: "date must be a valid ISO date (YYYY-MM-DD)", value: income.date });
  }
  if (!Number.isFinite(income.amount) || income.amount <= 0) {
    issues.push({ field: "amount", message: "amount must be a positive finite number", value: income.amount });
  }
  throwIfIssues("Income", issues);
}

export function validateDebt(debt: Debt): void {
  const issues: ValidationIssue[] = [];
  if (!debt.id || !debt.id.trim()) {
    issues.push({ field: "id", message: "id is required", value: debt.id });
  }
  if (!debt.name || !debt.name.trim()) {
    issues.push({ field: "name", message: "name is required", value: debt.name });
  }
  if (!Number.isFinite(debt.initialAmount) || debt.initialAmount <= 0) {
    issues.push({ field: "initialAmount", message: "initialAmount must be a positive finite number", value: debt.initialAmount });
  }
  throwIfIssues("Debt", issues);
}

export function validateDebtPayment(payment: DebtPayment): void {
  const issues: ValidationIssue[] = [];
  if (!payment.id || !payment.id.trim()) {
    issues.push({ field: "id", message: "id is required", value: payment.id });
  }
  if (!payment.debtId || !payment.debtId.trim()) {
    issues.push({ field: "debtId", message: "debtId is required", value: payment.debtId });
  }
  if (!isValidDate(payment.date)) {
    issues.push({ field: "date", message: "date must be a valid ISO date (YYYY-MM-DD)", value: payment.date });
  }
  if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
    issues.push({ field: "amount", message: "amount must be a positive finite number", value: payment.amount });
  }
  throwIfIssues("DebtPayment", issues);
}

export function validateOwnerTransfer(transfer: OwnerTransfer): void {
  const issues: ValidationIssue[] = [];
  if (!transfer.id || !transfer.id.trim()) {
    issues.push({ field: "id", message: "id is required", value: transfer.id });
  }
  if (!transfer.fromOwner || !transfer.fromOwner.trim()) {
    issues.push({ field: "fromOwner", message: "fromOwner is required", value: transfer.fromOwner });
  }
  if (!transfer.toOwner || !transfer.toOwner.trim()) {
    issues.push({ field: "toOwner", message: "toOwner is required", value: transfer.toOwner });
  }
  if (transfer.fromOwner && transfer.toOwner && transfer.fromOwner.trim() === transfer.toOwner.trim()) {
    issues.push({ field: "toOwner", message: "fromOwner and toOwner must be different", value: transfer.toOwner });
  }
  if (!isValidDate(transfer.date)) {
    issues.push({ field: "date", message: "date must be a valid ISO date (YYYY-MM-DD)", value: transfer.date });
  }
  if (!Number.isFinite(transfer.amount) || transfer.amount <= 0) {
    issues.push({ field: "amount", message: "amount must be a positive finite number", value: transfer.amount });
  }
  throwIfIssues("OwnerTransfer", issues);
}

export function validatePresetTransaction(preset: PresetTransaction): void {
  const issues: ValidationIssue[] = [];
  if (!preset.id || !preset.id.trim()) {
    issues.push({ field: "id", message: "id is required", value: preset.id });
  }
  throwIfIssues("PresetTransaction", issues);
}
