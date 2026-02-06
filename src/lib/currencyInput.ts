export function formatUsdInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";

  const hasDot = cleaned.includes(".");
  const [rawIntPart, ...rawDecimalParts] = cleaned.split(".");
  const intPart = rawIntPart.replace(/^0+(?=\d)/, "") || "0";
  const decimalPart = rawDecimalParts.join("").slice(0, 2);

  const intFormatted = Number(intPart).toLocaleString("en-US");
  if (hasDot && decimalPart.length === 0) return `$${intFormatted}.`;
  if (decimalPart.length > 0) return `$${intFormatted}.${decimalPart}`;
  return `$${intFormatted}`;
}

export function parseUsdInput(value: string): number {
  const parsed = parseFloat(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}
