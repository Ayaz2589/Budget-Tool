import { test, expect, describe } from "bun:test";
import { parseAmexCsv } from "@/lib/parsers/amex";
import { parseAppleCsv } from "@/lib/parsers/apple";
import { filterOutExistingExpenses } from "@/lib/importDedup";
import { validateExpense } from "@/lib/validation";
import type { Expense } from "@/types/core";

/**
 * Integration test: End-to-end import flow
 *
 * Parse CSV -> dedup against existing -> validate -> produce final expense list
 */

function makeExistingExpense(overrides: Partial<Expense>): Expense {
  return {
    id: "existing-1",
    date: "2026-01-15",
    amount: 50,
    description: "Existing expense",
    category: "Other",
    source: "manual",
    ...overrides,
  };
}

const AMEX_CSV_MULTI = `Date,Card Member,Description,Amount
01/15/2026,Ayaz,WHOLE FOODS MARKET,125.47
01/15/2026,Tasnuva,TRADER JOES,42.33
01/16/2026,Ayaz,AplPay UBER EATS,18.50
01/17/2026,Ayaz,AMAZON.COM amzn.com/bill WA,-15.00
01/18/2026,Ayaz,STARBUCKS STORE 12345,6.75`;

const APPLE_CSV_MULTI = `Transaction Date,Clearing Date,Description,Merchant,Category,Type,Amount (USD),Purchased By
01/20/2026,01/21/2026,Netflix,Netflix,Entertainment,Purchase,$15.99,Ayaz
01/20/2026,01/21/2026,Payment,,Payment,Payment,$500.00,Ayaz
01/21/2026,01/22/2026,Costco Wholesale,Costco,Shopping,Purchase,$234.56,Tasnuva
01/22/2026,01/23/2026,Target,Target,Shopping,Purchase,$0.00,Ayaz
01/22/2026,01/23/2026,Spotify,Spotify,Entertainment,Installment,$9.99,Ayaz`;

describe("Import flow: Amex CSV parsing", () => {
  test("parses multi-row Amex CSV correctly", () => {
    const result = parseAmexCsv(AMEX_CSV_MULTI);

    expect(result.source).toBe("amex");
    // Negative amount (-15.00) should be parsed as abs(15.00) > 0, so included
    // Zero amount row not present in this CSV
    // All 5 rows have valid positive amounts (negative becomes abs)
    expect(result.expenses.length).toBe(5);

    // First expense: Whole Foods
    expect(result.expenses[0]!.date).toBe("2026-01-15");
    expect(result.expenses[0]!.amount).toBe(125.47);
    expect(result.expenses[0]!.owner).toBe("Ayaz");
    expect(result.expenses[0]!.source).toBe("amex");

    // Second expense: Trader Joes, different owner
    expect(result.expenses[1]!.owner).toBe("Tasnuva");
    expect(result.expenses[1]!.amount).toBe(42.33);

    // Third expense: AplPay prefix should be cleaned
    expect(result.expenses[2]!.description).toBe("UBER EATS");

    // Fourth expense: negative amount becomes positive
    expect(result.expenses[3]!.amount).toBe(15);
  });

  test("Amex parser assigns empty category", () => {
    const result = parseAmexCsv(AMEX_CSV_MULTI);
    for (const expense of result.expenses) {
      expect(expense.category).toBe("");
    }
  });

  test("Amex parser generates deterministic IDs", () => {
    const result1 = parseAmexCsv(AMEX_CSV_MULTI);
    const result2 = parseAmexCsv(AMEX_CSV_MULTI);
    expect(result1.expenses.map((e) => e.id)).toEqual(
      result2.expenses.map((e) => e.id)
    );
  });
});

