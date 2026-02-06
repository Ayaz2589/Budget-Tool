export interface UiFormatSettings {
  locale: string;
  currency: string;
  dateFormat: "YYYY/MM/DD" | "MM/DD/YYYY";
}

const DEFAULT_UI_FORMAT: UiFormatSettings = {
  locale: "en-US",
  currency: "USD",
  dateFormat: "YYYY/MM/DD",
};

let uiFormatSettings: UiFormatSettings = { ...DEFAULT_UI_FORMAT };

export function setUiFormatSettings(settings: UiFormatSettings): void {
  // Currency/locale are fixed to USD formatting; only date format is user-configurable.
  uiFormatSettings = {
    ...DEFAULT_UI_FORMAT,
    dateFormat: settings.dateFormat,
  };
}

export function getDefaultUiFormatSettings(): UiFormatSettings {
  return { ...DEFAULT_UI_FORMAT };
}

export function formatCurrency(n: number): string {
  try {
    return new Intl.NumberFormat(uiFormatSettings.locale, {
      style: "currency",
      currency: uiFormatSettings.currency,
    }).format(n);
  } catch {
    return new Intl.NumberFormat(DEFAULT_UI_FORMAT.locale, {
      style: "currency",
      currency: DEFAULT_UI_FORMAT.currency,
    }).format(n);
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
