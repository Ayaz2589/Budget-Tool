import { test, expect, describe } from "bun:test";
import { validateExpense, validateIncome } from "@/lib/domain/validation";

describe("validateExpense", () => {
  test("valid expense passes", () => {
    const result = validateExpense({
      amount: 25.5,
      date: "2025-01-15",
      description: "Coffee",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test("missing amount is invalid", () => {
    const result = validateExpense({ date: "2025-01-15", description: "X" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount is required");
  });

  test("zero amount is invalid", () => {
    const result = validateExpense({
      amount: 0,
      date: "2025-01-15",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount must be greater than 0");
  });

  test("negative amount is invalid", () => {
    const result = validateExpense({
      amount: -5,
      date: "2025-01-15",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount must be greater than 0");
  });

  test("Infinity amount is invalid", () => {
    const result = validateExpense({
      amount: Infinity,
      date: "2025-01-15",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount must be a finite number");
  });

  test("NaN amount is invalid", () => {
    const result = validateExpense({
      amount: NaN,
      date: "2025-01-15",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount must be a finite number");
  });

  test("missing date is invalid", () => {
    const result = validateExpense({ amount: 10, description: "X" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("date is required");
  });

  test("non-ISO date string is invalid", () => {
    const result = validateExpense({
      amount: 10,
      date: "01/15/2025",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "date must be a valid ISO date string (YYYY-MM-DD)"
    );
  });

  test("invalid calendar date is rejected", () => {
    const result = validateExpense({
      amount: 10,
      date: "2025-02-30",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "date must be a valid ISO date string (YYYY-MM-DD)"
    );
  });

  test("empty description produces warning but still valid", () => {
    const result = validateExpense({
      amount: 10,
      date: "2025-01-15",
      description: "",
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain("description should not be empty");
  });

  test("missing description produces warning but still valid", () => {
    const result = validateExpense({ amount: 10, date: "2025-01-15" });
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain("description should not be empty");
  });

  test("allocation percentages summing to 100 is valid", () => {
    const result = validateExpense({
      amount: 100,
      date: "2025-01-15",
      description: "Shared",
      allocation: [
        { owner: "A", percent: 50 },
        { owner: "B", percent: 50 },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("allocation percentages not summing to ~100 is invalid", () => {
    const result = validateExpense({
      amount: 100,
      date: "2025-01-15",
      description: "Shared",
      allocation: [
        { owner: "A", percent: 30 },
        { owner: "B", percent: 30 },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("allocation percentages"))).toBe(
      true
    );
  });

  test("allocation percentages within 0.5 of 100 are acceptable", () => {
    const result = validateExpense({
      amount: 100,
      date: "2025-01-15",
      description: "Shared",
      allocation: [
        { owner: "A", percent: 33.33 },
        { owner: "B", percent: 33.33 },
        { owner: "C", percent: 33.34 },
      ],
    });
    expect(result.valid).toBe(true);
  });

  test("multiple errors are returned together", () => {
    const result = validateExpense({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  test("13th month date is invalid", () => {
    const result = validateExpense({
      amount: 10,
      date: "2025-13-01",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "date must be a valid ISO date string (YYYY-MM-DD)"
    );
  });

  test("month 00 date is invalid", () => {
    const result = validateExpense({
      amount: 10,
      date: "2025-00-15",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "date must be a valid ISO date string (YYYY-MM-DD)"
    );
  });

  test("day 00 date is invalid", () => {
    const result = validateExpense({
      amount: 10,
      date: "2025-01-00",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "date must be a valid ISO date string (YYYY-MM-DD)"
    );
  });

  test("Feb 29 on non-leap year is invalid", () => {
    const result = validateExpense({
      amount: 10,
      date: "2025-02-29",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "date must be a valid ISO date string (YYYY-MM-DD)"
    );
  });

  test("Feb 29 on leap year is valid", () => {
    const result = validateExpense({
      amount: 10,
      date: "2024-02-29",
      description: "X",
    });
    expect(result.valid).toBe(true);
  });

  test("extremely large amount is still valid", () => {
    const result = validateExpense({
      amount: 999999999.99,
      date: "2025-01-15",
      description: "Big purchase",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("very small positive amount is valid", () => {
    const result = validateExpense({
      amount: 0.01,
      date: "2025-01-15",
      description: "Penny",
    });
    expect(result.valid).toBe(true);
  });

  test("-Infinity amount is invalid", () => {
    const result = validateExpense({
      amount: -Infinity,
      date: "2025-01-15",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount must be a finite number");
  });

  test("special characters in description are valid", () => {
    const result = validateExpense({
      amount: 10,
      date: "2025-01-15",
      description: "Caf\u00e9 & Boulangerie - 50% off! @store #123",
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  test("unicode characters in description are valid", () => {
    const result = validateExpense({
      amount: 10,
      date: "2025-01-15",
      description: "\u6771\u4eac\u30e9\u30fc\u30e1\u30f3",
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  test("empty string date is invalid", () => {
    const result = validateExpense({
      amount: 10,
      date: "",
      description: "X",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("date is required");
  });

  test("allocation with empty array is valid", () => {
    const result = validateExpense({
      amount: 50,
      date: "2025-01-15",
      description: "X",
      allocation: [],
    });
    expect(result.valid).toBe(true);
  });

  test("allocation percentages slightly over 100.5 is invalid", () => {
    const result = validateExpense({
      amount: 100,
      date: "2025-01-15",
      description: "Shared",
      allocation: [
        { owner: "A", percent: 51 },
        { owner: "B", percent: 50 },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("allocation percentages"))).toBe(
      true
    );
  });

  test("allocation percentages at exactly 99.5 boundary is valid", () => {
    const result = validateExpense({
      amount: 100,
      date: "2025-01-15",
      description: "Shared",
      allocation: [
        { owner: "A", percent: 49.75 },
        { owner: "B", percent: 49.75 },
      ],
    });
    // 49.75 + 49.75 = 99.5, |99.5 - 100| = 0.5, within tolerance
    expect(result.valid).toBe(true);
  });

  test("allocation percentages at exactly 100.5 boundary is valid", () => {
    const result = validateExpense({
      amount: 100,
      date: "2025-01-15",
      description: "Shared",
      allocation: [
        { owner: "A", percent: 50.25 },
        { owner: "B", percent: 50.25 },
      ],
    });
    // 50.25 + 50.25 = 100.5, |100.5 - 100| = 0.5, within tolerance
    expect(result.valid).toBe(true);
  });
});

describe("validateIncome", () => {
  test("valid income passes", () => {
    const result = validateIncome({
      amount: 5000,
      date: "2025-01-01",
      description: "Paycheck",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test("missing amount is invalid", () => {
    const result = validateIncome({ date: "2025-01-01", description: "Pay" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount is required");
  });

  test("zero amount is invalid", () => {
    const result = validateIncome({
      amount: 0,
      date: "2025-01-01",
      description: "Pay",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount must be greater than 0");
  });

  test("non-ISO date is invalid", () => {
    const result = validateIncome({
      amount: 5000,
      date: "Jan 1 2025",
      description: "Pay",
    });
    expect(result.valid).toBe(false);
  });

  test("empty description produces warning", () => {
    const result = validateIncome({
      amount: 5000,
      date: "2025-01-01",
      description: "  ",
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain("description should not be empty");
  });

  test("negative amount is invalid", () => {
    const result = validateIncome({
      amount: -100,
      date: "2025-01-01",
      description: "Refund",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount must be greater than 0");
  });

  test("NaN amount is invalid", () => {
    const result = validateIncome({
      amount: NaN,
      date: "2025-01-01",
      description: "Pay",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount must be a finite number");
  });

  test("Infinity amount is invalid", () => {
    const result = validateIncome({
      amount: Infinity,
      date: "2025-01-01",
      description: "Pay",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("amount must be a finite number");
  });

  test("13th month date is invalid", () => {
    const result = validateIncome({
      amount: 5000,
      date: "2025-13-01",
      description: "Pay",
    });
    expect(result.valid).toBe(false);
  });

  test("Feb 30 date is invalid", () => {
    const result = validateIncome({
      amount: 5000,
      date: "2025-02-30",
      description: "Pay",
    });
    expect(result.valid).toBe(false);
  });

  test("multiple errors are returned together", () => {
    const result = validateIncome({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  test("extremely large amount is still valid", () => {
    const result = validateIncome({
      amount: 1000000,
      date: "2025-01-01",
      description: "Jackpot",
    });
    expect(result.valid).toBe(true);
  });

  test("special characters in description are valid", () => {
    const result = validateIncome({
      amount: 5000,
      date: "2025-01-01",
      description: "Bonus (Q1) - $5k + extras!",
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});
