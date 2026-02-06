import { test, expect } from "bun:test";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/currencyInput";

test("formatCurrencyInput strips non-numeric chars and formats with $", () => {
  expect(formatCurrencyInput("abc1234")).toBe("$1,234");
});

test("formatCurrencyInput preserves dot entry", () => {
  expect(formatCurrencyInput("1234.")).toBe("$1,234.");
});

test("formatCurrencyInput limits decimals to two digits", () => {
  expect(formatCurrencyInput("1234.5678")).toBe("$1,234.56");
});

test("parseCurrencyInput parses dollar strings", () => {
  expect(parseCurrencyInput("$1,234.56")).toBe(1234.56);
});

test("parseCurrencyInput returns NaN for invalid strings", () => {
  expect(Number.isNaN(parseCurrencyInput("abc"))).toBe(true);
});

test("formatCurrencyFromNumber formats with two decimals", () => {
  expect(formatCurrencyFromNumber(1200)).toBe("$1,200.00");
});
