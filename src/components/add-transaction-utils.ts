import type {
  ExpenseAllocation,
  ExpenseSource,
  PresetTransaction,
  TransactionRow,
} from "@/types";

export function createDefaultTransactionRow({
  defaultSource = "manual",
  dateValue,
}: {
  defaultSource?: ExpenseSource;
  dateValue: string;
}): TransactionRow {
  return {
    id: crypto.randomUUID(),
    entryType: "expense",
    date: dateValue,
    amount: "",
    description: "",
    category: "",
    source: defaultSource,
    owner: "",
    paidByOwner: "",
    allocationMode: "single",
    allocationOwners: [],
    allocationPercents: {},
    transferFromOwner: "",
    transferToOwner: "",
    transferNote: "",
  };
}

function parsePercentValue(raw: string): number | null {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function uniqueOwners(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function buildAllocationForRow({
  row,
  paidByOwner,
  ownerOptions,
}: {
  row: TransactionRow;
  paidByOwner: string;
  ownerOptions: string[];
}): ExpenseAllocation[] | undefined {
  if (row.allocationMode === "single") {
    const owner = (row.allocationOwners[0] || paidByOwner || "").trim();
    return owner ? [{ owner, percent: 100 }] : undefined;
  }

  if (row.allocationMode === "equal") {
    const selectedOwners = uniqueOwners(row.allocationOwners);
    const fallbackOwners = uniqueOwners(ownerOptions);
    const effectiveOwners =
      selectedOwners.length >= 2
        ? selectedOwners
        : fallbackOwners.length >= 2
          ? fallbackOwners
          : selectedOwners;
    if (effectiveOwners.length === 0) return undefined;
    const percent = 100 / effectiveOwners.length;
    return effectiveOwners.map((owner) => ({ owner, percent }));
  }

  const owners = uniqueOwners(row.allocationOwners);
  const customAllocation: ExpenseAllocation[] = [];
  for (const owner of owners) {
    const percent = parsePercentValue(row.allocationPercents[owner] ?? "");
    if (percent == null) continue;
    customAllocation.push({ owner, percent });
  }

  return customAllocation.length > 0 ? customAllocation : undefined;
}

export function sortPresetTransactionsByCategory(
  presetTransactions: PresetTransaction[],
): PresetTransaction[] {
  return [...presetTransactions].sort((a, b) => {
    const categoryA = (a.category || "").trim().toLowerCase();
    const categoryB = (b.category || "").trim().toLowerCase();
    const categoryCompare = categoryA.localeCompare(categoryB);
    if (categoryCompare !== 0) return categoryCompare;

    const descriptionA = (a.description || "").trim().toLowerCase();
    const descriptionB = (b.description || "").trim().toLowerCase();
    const descriptionCompare = descriptionA.localeCompare(descriptionB);
    if (descriptionCompare !== 0) return descriptionCompare;

    return a.id.localeCompare(b.id);
  });
}
