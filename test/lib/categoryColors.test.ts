import { test, expect } from "bun:test";
import { getCategoryColor } from "@/lib/categoryColors";

test("getCategoryColor expense categories", () => {
  expect(getCategoryColor("Shopping", "expense")).toBe("bg-blue-500");
  expect(getCategoryColor("Transport", "expense")).toBe("bg-amber-500");
  expect(getCategoryColor("Unknown", "expense")).toBe("bg-gray-400");
});

test("getCategoryColor income categories", () => {
  expect(getCategoryColor("Rent", "income")).toBe("bg-emerald-500");
  expect(getCategoryColor("Paycheck", "income")).toBe("bg-sky-500");
  expect(getCategoryColor("Other", "income")).toBe("bg-gray-400");
});

test("getCategoryColor without type checks both", () => {
  expect(getCategoryColor("Shopping")).toBe("bg-blue-500");
  expect(getCategoryColor("Rent")).toBe("bg-emerald-500");
  expect(getCategoryColor("Unknown")).toBe("bg-gray-400");
});
