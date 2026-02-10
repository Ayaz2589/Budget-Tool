export type DisplayCurrency =
  | "USD"
  | "EUR"
  | "JPY"
  | "CAD"
  | "MXN"
  | "GBP"
  | "BDT"
  | "INR"
  | "KRW"
  | "CNY"
  | "TWD";

export type BaseCurrency = "USD";

export interface CurrencyMeta {
  code: DisplayCurrency;
  label: string;
  symbol: string;
  locale: string;
  fractionDigits: number;
  aliases?: string[];
}

export const DISPLAY_CURRENCIES: DisplayCurrency[] = [
  "USD",
  "EUR",
  "JPY",
  "CAD",
  "MXN",
  "GBP",
  "BDT",
  "INR",
  "KRW",
  "CNY",
  "TWD",
];

export const CURRENCY_META: Record<DisplayCurrency, CurrencyMeta> = {
  USD: {
    code: "USD",
    label: "$ USD",
    symbol: "$",
    locale: "en-US",
    fractionDigits: 2,
  },
  EUR: {
    code: "EUR",
    label: "€ EUR",
    symbol: "€",
    locale: "de-DE",
    fractionDigits: 2,
  },
  JPY: {
    code: "JPY",
    label: "¥ JPY",
    symbol: "¥",
    locale: "ja-JP",
    fractionDigits: 0,
  },
  CAD: {
    code: "CAD",
    label: "C$ CAD",
    symbol: "C$",
    locale: "en-CA",
    fractionDigits: 2,
  },
  MXN: {
    code: "MXN",
    label: "MX$ MXN",
    symbol: "MX$",
    locale: "es-MX",
    fractionDigits: 2,
  },
  GBP: {
    code: "GBP",
    label: "£ GBP",
    symbol: "£",
    locale: "en-GB",
    fractionDigits: 2,
  },
  BDT: {
    code: "BDT",
    label: "৳ BDT",
    symbol: "৳",
    locale: "bn-BD",
    fractionDigits: 2,
  },
  INR: {
    code: "INR",
    label: "₹ INR",
    symbol: "₹",
    locale: "en-IN",
    fractionDigits: 2,
  },
  KRW: {
    code: "KRW",
    label: "₩ KRW",
    symbol: "₩",
    locale: "ko-KR",
    fractionDigits: 0,
  },
  CNY: {
    code: "CNY",
    label: "¥ CNY",
    symbol: "¥",
    locale: "zh-CN",
    fractionDigits: 2,
    aliases: ["CN¥"],
  },
  TWD: {
    code: "TWD",
    label: "NT$ TWD",
    symbol: "NT$",
    locale: "zh-TW",
    fractionDigits: 2,
  },
};

export function isDisplayCurrency(value: unknown): value is DisplayCurrency {
  return (
    typeof value === "string" &&
    (DISPLAY_CURRENCIES as string[]).includes(value.toUpperCase())
  );
}

export function toDisplayCurrency(value: unknown): DisplayCurrency {
  if (isDisplayCurrency(value)) {
    return value.toUpperCase() as DisplayCurrency;
  }
  return "USD";
}
