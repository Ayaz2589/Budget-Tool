import { beforeEach, test, expect } from "bun:test";
import {
  CURRENCY_META,
  type DisplayCurrency,
} from "@/types/currency";
import {
  formatCurrency,
  formatPercent,
  getDefaultUiFormatSettings,
  setUiFormatSettings,
} from "@/lib/format";

beforeEach(() => {
  setUiFormatSettings(getDefaultUiFormatSettings());
});

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

test("formatCurrency formats EUR from canonical USD using fx rate", () => {
  setUiFormatSettings({
    ...getDefaultUiFormatSettings(),
    currency: "EUR",
    baseCurrency: "USD",
    fxRate: 0.5,
  });
  expect(formatCurrency(100)).toContain("50");
  setUiFormatSettings(getDefaultUiFormatSettings());
});

test("formatCurrency formats JPY from canonical USD using fx rate", () => {
  setUiFormatSettings({
    ...getDefaultUiFormatSettings(),
    currency: "JPY",
    baseCurrency: "USD",
    fxRate: 150,
  });
  expect(formatCurrency(2)).toBe("¥300");
  setUiFormatSettings(getDefaultUiFormatSettings());
});

test("formatCurrency supports all added currencies", () => {
  const samples: Array<{ code: DisplayCurrency; fxRate: number; usd: number }> =
    [
      { code: "CAD", fxRate: 1.35, usd: 100 },
      { code: "MXN", fxRate: 17.1, usd: 100 },
      { code: "GBP", fxRate: 0.79, usd: 100 },
      { code: "BDT", fxRate: 117.2, usd: 100 },
      { code: "INR", fxRate: 83.1, usd: 100 },
      { code: "KRW", fxRate: 1330, usd: 2 },
      { code: "CNY", fxRate: 7.2, usd: 100 },
      { code: "TWD", fxRate: 31.5, usd: 100 },
    ];

  for (const sample of samples) {
    setUiFormatSettings({
      ...getDefaultUiFormatSettings(),
      currency: sample.code,
      baseCurrency: "USD",
      fxRate: sample.fxRate,
    });
    const value = formatCurrency(sample.usd);
    expect(value.startsWith(CURRENCY_META[sample.code].symbol)).toBe(true);
  }
  setUiFormatSettings(getDefaultUiFormatSettings());
});
