import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  OwnerTransfer,
} from "@/types/core";
import { normalizeExpenseAllocation } from "@/lib/ownerAccounting";

export type FinancialViewMode = "household" | "individual";

export interface ScopeFinancialDataArgs {
  viewMode: FinancialViewMode;
  selectedOwner: string;
  owners: string[];
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  ownerTransfers: OwnerTransfer[];
}

export interface ScopedFinancialData {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  ownerTransfers: OwnerTransfer[];
}

function normalizeOwnerName(value: string | undefined): string {
  return (value || "").trim();
}

function hasOwner(owner: string, selectedOwner: string): boolean {
  return normalizeOwnerName(owner) === normalizeOwnerName(selectedOwner);
}

export function collectFinancialOwners(args: {
  owners: string[];
  expenses: Expense[];
  income: Income[];
  debts?: Debt[];
  ownerTransfers: OwnerTransfer[];
}): string[] {
  const ownerSet = new Set<string>();
  args.owners.forEach((owner) => {
    const next = normalizeOwnerName(owner);
    if (next) ownerSet.add(next);
  });

  args.expenses.forEach((expense) => {
    const owner = normalizeOwnerName(expense.owner);
    const paidByOwner = normalizeOwnerName(expense.paidByOwner);
    if (owner) ownerSet.add(owner);
    if (paidByOwner) ownerSet.add(paidByOwner);
    expense.allocation?.forEach((entry) => {
      const allocationOwner = normalizeOwnerName(entry.owner);
      if (allocationOwner) ownerSet.add(allocationOwner);
    });
  });

  args.income.forEach((row) => {
    const owner = normalizeOwnerName(row.owner);
    if (owner) ownerSet.add(owner);
  });

  (args.debts ?? []).forEach((debt) => {
    const owner = normalizeOwnerName(debt.owner);
    if (owner) ownerSet.add(owner);
  });

  args.ownerTransfers.forEach((row) => {
    const fromOwner = normalizeOwnerName(row.fromOwner);
    const toOwner = normalizeOwnerName(row.toOwner);
    if (fromOwner) ownerSet.add(fromOwner);
    if (toOwner) ownerSet.add(toOwner);
  });

  return Array.from(ownerSet).sort((a, b) => a.localeCompare(b));
}

export function getOwnerAllocatedExpenseAmount(args: {
  expense: Expense;
  selectedOwner: string;
  owners: string[];
}): number {
  const { expense, selectedOwner, owners } = args;
  if (!selectedOwner) return 0;
  return normalizeExpenseAllocation(expense, owners).reduce((sum, entry) => {
    if (entry.isUnassigned || !hasOwner(entry.owner, selectedOwner)) return sum;
    return sum + entry.amount;
  }, 0);
}

export function toOwnerScopedExpense(args: {
  expense: Expense;
  selectedOwner: string;
  owners: string[];
}): Expense | null {
  const { expense, selectedOwner, owners } = args;
  const allocatedAmount = getOwnerAllocatedExpenseAmount({
    expense,
    selectedOwner,
    owners,
  });
  if (allocatedAmount <= 0) return null;
  return {
    ...expense,
    amount: allocatedAmount,
    owner: selectedOwner,
    paidByOwner: selectedOwner,
    allocationMode: "single",
    allocation: undefined,
  };
}

export function scopeExpensesToOwner(args: {
  expenses: Expense[];
  selectedOwner: string;
  owners: string[];
}): Expense[] {
  const { expenses, selectedOwner, owners } = args;
  if (!selectedOwner) return [];
  const rows: Expense[] = [];
  for (const expense of expenses) {
    const scoped = toOwnerScopedExpense({
      expense,
      selectedOwner,
      owners,
    });
    if (scoped) rows.push(scoped);
  }
  return rows;
}

export function getSignedOwnerTransferAmount(args: {
  transfer: OwnerTransfer;
  selectedOwner: string;
}): number | null {
  const { transfer, selectedOwner } = args;
  if (!selectedOwner) return null;
  if (hasOwner(transfer.fromOwner, selectedOwner)) return transfer.amount;
  if (hasOwner(transfer.toOwner, selectedOwner)) return -transfer.amount;
  return null;
}

export function scopeFinancialData(args: ScopeFinancialDataArgs): ScopedFinancialData {
  const {
    viewMode,
    selectedOwner,
    owners,
    expenses,
    income,
    debts,
    debtPayments,
    ownerTransfers,
  } = args;

  if (viewMode === "household") {
    return {
      expenses,
      income,
      debts,
      debtPayments,
      ownerTransfers,
    };
  }

  const scopedExpenses = scopeExpensesToOwner({
    expenses,
    selectedOwner,
    owners,
  });

  const scopedIncome = income.filter((row) => hasOwner(row.owner || "", selectedOwner));
  const scopedDebts = debts.filter((row) => hasOwner(row.owner || "", selectedOwner));
  const ownerDebtIds = new Set(scopedDebts.map((row) => row.id));
  const scopedDebtPayments = debtPayments.filter((row) => ownerDebtIds.has(row.debtId));
  const scopedTransfers = ownerTransfers.filter(
    (row) => hasOwner(row.fromOwner, selectedOwner) || hasOwner(row.toOwner, selectedOwner),
  );

  return {
    expenses: scopedExpenses,
    income: scopedIncome,
    debts: scopedDebts,
    debtPayments: scopedDebtPayments,
    ownerTransfers: scopedTransfers,
  };
}

