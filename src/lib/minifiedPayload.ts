import pako from "pako";
import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  ExpenseSource,
  PresetTransaction,
} from "@/types/core";
import type {
  CategoryWithColorPayload,
  MinifiedPayloadInput,
  ExpandedPayload,
} from "@/types/payload";

export type { CategoryWithColorPayload, MinifiedPayloadInput, ExpandedPayload };

/** Omit undefined, null, and empty string from objects for smaller payload. */
function omitEmpty<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

/** Build minified payload with short keys and omitted optional fields. */
export function buildMinifiedPayload(
  expenses: Expense[],
  income: Income[],
  debts: Debt[],
  debtPayments: DebtPayment[],
  presetTransactions: PresetTransaction[],
  expenseCategoriesWithColors: CategoryWithColorPayload[],
  incomeCategoriesWithColors: CategoryWithColorPayload[],
  owners?: string[],
  cardSources?: string[],
): Record<string, unknown> {
  return {
    e: expenses.map((x) =>
      omitEmpty({
        i: x.id,
        d: x.date,
        a: x.amount,
        desc: x.description,
        c: x.category || undefined,
        s: x.source,
        o: x.owner,
      }),
    ),
    i: income.map((x) =>
      omitEmpty({
        i: x.id,
        d: x.date,
        a: x.amount,
        desc: x.description || undefined,
        c: x.category || undefined,
        o: x.owner,
      }),
    ),
    d: debts.map((x) =>
      omitEmpty({
        i: x.id,
        n: x.name,
        ia: x.initialAmount,
        sd: x.startDate,
        o: x.owner,
      }),
    ),
    dp: debtPayments.map((x) =>
      omitEmpty({
        i: x.id,
        di: x.debtId,
        d: x.date,
        a: x.amount,
        n: x.note,
      }),
    ),
    pt: presetTransactions.map((x) => ({
      i: x.id,
      s: x.source,
      desc: x.description,
      c: x.category,
      o: x.owner,
      a: x.amount,
    })),
    ec: expenseCategoriesWithColors.map((x) => ({ n: x.name, c: x.color })),
    ic: incomeCategoriesWithColors.map((x) => ({ n: x.name, c: x.color })),
    o: Array.isArray(owners) && owners.length > 0 ? owners : undefined,
    sc: Array.isArray(cardSources) && cardSources.length > 0 ? cardSources : undefined,
  };
}

