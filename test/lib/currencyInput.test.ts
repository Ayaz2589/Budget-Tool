import { beforeEach, test, expect } from "bun:test";
import type { DisplayCurrency } from "@/types/currency";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/currencyInput";
import { getDefaultUiFormatSettings, setUiFormatSettings } from "@/lib/format";

beforeEach(() => {
  setUiFormatSettings(getDefaultUiFormatSettings());
});

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

test("EUR input parses back to canonical USD", () => {
  setUiFormatSettings({
    ...getDefaultUiFormatSettings(),
    currency: "EUR",
    baseCurrency: "USD",
    fxRate: 0.5,
  });
  expect(formatCurrencyInput("1234", "EUR")).toBe("€1,234");
  expect(parseCurrencyInput("€50.00", "EUR")).toBe(100);
  setUiFormatSettings(getDefaultUiFormatSettings());
});

test("JPY input uses whole units and parses back to canonical USD", () => {
  setUiFormatSettings({
    ...getDefaultUiFormatSettings(),
    currency: "JPY",
    baseCurrency: "USD",
    fxRate: 150,
  });
  expect(formatCurrencyInput("1234.56", "JPY")).toBe("¥1,234");
  expect(parseCurrencyInput("¥300", "JPY")).toBe(2);
  expect(formatCurrencyFromNumber(2, "JPY")).toBe("¥300");
  setUiFormatSettings(getDefaultUiFormatSettings());
});

test("all added currencies parse back to canonical USD", () => {
  const samples: Array<{
    code: DisplayCurrency;
    symbolInput: string;
    fxRate: number;
    expectedUsd: number;
  }> = [
    { code: "CAD", symbolInput: "C$135.00", fxRate: 1.35, expectedUsd: 100 },
    { code: "MXN", symbolInput: "MX$171.00", fxRate: 1.71, expectedUsd: 100 },
    { code: "GBP", symbolInput: "£79.00", fxRate: 0.79, expectedUsd: 100 },
    { code: "BDT", symbolInput: "৳117.20", fxRate: 1.172, expectedUsd: 100 },
    { code: "INR", symbolInput: "₹83.10", fxRate: 0.831, expectedUsd: 100 },
    { code: "KRW", symbolInput: "₩300", fxRate: 150, expectedUsd: 2 },
    { code: "CNY", symbolInput: "¥72.00", fxRate: 0.72, expectedUsd: 100 },
    { code: "TWD", symbolInput: "NT$315.00", fxRate: 3.15, expectedUsd: 100 },
  ];

  for (const sample of samples) {
    setUiFormatSettings({
      ...getDefaultUiFormatSettings(),
      currency: sample.code,
      baseCurrency: "USD",
      fxRate: sample.fxRate,
    });
    const parsed = parseCurrencyInput(sample.symbolInput, sample.code);
    expect(Math.round(parsed)).toBe(sample.expectedUsd);
  }
  setUiFormatSettings(getDefaultUiFormatSettings());
});
