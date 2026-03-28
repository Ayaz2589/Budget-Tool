import { describe, test, expect } from "bun:test";
import {
  isMortgageCategory,
  MORTGAGE_CATEGORY_LABEL,
} from "@/lib/domain/mortgageCategory";

// ---------------------------------------------------------------------------
// MORTGAGE_CATEGORY_LABEL
// ---------------------------------------------------------------------------

describe("MORTGAGE_CATEGORY_LABEL", () => {
  test("is the composite key 'Home > Rent/Mortgage'", () => {
    expect(MORTGAGE_CATEGORY_LABEL).toBe("Home > Rent/Mortgage");
  });
});

// ---------------------------------------------------------------------------
// isMortgageCategory — exact matches
// ---------------------------------------------------------------------------

describe("isMortgageCategory exact matches", () => {
  test("returns true for 'Mortgage'", () => {
    expect(isMortgageCategory("Mortgage")).toBe(true);
  });

  test("returns true for 'mortgage' (lowercase)", () => {
    expect(isMortgageCategory("mortgage")).toBe(true);
  });

  test("returns true for 'MORTGAGE' (uppercase)", () => {
    expect(isMortgageCategory("MORTGAGE")).toBe(true);
  });

  test("returns true for 'MoRtGaGe' (mixed case)", () => {
    expect(isMortgageCategory("MoRtGaGe")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isMortgageCategory — whitespace handling
// ---------------------------------------------------------------------------

describe("isMortgageCategory whitespace handling", () => {
  test("returns true for ' Mortgage ' (leading/trailing spaces)", () => {
    expect(isMortgageCategory(" Mortgage ")).toBe(true);
  });

  test("returns true for '  mortgage  ' (extra whitespace)", () => {
    expect(isMortgageCategory("  mortgage  ")).toBe(true);
  });

  test("returns true for '\\tMortgage\\n' (tab and newline)", () => {
    expect(isMortgageCategory("\tMortgage\n")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isMortgageCategory — composite key matches
// ---------------------------------------------------------------------------

describe("isMortgageCategory composite key matches", () => {
  test("returns true for 'Home > Rent/Mortgage'", () => {
    expect(isMortgageCategory("Home > Rent/Mortgage")).toBe(true);
  });

  test("returns true for 'home > rent/mortgage' (lowercase)", () => {
    expect(isMortgageCategory("home > rent/mortgage")).toBe(true);
  });

  test("returns true for ' Home > Rent/Mortgage ' (whitespace)", () => {
    expect(isMortgageCategory(" Home > Rent/Mortgage ")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isMortgageCategory — non-mortgage strings
// ---------------------------------------------------------------------------

describe("isMortgageCategory non-mortgage strings", () => {
  test("returns false for 'Food'", () => {
    expect(isMortgageCategory("Food")).toBe(false);
  });

  test("returns false for 'Rent'", () => {
    expect(isMortgageCategory("Rent")).toBe(false);
  });

  test("returns false for 'mortgage payment' (partial match)", () => {
    expect(isMortgageCategory("mortgage payment")).toBe(false);
  });

  test("returns false for 'my mortgage' (prefix)", () => {
    expect(isMortgageCategory("my mortgage")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isMortgageCategory("")).toBe(false);
  });

  test("returns false for a string of spaces", () => {
    expect(isMortgageCategory("   ")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isMortgageCategory — null/undefined handling
// ---------------------------------------------------------------------------

describe("isMortgageCategory null/undefined handling", () => {
  test("returns false for undefined", () => {
    expect(isMortgageCategory(undefined)).toBe(false);
  });

  test("returns false for null", () => {
    expect(isMortgageCategory(null)).toBe(false);
  });

  test("returns false when called with no arguments", () => {
    expect(isMortgageCategory()).toBe(false);
  });
});
