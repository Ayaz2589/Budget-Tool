import { test, expect } from "bun:test";
import { getCategoryColor } from "@/lib/format/categoryColors";

test("getCategoryColor returns parent color for composite expense keys", () => {
  expect(getCategoryColor("Shopping > Clothing", "expense")).toBe(
    "bg-blue-500",
  );
  expect(getCategoryColor("Transport > Gas/Fuel", "expense")).toBe(
    "bg-amber-500",
  );
  expect(getCategoryColor("Food > Groceries", "expense")).toBe(
    "bg-green-500",
  );
  expect(getCategoryColor("Home > Utilities", "expense")).toBe("bg-red-500");
});

test("getCategoryColor returns parent color for parent key directly", () => {
  expect(getCategoryColor("Shopping", "expense")).toBe("bg-blue-500");
  expect(getCategoryColor("Food", "expense")).toBe("bg-green-500");
});

test("getCategoryColor returns gray for unknown keys", () => {
  expect(getCategoryColor("Unknown", "expense")).toBe("bg-gray-400");
  expect(getCategoryColor("RandomCategory", "expense")).toBe("bg-gray-400");
});

test("getCategoryColor income composite keys", () => {
  expect(getCategoryColor("Income > Salary", "income")).toBe("bg-teal-500");
  expect(getCategoryColor("Income > Bonus", "income")).toBe("bg-teal-500");
  expect(getCategoryColor("Income > Freelance", "income")).toBe(
    "bg-teal-500",
  );
});

test("getCategoryColor without type checks both expense and income", () => {
  expect(getCategoryColor("Food > Groceries")).toBe("bg-green-500");
  expect(getCategoryColor("Income > Salary")).toBe("bg-teal-500");
});

test("getCategoryColor is deterministic", () => {
  const color1 = getCategoryColor("Food > Groceries", "expense");
  const color2 = getCategoryColor("Food > Groceries", "expense");
  expect(color1).toBe(color2);
});