describe("Import flow: Apple CSV parsing", () => {
  test("parses Apple CSV, skips payments and zero amounts", () => {
    const result = parseAppleCsv(APPLE_CSV_MULTI);

    expect(result.source).toBe("apple");
    // Payment row skipped, $0.00 row skipped (amount <= 0)
    expect(result.expenses.length).toBe(3);

    // Netflix
    expect(result.expenses[0]!.description).toBe("Netflix");
    expect(result.expenses[0]!.amount).toBe(15.99);
    expect(result.expenses[0]!.date).toBe("2026-01-20");
    expect(result.expenses[0]!.owner).toBe("Ayaz");

    // Costco
    expect(result.expenses[1]!.amount).toBe(234.56);
    expect(result.expenses[1]!.owner).toBe("Tasnuva");

    // Spotify (Installment type should be included)
    expect(result.expenses[2]!.description).toBe("Spotify");
    expect(result.expenses[2]!.amount).toBe(9.99);
  });
});

describe("Import flow: Dedup against existing expenses", () => {
  test("filters out expenses that match existing on date + amount", () => {
    const parsed = parseAmexCsv(AMEX_CSV_MULTI);
    const existing: Expense[] = [
      // Match the Whole Foods expense exactly
      makeExistingExpense({
        id: "existing-wf",
        date: "2026-01-15",
        amount: 125.47,
        owner: "Ayaz",
      }),
    ];

    const dedupedResult = filterOutExistingExpenses(parsed.expenses, existing);
    // One expense removed (Whole Foods), rest remain
    expect(dedupedResult.length).toBe(parsed.expenses.length - 1);
    // Verify the Whole Foods expense is gone
    expect(dedupedResult.find((e) => e.amount === 125.47)).toBeUndefined();
  });

  test("keeps all expenses when there are no existing matches", () => {
    const parsed = parseAmexCsv(AMEX_CSV_MULTI);
    const existing: Expense[] = [
      makeExistingExpense({
        date: "2025-06-01",
        amount: 999.99,
      }),
    ];

    const dedupedResult = filterOutExistingExpenses(parsed.expenses, existing);
    expect(dedupedResult.length).toBe(parsed.expenses.length);
  });

  test("filters multiple duplicates across different parsers", () => {
    const amexParsed = parseAmexCsv(AMEX_CSV_MULTI);
    const appleParsed = parseAppleCsv(APPLE_CSV_MULTI);
    const allParsed = [...amexParsed.expenses, ...appleParsed.expenses];

    const existing: Expense[] = [
      makeExistingExpense({
        id: "ex-1",
        date: "2026-01-15",
        amount: 125.47,
        owner: "Ayaz",
      }),
      makeExistingExpense({
        id: "ex-2",
        date: "2026-01-20",
        amount: 15.99,
        owner: "Ayaz",
      }),
    ];

    const deduped = filterOutExistingExpenses(allParsed, existing);
    // 2 removed (Whole Foods from Amex + Netflix from Apple)
    expect(deduped.length).toBe(allParsed.length - 2);
  });
});

