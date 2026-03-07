import { test, expect, describe } from "bun:test";
import { validateExpenseSource, IncomeModel } from "@/lib/sheets/models";
import { hasIdColumn, findMissingHeaders } from "genjutsu-db";

describe("validateExpenseSource", () => {
  test("returns valid source for all known sources", () => {
    const validSources = [
      "amex",
      "amex-gold",
      "apple",
      "visa",
      "sapphire",
      "bank-of-america",
      "wells-fargo",
      "chase",
      "manual",
      "td",
    ];

    for (const source of validSources) {
      expect(validateExpenseSource(source)).toBe(source);
    }
  });

  test("handles uppercase input", () => {
    expect(validateExpenseSource("AMEX")).toBe("amex");
    expect(validateExpenseSource("Apple")).toBe("apple");
    expect(validateExpenseSource("CHASE")).toBe("chase");
  });

  test("handles mixed case input", () => {
    expect(validateExpenseSource("Amex-Gold")).toBe("amex-gold");
    expect(validateExpenseSource("Bank-Of-America")).toBe("bank-of-america");
    expect(validateExpenseSource("Wells-Fargo")).toBe("wells-fargo");
  });

  test("trims whitespace", () => {
    expect(validateExpenseSource("  amex  ")).toBe("amex");
    expect(validateExpenseSource("\tchase\n")).toBe("chase");
  });

  test("falls back to manual for unknown sources", () => {
    expect(validateExpenseSource("unknown")).toBe("manual");
    expect(validateExpenseSource("paypal")).toBe("manual");
    expect(validateExpenseSource("crypto")).toBe("manual");
    expect(validateExpenseSource("")).toBe("manual");
  });

  test("falls back to manual for garbage input", () => {
    expect(validateExpenseSource("123")).toBe("manual");
    expect(validateExpenseSource("!@#$%")).toBe("manual");
    expect(validateExpenseSource("   ")).toBe("manual");
  });
});

describe("IncomeModel primary key", () => {
  test("uses id as primary key, not date", () => {
    const fields = IncomeModel.fields;
    const fieldNames = fields.map((f: { name: string }) => f.name);
    expect(fieldNames).toContain("id");
    const idField = fields.find((f: { name: string }) => f.name === "id");
    expect(idField?.isPrimaryKey).toBe(true);
  });

  test("id is the first field", () => {
    const firstField = IncomeModel.fields[0];
    expect(firstField.name).toBe("id");
  });
});

describe("hasIdColumn", () => {
  const looksLikeDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

  test("returns true when first column is an ID (not a date)", () => {
    const row = ["abc-123", "2026-01-15", "100", "Coffee"];
    expect(hasIdColumn(row, 4, looksLikeDate)).toBe(true);
  });

  test("returns false when first column is a date (legacy format)", () => {
    const row = ["2026-01-15", "100", "Coffee", "Other"];
    expect(hasIdColumn(row, 4, looksLikeDate)).toBe(false);
  });

  test("returns false when row is shorter than minLength", () => {
    const row = ["abc-123", "100"];
    expect(hasIdColumn(row, 4, looksLikeDate)).toBe(false);
  });

  test("returns false when first column is empty", () => {
    const row = ["", "2026-01-15", "100", "Coffee"];
    expect(hasIdColumn(row, 4, looksLikeDate)).toBe(false);
  });

  test("returns true when first column is a hash-style ID", () => {
    const row = ["amex-k47fg", "2026-01-15", "50.00", "Groceries", "amex"];
    expect(hasIdColumn(row, 4, looksLikeDate)).toBe(true);
  });

  test("handles row with exactly minLength columns", () => {
    const row = ["id-1", "data1", "data2"];
    expect(hasIdColumn(row, 3, looksLikeDate)).toBe(true);
  });

  test("handles row with more than minLength columns", () => {
    const row = ["id-1", "data1", "data2", "data3", "data4"];
    expect(hasIdColumn(row, 3, looksLikeDate)).toBe(true);
  });

  test("handles numeric first column that is not a date", () => {
    const row = ["12345", "2026-01-15", "100", "Coffee"];
    expect(hasIdColumn(row, 4, looksLikeDate)).toBe(true);
  });
});

describe("findMissingHeaders", () => {
  test("returns empty when all required headers present", () => {
    const actual = ["Date", "Amount", "Description", "Source"];
    const required = ["date", "amount", "description"];
    expect(findMissingHeaders(actual, required)).toEqual([]);
  });

  test("returns missing header names", () => {
    const actual = ["Date", "Amount"];
    const required = ["date", "amount", "description", "source"];
    const missing = findMissingHeaders(actual, required);
    expect(missing).toEqual(["description", "source"]);
  });

  test("comparison is case-insensitive", () => {
    const actual = ["DATE", "AMOUNT", "DESCRIPTION"];
    const required = ["date", "amount", "description"];
    expect(findMissingHeaders(actual, required)).toEqual([]);
  });

  test("trims whitespace from actual headers", () => {
    const actual = ["  Date  ", "  Amount  ", " Description "];
    const required = ["date", "amount", "description"];
    expect(findMissingHeaders(actual, required)).toEqual([]);
  });

  test("returns all required when actual is empty", () => {
    const required = ["date", "amount", "description"];
    expect(findMissingHeaders([], required)).toEqual(required);
  });

  test("returns empty when required is empty", () => {
    const actual = ["Date", "Amount"];
    expect(findMissingHeaders(actual, [])).toEqual([]);
  });

  test("both empty returns empty", () => {
    expect(findMissingHeaders([], [])).toEqual([]);
  });

  test("extra actual headers are ignored", () => {
    const actual = ["Date", "Amount", "Description", "Extra1", "Extra2"];
    const required = ["date", "amount"];
    expect(findMissingHeaders(actual, required)).toEqual([]);
  });

  test("duplicate actual headers are handled correctly", () => {
    const actual = ["Date", "Date", "Amount"];
    const required = ["date", "amount", "description"];
    const missing = findMissingHeaders(actual, required);
    expect(missing).toEqual(["description"]);
  });
});
