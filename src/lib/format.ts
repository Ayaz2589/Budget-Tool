export interface UiFormatSettings {
  locale: string;
  currency: "USD" | "EUR";
  baseCurrency: "USD";
  fxRate: number;
  fxAsOf?: string;
  fxFallback?: boolean;
  dateFormat: "YYYY/MM/DD" | "MM/DD/YYYY";
}

const DEFAULT_UI_FORMAT: UiFormatSettings = {
  locale: "en-US",
  currency: "USD",
  baseCurrency: "USD",
  fxRate: 1,
  dateFormat: "YYYY/MM/DD",
};

let uiFormatSettings: UiFormatSettings = { ...DEFAULT_UI_FORMAT };

export function setUiFormatSettings(settings: UiFormatSettings): void {
  const currency = settings.currency === "EUR" ? "EUR" : "USD";
  const locale = currency === "EUR" ? "de-DE" : "en-US";
  const fxRate =
    Number.isFinite(settings.fxRate) && settings.fxRate > 0
      ? settings.fxRate
      : 1;
  uiFormatSettings = {
    ...DEFAULT_UI_FORMAT,
    ...settings,
    locale,
    currency,
    baseCurrency: "USD",
    fxRate,
    dateFormat:
      settings.dateFormat === "MM/DD/YYYY" ? "MM/DD/YYYY" : "YYYY/MM/DD",
  };
}

export function getDefaultUiFormatSettings(): UiFormatSettings {
  return { ...DEFAULT_UI_FORMAT };
}

export function getUiFormatSettings(): UiFormatSettings {
  return { ...uiFormatSettings };
}

export function usdToDisplayAmount(usdAmount: number): number {
  if (!Number.isFinite(usdAmount)) return 0;
  if (uiFormatSettings.currency === "USD") return usdAmount;
  return usdAmount * uiFormatSettings.fxRate;
}

function getCurrencySymbol(currency: "USD" | "EUR"): string {
  return currency === "EUR" ? "€" : "$";
}

export function displayToUsdAmount(displayAmount: number): number {
  if (!Number.isFinite(displayAmount)) return Number.NaN;
  if (uiFormatSettings.currency === "USD") return displayAmount;
  if (!Number.isFinite(uiFormatSettings.fxRate) || uiFormatSettings.fxRate <= 0) {
    return Number.NaN;
  }
  return displayAmount / uiFormatSettings.fxRate;
}

export function formatCurrency(n: number): string {
  const displayAmount = usdToDisplayAmount(n);
  try {
    const abs = Math.abs(displayAmount);
    const formatted = new Intl.NumberFormat(uiFormatSettings.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(abs);
    const sign = displayAmount < 0 ? "-" : "";
    return `${sign}${getCurrencySymbol(uiFormatSettings.currency)}${formatted}`;
  } catch {
    const abs = Math.abs(n);
    const formatted = new Intl.NumberFormat(DEFAULT_UI_FORMAT.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(abs);
    const sign = n < 0 ? "-" : "";
    return `${sign}${getCurrencySymbol(DEFAULT_UI_FORMAT.currency)}${formatted}`;
  }
}

export function formatPercent(n: number): string {
  try {
    return new Intl.NumberFormat(uiFormatSettings.locale, {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return `${(n * 100).toFixed(1)}%`;
  }
}

export function formatDate(date: string): string {
  if (!date) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  const [, year, month, day] = match;
  if (uiFormatSettings.dateFormat === "MM/DD/YYYY") {
    return `${month}/${day}/${year}`;
  }
  return `${year}/${month}/${day}`;
}
