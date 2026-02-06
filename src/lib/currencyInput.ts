export function formatCurrencyInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const hasDot = cleaned.includes(".");
  const [rawWhole = "", rawDecimal = ""] = cleaned.split(".");
  const whole = rawWhole.replace(/^0+(?=\d)/, "") || "0";
  const decimal = rawDecimal.slice(0, 2);
  const wholeWithCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (!hasDot) return `$${wholeWithCommas}`;
  if (decimal.length === 0) return `$${wholeWithCommas}.`;
  return `$${wholeWithCommas}.${decimal}`;
}

export function parseCurrencyInput(value: string): number {
  const parsed = parseFloat(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function formatCurrencyFromNumber(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
