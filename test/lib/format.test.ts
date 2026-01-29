import { test, expect } from "bun:test";
import { formatCurrency, formatPercent } from "@/lib/format";

test("formatCurrency formats USD", () => {
  expect(formatCurrency(0)).toBe("$0.00");
  expect(formatCurrency(1234.5)).toBe("$1,234.50");
  expect(formatCurrency(-10)).toContain("10");
});

test("formatPercent formats 0-1 as percentage", () => {
  expect(formatPercent(0)).toBe("0.0%");
  expect(formatPercent(0.5)).toBe("50.0%");
  expect(formatPercent(1)).toBe("100.0%");
  expect(formatPercent(0.123)).toBe("12.3%");
});