/** Expand minified payload (short keys) or pass through full keys. Supports both formats. */
export function expandPayload(raw: Record<string, unknown>): ExpandedPayload {
  const arr = (key: string, short: string) =>
    (Array.isArray(raw[key]) ? raw[key] : Array.isArray(raw[short]) ? raw[short] : []) as unknown[];

  const expenses = arr("expenses", "e").map((x) => {
    const o = x as Record<string, unknown>;
    const get = (k: string, sk: string, def: unknown) => o[k] ?? o[sk] ?? def;
    return {
      id: String(get("id", "i", "")),
      date: String(get("date", "d", "")),
      amount: Number(get("amount", "a", 0)),
      description: String(get("description", "desc", "")),
      category: String(get("category", "c", "")),
      source: (get("source", "s", "manual") as ExpenseSource) || "manual",
      owner:
        (get("owner", "o", undefined) as string | undefined) ??
        (get("cardMember", "cm", undefined) as string | undefined) ??
        undefined,
    } as Expense;
  });

  const income = arr("income", "i").map((x) => {
    const o = x as Record<string, unknown>;
    const get = (k: string, sk: string, def: unknown) => o[k] ?? o[sk] ?? def;
    return {
      id: String(get("id", "i", "")),
      date: String(get("date", "d", "")),
      amount: Number(get("amount", "a", 0)),
      description: String(get("description", "desc", "Income")),
      category: String(get("category", "c", "")),
      owner: get("owner", "o", undefined) as string | undefined,
    } as Income;
  });

  const debts = arr("debts", "d").map((x) => {
    const o = x as Record<string, unknown>;
    const get = (k: string, sk: string, def: unknown) => o[k] ?? o[sk] ?? def;
    return {
      id: String(get("id", "i", "")),
      name: String(get("name", "n", "")),
      initialAmount: Number(get("initialAmount", "ia", 0)),
      startDate: get("startDate", "sd", undefined) as string | undefined,
      owner: get("owner", "o", undefined) as string | undefined,
    } as Debt;
  });

  const debtPayments = arr("debtPayments", "dp").map((x) => {
    const o = x as Record<string, unknown>;
    const get = (k: string, sk: string, def: unknown) => o[k] ?? o[sk] ?? def;
    return {
      id: String(get("id", "i", "")),
      debtId: String(get("debtId", "di", "")),
      date: String(get("date", "d", "")),
      amount: Number(get("amount", "a", 0)),
      note: get("note", "n", undefined) as string | undefined,
    } as DebtPayment;
  });

  const presetTransactions = arr("presetTransactions", "pt").map((x) => {
    const o = x as Record<string, unknown>;
    const get = (k: string, sk: string, def: unknown) => o[k] ?? o[sk] ?? def;
    return {
      id: String(get("id", "i", "")),
      source: (get("source", "s", "manual") as ExpenseSource) || "manual",
      description: String(get("description", "desc", "")),
      category: String(get("category", "c", "")),
      owner:
        String(get("owner", "o", "")) ||
        String(get("cardMember", "cm", "")),
      amount:
        get("amount", "a", undefined) == null
          ? undefined
          : Number(get("amount", "a", 0)),
    } as PresetTransaction;
  });

  const ecRaw = raw.expenseCategoriesWithColors ?? raw.ec;
  const expenseCategoriesWithColors = Array.isArray(ecRaw)
    ? (ecRaw as Record<string, unknown>[]).map((x) => ({
        name: String(x.name ?? x.n ?? ""),
        color: String(x.color ?? x.c ?? ""),
      }))
    : undefined;

  const icRaw = raw.incomeCategoriesWithColors ?? raw.ic;
  const incomeCategoriesWithColors = Array.isArray(icRaw)
    ? (icRaw as Record<string, unknown>[]).map((x) => ({
        name: String(x.name ?? x.n ?? ""),
        color: String(x.color ?? x.c ?? ""),
      }))
    : undefined;

  const cardSources = Array.isArray(raw.cardSources ?? raw.sc)
    ? (raw.cardSources ?? raw.sc) as string[]
    : undefined;
  const owners = Array.isArray(raw.owners ?? raw.o)
    ? (raw.owners ?? raw.o) as string[]
    : undefined;

  return {
    expenses,
    income,
    debts,
    debtPayments,
    presetTransactions,
    expenseCategoriesWithColors,
    incomeCategoriesWithColors,
    owners,
    cardSources,
  };
}

/** Serialize payload to V2 blob string (gzip + Base64). */
export function serializeToBlob(input: MinifiedPayloadInput): string {
  const payload = buildMinifiedPayload(
    input.expenses,
    input.income,
    input.debts,
    input.debtPayments,
    input.presetTransactions,
    input.expenseCategoriesWithColors ?? [],
    input.incomeCategoriesWithColors ?? [],
    input.owners,
    input.cardSources,
  );
  const jsonString = JSON.stringify(payload);
  const compressed = pako.gzip(new TextEncoder().encode(jsonString));
  let binary = "";
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]!);
  }
  const base64Str = btoa(binary);
  return "V2" + base64Str;
}

/** Parse V2 blob string to expanded payload. Throws if invalid. */
export function parseFromBlob(blob: string): ExpandedPayload {
  const trimmed = blob.replace(/\s/g, "").trim();
  if (!trimmed.startsWith("V2")) {
    throw new Error("Invalid blob: missing V2 prefix");
  }
  const base64Part = trimmed.slice(2);
  const binary = atob(base64Part);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decompressed = pako.ungzip(bytes, { to: "string" });
  const raw = JSON.parse(decompressed) as Record<string, unknown>;
  return expandPayload(raw);
}
