import {
  displayToUsdAmount,
  getUiFormatSettings,
  usdToDisplayAmount,
} from "@/lib/format";
import { CURRENCY_META, type DisplayCurrency } from "@/types/currency";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCurrencySymbol(currency: DisplayCurrency): string {
  return CURRENCY_META[currency].symbol;
}

export function formatCurrencyInput(
  value: string,
  currency: DisplayCurrency = getUiFormatSettings().currency
): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const hasDot = cleaned.includes(".");
  const [rawWhole = "", rawDecimal = ""] = cleaned.split(".");
  const whole = rawWhole.replace(/^0+(?=\d)/, "") || "0";
  const decimalLimit = CURRENCY_META[currency].fractionDigits;
  const decimal = rawDecimal.slice(0, decimalLimit);
  const wholeWithCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const prefix = getCurrencySymbol(currency);
  if (decimalLimit === 0) return `${prefix}${wholeWithCommas}`;
  if (!hasDot) return `${prefix}${wholeWithCommas}`;
  if (decimal.length === 0) return `${prefix}${wholeWithCommas}.`;
  return `${prefix}${wholeWithCommas}.${decimal}`;
}

export function parseCurrencyInput(
  value: string,
  currency: DisplayCurrency = getUiFormatSettings().currency
): number {
  const meta = CURRENCY_META[currency];
  const tokens = [meta.symbol, currency, ...(meta.aliases ?? [])]
    .filter(Boolean)
    .map((t) => new RegExp(escapeRegex(t), "gi"));
  let normalized = value.replace(/,/g, "");
  for (const token of tokens) {
    normalized = normalized.replace(token, "");
  }
  const parsed = parseFloat(
    normalized
      .replace(/[$€¥£₩₹৳]/g, "")
      .replace(/NT\$/gi, "")
      .replace(/MX\$/gi, "")
      .replace(/C\$/gi, "")
      .trim()
  );
  if (!Number.isFinite(parsed)) return Number.NaN;
  if (currency === "USD") return parsed;
  return displayToUsdAmount(parsed);
}

export function formatCurrencyFromNumber(
  value: number,
  currency: DisplayCurrency = getUiFormatSettings().currency
): string {
  const displayValue = currency === "USD" ? value : usdToDisplayAmount(value);
  const prefix = getCurrencySymbol(currency);
  const decimalDigits = CURRENCY_META[currency].fractionDigits;
  return `${prefix}${displayValue.toLocaleString("en-US", {
    minimumFractionDigits: decimalDigits,
    maximumFractionDigits: decimalDigits,
  })}`;
}
