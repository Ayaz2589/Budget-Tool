import { isValidDate } from "@/lib/dateRepair";
import type { UiFormatSettings } from "@/lib/format";

type UiDateFormat = UiFormatSettings["dateFormat"];

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function getDateInputPlaceholder(format: UiDateFormat): string {
  return format === "MM/DD/YYYY" ? "MM/DD/YYYY" : "YYYY/MM/DD";
}

export function formatDateInput(value: string, format: UiDateFormat): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (format === "MM/DD/YYYY") {
    const mm = digits.slice(0, 2);
    const dd = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);
    if (!dd) return mm;
    if (!yyyy) return `${mm}/${dd}`;
    return `${mm}/${dd}/${yyyy}`;
  }

  const yyyy = digits.slice(0, 4);
  const mm = digits.slice(4, 6);
  const dd = digits.slice(6, 8);
  if (!mm) return yyyy;
  if (!dd) return `${yyyy}/${mm}`;
  return `${yyyy}/${mm}/${dd}`;
}

export function isoToDateInput(value: string, format: UiDateFormat): string {
  if (!isValidDate(value)) return value;
  const [year, month, day] = value.split("-");
  if (format === "MM/DD/YYYY") return `${month}/${day}/${year}`;
  return `${year}/${month}/${day}`;
}

export function dateInputToIso(value: string, format: UiDateFormat): string | null {
  if (!value) return null;
  if (isValidDate(value)) return value;

  const digits = digitsOnly(value);
  if (digits.length !== 8) return null;

  let year = "";
  let month = "";
  let day = "";

  if (format === "MM/DD/YYYY") {
    month = digits.slice(0, 2);
    day = digits.slice(2, 4);
    year = digits.slice(4, 8);
  } else {
    year = digits.slice(0, 4);
    month = digits.slice(4, 6);
    day = digits.slice(6, 8);
  }

  const iso = `${year}-${month}-${day}`;
  return isValidDate(iso) ? iso : null;
}
