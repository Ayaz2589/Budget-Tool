import {
  displayToUsdAmount,
  getUiFormatSettings,
  usdToDisplayAmount,
} from "@/lib/format";

function getCurrencySymbol(currency: "USD" | "EUR"): string {
  return currency === "EUR" ? "€" : "$";
}

export function formatCurrencyInput(
  value: string,
  currency: "USD" | "EUR" = getUiFormatSettings().currency
): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const hasDot = cleaned.includes(".");
  const [rawWhole = "", rawDecimal = ""] = cleaned.split(".");
  const whole = rawWhole.replace(/^0+(?=\d)/, "") || "0";
  const decimal = rawDecimal.slice(0, 2);
  const wholeWithCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const prefix = getCurrencySymbol(currency);
  if (!hasDot) return `${prefix}${wholeWithCommas}`;
  if (decimal.length === 0) return `${prefix}${wholeWithCommas}.`;
  return `${prefix}${wholeWithCommas}.${decimal}`;
}

export function parseCurrencyInput(
  value: string,
  currency: "USD" | "EUR" = getUiFormatSettings().currency
): number {
  const parsed = parseFloat(
    value
      .replace(/[$,]/g, "")
      .replace(/EUR\s?/gi, "")
      .replace(/€/g, "")
  );
  if (!Number.isFinite(parsed)) return Number.NaN;
  if (currency === "USD") return parsed;
  return displayToUsdAmount(parsed);
}

export function formatCurrencyFromNumber(
  value: number,
  currency: "USD" | "EUR" = getUiFormatSettings().currency
): string {
  const displayValue = currency === "USD" ? value : usdToDisplayAmount(value);
  const prefix = getCurrencySymbol(currency);
  return `${prefix}${displayValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