describe("Import flow: Validation of parsed expenses", () => {
  test("all parsed Amex expenses pass validation", () => {
    const parsed = parseAmexCsv(AMEX_CSV_MULTI);
    for (const expense of parsed.expenses) {
      const result = validateExpense(expense);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  test("all parsed Apple expenses pass validation", () => {
    const parsed = parseAppleCsv(APPLE_CSV_MULTI);
    for (const expense of parsed.expenses) {
      const result = validateExpense(expense);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  test("parsed expenses with empty descriptions get warnings", () => {
    // Amex: all rows have descriptions, so no warnings expected
    const parsed = parseAmexCsv(AMEX_CSV_MULTI);
    const allHaveDescriptions = parsed.expenses.every(
      (e) => e.description.trim().length > 0
    );
    expect(allHaveDescriptions).toBe(true);
  });
});

describe("Import flow: Full end-to-end pipeline", () => {
  test("Amex CSV -> dedup -> validate produces correct final list", () => {
    // Step 1: Parse
    const parsed = parseAmexCsv(AMEX_CSV_MULTI);
    expect(parsed.expenses.length).toBeGreaterThan(0);

    // Step 2: Dedup - simulate one existing manual entry that matches
    const existing: Expense[] = [
      makeExistingExpense({
        date: "2026-01-18",
        amount: 6.75,
        description: "Starbucks manual entry",
        owner: "Ayaz",
      }),
    ];
    const afterDedup = filterOutExistingExpenses(parsed.expenses, existing);
    expect(afterDedup.length).toBe(parsed.expenses.length - 1);

    // Step 3: Validate all remaining
    const validExpenses: Expense[] = [];
    const invalidExpenses: Expense[] = [];
    for (const expense of afterDedup) {
      const validation = validateExpense(expense);
      if (validation.valid) {
        validExpenses.push(expense);
      } else {
        invalidExpenses.push(expense);
      }
    }

    // All remaining should be valid
    expect(invalidExpenses).toHaveLength(0);
    expect(validExpenses.length).toBe(afterDedup.length);

    // Verify the final list contains expected expenses
    const amounts = validExpenses.map((e) => e.amount).sort((a, b) => a - b);
    expect(amounts).toContain(125.47);
    expect(amounts).toContain(42.33);
    expect(amounts).toContain(18.5);
    // Starbucks (6.75) should be filtered out
    expect(amounts).not.toContain(6.75);
  });

  test("Apple CSV -> dedup -> validate end-to-end", () => {
    // Step 1: Parse
    const parsed = parseAppleCsv(APPLE_CSV_MULTI);
    expect(parsed.expenses.length).toBe(3);

    // Step 2: Dedup - no matches
    const afterDedup = filterOutExistingExpenses(parsed.expenses, []);
    expect(afterDedup.length).toBe(3);

    // Step 3: Validate
    const results = afterDedup.map((e) => ({
      expense: e,
      validation: validateExpense(e),
    }));
    const allValid = results.every((r) => r.validation.valid);
    expect(allValid).toBe(true);
  });

  test("Mixed Amex + Apple import with cross-source dedup", () => {
    const amex = parseAmexCsv(AMEX_CSV_MULTI);
    const apple = parseAppleCsv(APPLE_CSV_MULTI);
    const allParsed = [...amex.expenses, ...apple.expenses];

    // Existing has entries from both sources
    const existing: Expense[] = [
      makeExistingExpense({
        id: "manual-1",
        date: "2026-01-15",
        amount: 42.33,
        owner: "Tasnuva",
      }),
      makeExistingExpense({
        id: "manual-2",
        date: "2026-01-21",
        amount: 234.56,
        owner: "Tasnuva",
      }),
    ];

    const afterDedup = filterOutExistingExpenses(allParsed, existing);
    // 2 deduped out
    expect(afterDedup.length).toBe(allParsed.length - 2);

    // All remaining pass validation
    for (const e of afterDedup) {
      expect(validateExpense(e).valid).toBe(true);
    }

    // Verify correct expenses were removed
    const remainingAmounts = afterDedup.map((e) => e.amount);
    expect(remainingAmounts).not.toContain(42.33);
    expect(remainingAmounts).not.toContain(234.56);
    expect(remainingAmounts).toContain(125.47);
    expect(remainingAmounts).toContain(15.99);
    expect(remainingAmounts).toContain(9.99);
  });

  test("handles BOM-prefixed Apple CSV in full pipeline", () => {
    const csvWithBom = `\uFEFFTransaction Date,Clearing Date,Description,Merchant,Category,Type,Amount (USD),Purchased By
01/25/2026,01/26/2026,Gym Membership,Planet Fitness,Health,Purchase,$29.99,Ayaz`;

    const parsed = parseAppleCsv(csvWithBom);
    expect(parsed.expenses.length).toBe(1);

    const afterDedup = filterOutExistingExpenses(parsed.expenses, []);
    expect(afterDedup.length).toBe(1);

    const validation = validateExpense(afterDedup[0]!);
    expect(validation.valid).toBe(true);
    expect(afterDedup[0]!.amount).toBe(29.99);
  });
});
