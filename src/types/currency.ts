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
  name: string;
  label: string;
  flag: string;
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
    name: "US Dollar",
    label: "🇺🇸 $ USD",
    flag: "🇺🇸",
    symbol: "$",
    locale: "en-US",
    fractionDigits: 2,
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    label: "🇪🇺 € EUR",
    flag: "🇪🇺",
    symbol: "€",
    locale: "de-DE",
    fractionDigits: 2,
  },
  JPY: {
    code: "JPY",
    name: "Japanese Yen",
    label: "🇯🇵 ¥ JPY",
    flag: "🇯🇵",
    symbol: "¥",
    locale: "ja-JP",
    fractionDigits: 0,
  },
  CAD: {
    code: "CAD",
    name: "Canadian Dollar",
    label: "🇨🇦 C$ CAD",
    flag: "🇨🇦",
    symbol: "C$",
    locale: "en-CA",
    fractionDigits: 2,
  },
  MXN: {
    code: "MXN",
    name: "Mexican Peso",
    label: "🇲🇽 MX$ MXN",
    flag: "🇲🇽",
    symbol: "MX$",
    locale: "es-MX",
    fractionDigits: 2,
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    label: "🇬🇧 £ GBP",
    flag: "🇬🇧",
    symbol: "£",
    locale: "en-GB",
    fractionDigits: 2,
  },
  BDT: {
    code: "BDT",
    name: "Bangladeshi Taka",
    label: "🇧🇩 ৳ BDT",
    flag: "🇧🇩",
    symbol: "৳",
    locale: "bn-BD",
    fractionDigits: 2,
  },
  INR: {
    code: "INR",
    name: "Indian Rupee",
    label: "🇮🇳 ₹ INR",
    flag: "🇮🇳",
    symbol: "₹",
    locale: "en-IN",
    fractionDigits: 2,
  },
  KRW: {
    code: "KRW",
    name: "South Korean Won",
    label: "🇰🇷 ₩ KRW",
    flag: "🇰🇷",
    symbol: "₩",
    locale: "ko-KR",
    fractionDigits: 0,
  },
  CNY: {
    code: "CNY",
    name: "Chinese Yuan",
    label: "🇨🇳 ¥ CNY",
    flag: "🇨🇳",
    symbol: "¥",
    locale: "zh-CN",
    fractionDigits: 2,
    aliases: ["CN¥"],
  },
  TWD: {
    code: "TWD",
    name: "Taiwan Dollar",
    label: "🇹🇼 NT$ TWD",
    flag: "🇹🇼",
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
