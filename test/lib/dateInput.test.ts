import { test, expect } from "bun:test";
import {
  dateInputToIso,
  formatDateInput,
  getDateInputPlaceholder,
  isoToDateInput,
} from "@/lib/dateInput";

test("getDateInputPlaceholder returns MM/DD/YYYY", () => {
  expect(getDateInputPlaceholder("MM/DD/YYYY")).toBe("MM/DD/YYYY");
});

test("getDateInputPlaceholder returns YYYY/MM/DD", () => {
  expect(getDateInputPlaceholder("YYYY/MM/DD")).toBe("YYYY/MM/DD");
});

test("formatDateInput formats MM/DD/YYYY with slashes", () => {
  expect(formatDateInput("02062026", "MM/DD/YYYY")).toBe("02/06/2026");
});

test("formatDateInput formats YYYY/MM/DD with slashes", () => {
  expect(formatDateInput("20260206", "YYYY/MM/DD")).toBe("2026/02/06");
});

test("isoToDateInput transforms ISO to MM/DD/YYYY", () => {
  expect(isoToDateInput("2026-02-06", "MM/DD/YYYY")).toBe("02/06/2026");
});

test("isoToDateInput transforms ISO to YYYY/MM/DD", () => {
  expect(isoToDateInput("2026-02-06", "YYYY/MM/DD")).toBe("2026/02/06");
});

test("dateInputToIso transforms MM/DD/YYYY to ISO", () => {
  expect(dateInputToIso("02/06/2026", "MM/DD/YYYY")).toBe("2026-02-06");
});

test("dateInputToIso transforms YYYY/MM/DD to ISO", () => {
  expect(dateInputToIso("2026/02/06", "YYYY/MM/DD")).toBe("2026-02-06");
});

test("dateInputToIso returns null for incomplete date", () => {
  expect(dateInputToIso("02/06", "MM/DD/YYYY")).toBeNull();
});
