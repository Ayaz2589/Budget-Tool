import { test, expect } from "bun:test";
import { getCategoryColor } from "@/lib/categoryColors";

test("getCategoryColor expense categories", () => {
  expect(getCategoryColor("Shopping", "expense")).toBe("bg-blue-500");
  expect(getCategoryColor("Transport", "expense")).toBe("bg-amber-500");
  // Unknown categories get a hash-based color, not gray
  expect(getCategoryColor("Unknown", "expense")).not.toBe("bg-gray-400");
  expect(getCategoryColor("Unknown", "expense")).toMatch(/^bg-\w+-500$/);
});

test("getCategoryColor income categories", () => {
  expect(getCategoryColor("Rent", "income")).toBe("bg-emerald-500");
  expect(getCategoryColor("Paycheck", "income")).toBe("bg-sky-500");
  expect(getCategoryColor("Other", "income")).toBe("bg-gray-400");
});

test("getCategoryColor without type checks both", () => {
  expect(getCategoryColor("Shopping")).toBe("bg-blue-500");
  expect(getCategoryColor("Rent")).toBe("bg-emerald-500");
  // Unknown categories get a deterministic hash-based color
  expect(getCategoryColor("Unknown")).not.toBe("bg-gray-400");
});

test("getCategoryColor hash is deterministic", () => {
  const color1 = getCategoryColor("MyCustomCategory", "expense");
  const color2 = getCategoryColor("MyCustomCategory", "expense");
  expect(color1).toBe(color2);
  // Different names should (usually) produce different colors
  const color3 = getCategoryColor("AnotherCategory", "expense");
  expect(color3).toMatch(/^bg-\w+-500$/);
});
