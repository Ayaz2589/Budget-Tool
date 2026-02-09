import type { Expense, ExpenseAllocation } from "@/types/core";

const UNASSIGNED_OWNER_KEY = "__unassigned__";

export interface NormalizedAllocation {
  owner: string;
  amount: number;
  isUnassigned?: boolean;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function positive(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function resolveExpensePaidByOwner(expense: Expense): string | undefined {
  const paidByOwner = (expense.paidByOwner || expense.owner || "").trim();
  return paidByOwner.length > 0 ? paidByOwner : undefined;
}

function scaleAllocations(entries: NormalizedAllocation[], total: number): NormalizedAllocation[] {
  if (entries.length === 0) return entries;
  const sum = entries.reduce((acc, item) => acc + item.amount, 0);
  if (sum <= 0) return entries;
  const ratio = total / sum;
  const scaled = entries.map((item) => ({
    ...item,
    amount: round2(item.amount * ratio),
  }));
  const diff = round2(total - scaled.reduce((acc, item) => acc + item.amount, 0));
  if (diff !== 0) {
    const last = scaled[scaled.length - 1]!;
    last.amount = round2(last.amount + diff);
  }
  return scaled;
}

function normalizeExplicitAllocation(
  allocation: ExpenseAllocation[],
  amount: number,
): NormalizedAllocation[] {
  const normalized = allocation
    .map((entry) => ({
      owner: (entry.owner || "").trim(),
      amount: positive(entry.amount),
      percent: positive(entry.percent),
    }))
    .filter((entry) => entry.owner.length > 0);

  if (normalized.length === 0) return [];

  const fixedAmount = normalized.reduce((acc, entry) => acc + entry.amount, 0);
  const percentTotal = normalized.reduce((acc, entry) => acc + entry.percent, 0);
  const remaining = Math.max(0, amount - fixedAmount);

  const rows = normalized.map((entry) => {
    if (entry.amount > 0) {
      return { owner: entry.owner, amount: entry.amount };
    }
    if (percentTotal > 0 && entry.percent > 0) {
      return {
        owner: entry.owner,
        amount: (remaining * entry.percent) / percentTotal,
      };
    }
    return { owner: entry.owner, amount: 0 };
  });

  const positiveRows = rows.filter((row) => row.amount > 0);
  return scaleAllocations(positiveRows, amount);
}

export function normalizeExpenseAllocation(
  expense: Expense,
  owners: string[],
): NormalizedAllocation[] {
  const totalAmount = positive(expense.amount);
  if (totalAmount <= 0) return [];

  const explicitAllocation = Array.isArray(expense.allocation)
    ? normalizeExplicitAllocation(expense.allocation, totalAmount)
    : [];
  const allocationMode = expense.allocationMode;
  if (explicitAllocation.length > 0) {
    // Guard against older buggy records where equal split was saved with a single explicit owner.
    if (!(allocationMode === "equal" && explicitAllocation.length < 2 && owners.length >= 2)) {
      return explicitAllocation;
    }
  }

  const paidByOwner = resolveExpensePaidByOwner(expense);
  const category = (expense.category || "").trim().toLowerCase();

  if (allocationMode === "equal") {
    const equalOwners = owners.map((owner) => owner.trim()).filter(Boolean);
    if (equalOwners.length >= 2) {
      const perOwnerAmount = round2(totalAmount / equalOwners.length);
      const rows = equalOwners.map((owner) => ({ owner, amount: perOwnerAmount }));
      return scaleAllocations(rows, totalAmount);
    }
  }

  if (category === "50/50" && owners.length >= 2) {
    const first = owners[0]!;
    const second = owners[1]!;
    return [
      { owner: first, amount: round2(totalAmount / 2) },
      { owner: second, amount: round2(totalAmount / 2) },
    ];
  }

  if (category === "tasnuva's purchases") {
    const tasnuvaOwner = owners.find((owner) => owner.trim().toLowerCase() === "tasnuva");
    if (tasnuvaOwner) {
      return [{ owner: tasnuvaOwner, amount: totalAmount }];
    }
  }

  if (paidByOwner) {
    return [{ owner: paidByOwner, amount: totalAmount }];
  }

  return [{ owner: UNASSIGNED_OWNER_KEY, amount: totalAmount, isUnassigned: true }];
}

export function isSharedExpenseByAllocation(entries: NormalizedAllocation[]): boolean {
  const participatingOwners = new Set(
    entries.filter((entry) => !entry.isUnassigned).map((entry) => entry.owner),
  );
  return participatingOwners.size > 1;
}
