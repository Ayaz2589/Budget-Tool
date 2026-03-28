import { describe, test, expect } from "bun:test";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ALL_EXPENSE_SUBCATEGORIES,
  ALL_INCOME_SUBCATEGORIES,
  COMPOSITE_KEY_SEPARATOR,
  buildCompositeKey,
  parseCompositeKey,
  findCategory,
  getParentFromComposite,
  getParentCategories,
  getSubcategories,
  getCategoryIcon,
  getCategoryColorClass,
  getAllCompositeKeys,
  findParentBySubKey,
} from "@/lib/categories/registry";

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe("category registry structure", () => {
  test("has 10 expense parent categories", () => {
    expect(EXPENSE_CATEGORIES).toHaveLength(10);
  });

  test("has 1 income parent category", () => {
    expect(INCOME_CATEGORIES).toHaveLength(1);
    expect(INCOME_CATEGORIES[0]!.key).toBe("Income");
  });

  test("every parent has at least 2 subcategories", () => {
    for (const parent of [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]) {
      expect(parent.subcategories.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("every parent has a color, icon, key, and label", () => {
    for (const parent of [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]) {
      expect(parent.key).toBeTruthy();
      expect(parent.label).toBeTruthy();
      expect(parent.icon).toBeDefined();
      expect(parent.color).toMatch(/^bg-\w+-\d+$/);
    }
  });

  test("every subcategory has a key, label, and icon", () => {
    for (const def of [
      ...ALL_EXPENSE_SUBCATEGORIES,
      ...ALL_INCOME_SUBCATEGORIES,
    ]) {
      expect(def.sub.key).toBeTruthy();
      expect(def.sub.label).toBeTruthy();
      expect(def.sub.icon).toBeDefined();
    }
  });

  test("no duplicate composite keys across expense categories", () => {
    const keys = ALL_EXPENSE_SUBCATEGORIES.map((d) => d.compositeKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("no duplicate composite keys across income categories", () => {
    const keys = ALL_INCOME_SUBCATEGORIES.map((d) => d.compositeKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("no duplicate parent keys", () => {
    const parentKeys = [
      ...EXPENSE_CATEGORIES.map((p) => p.key),
      ...INCOME_CATEGORIES.map((p) => p.key),
    ];
    expect(new Set(parentKeys).size).toBe(parentKeys.length);
  });

  test("expected expense parent keys exist", () => {
    const keys = EXPENSE_CATEGORIES.map((p) => p.key);
    expect(keys).toContain("Home");
    expect(keys).toContain("Health");
    expect(keys).toContain("Food");
    expect(keys).toContain("Entertainment");
    expect(keys).toContain("Transport");
    expect(keys).toContain("Shopping");
    expect(keys).toContain("Finance");
    expect(keys).toContain("Travel");
    expect(keys).toContain("Pets");
    expect(keys).toContain("Education");
  });
});

// ---------------------------------------------------------------------------
// Composite key helpers
// ---------------------------------------------------------------------------

describe("buildCompositeKey / parseCompositeKey", () => {
  test("round-trips correctly", () => {
    const key = buildCompositeKey("Food", "Groceries");
    expect(key).toBe(`Food${COMPOSITE_KEY_SEPARATOR}Groceries`);

    const parsed = parseCompositeKey(key);
    expect(parsed).toEqual({ parentKey: "Food", subKey: "Groceries" });
  });

  test("parseCompositeKey returns null for non-composite strings", () => {
    expect(parseCompositeKey("Groceries")).toBeNull();
    expect(parseCompositeKey("")).toBeNull();
  });

  test("all derived composite keys parse back correctly", () => {
    for (const def of ALL_EXPENSE_SUBCATEGORIES) {
      const parsed = parseCompositeKey(def.compositeKey);
      expect(parsed).toEqual({
        parentKey: def.parentKey,
        subKey: def.subKey,
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

describe("findCategory", () => {
  test("finds expense category by composite key", () => {
    const def = findCategory("Food > Groceries", "expense");
    expect(def).toBeDefined();
    expect(def!.parentKey).toBe("Food");
    expect(def!.subKey).toBe("Groceries");
    expect(def!.parent.color).toBe("bg-green-500");
  });

  test("finds income category by composite key", () => {
    const def = findCategory("Income > Salary", "income");
    expect(def).toBeDefined();
    expect(def!.parentKey).toBe("Income");
    expect(def!.subKey).toBe("Salary");
  });

  test("returns undefined for unknown key", () => {
    expect(findCategory("Unknown > Foo", "expense")).toBeUndefined();
  });

  test("auto-detects type when type is omitted", () => {
    expect(findCategory("Food > Groceries")).toBeDefined();
    expect(findCategory("Income > Salary")).toBeDefined();
  });
});

describe("getParentFromComposite", () => {
  test("returns parent for valid composite key", () => {
    const parent = getParentFromComposite("Home > Utilities", "expense");
    expect(parent).toBeDefined();
    expect(parent!.key).toBe("Home");
    expect(parent!.color).toBe("bg-red-500");
  });

  test("returns undefined for non-composite key", () => {
    expect(getParentFromComposite("Groceries")).toBeUndefined();
  });
});

describe("getParentCategories / getSubcategories", () => {
  test("returns expense parents", () => {
    const parents = getParentCategories("expense");
    expect(parents).toHaveLength(10);
  });

  test("returns income parents", () => {
    const parents = getParentCategories("income");
    expect(parents).toHaveLength(1);
  });

  test("returns subcategories for Food", () => {
    const subs = getSubcategories("Food", "expense");
    expect(subs).toHaveLength(3);
    expect(subs.map((s) => s.key)).toContain("Groceries");
    expect(subs.map((s) => s.key)).toContain("Dining Out");
    expect(subs.map((s) => s.key)).toContain("Coffee & Drinks");
  });

  test("returns empty for unknown parent", () => {
    expect(getSubcategories("Unknown", "expense")).toEqual([]);
  });
});

describe("getCategoryIcon", () => {
  test("returns sub icon for composite key", () => {
    const icon = getCategoryIcon("Food > Groceries", "expense");
    expect(icon).toBeDefined();
  });

  test("returns parent icon for parent key", () => {
    const icon = getCategoryIcon("Food", "expense");
    expect(icon).toBeDefined();
  });

  test("returns undefined for unknown key", () => {
    expect(getCategoryIcon("Unknown > Foo")).toBeUndefined();
  });
});

describe("getCategoryColorClass", () => {
  test("returns parent color for composite key", () => {
    expect(getCategoryColorClass("Food > Groceries", "expense")).toBe(
      "bg-green-500",
    );
    expect(getCategoryColorClass("Home > Utilities", "expense")).toBe(
      "bg-red-500",
    );
    expect(getCategoryColorClass("Income > Salary", "income")).toBe(
      "bg-teal-500",
    );
  });

  test("returns parent color for parent key directly", () => {
    expect(getCategoryColorClass("Food", "expense")).toBe("bg-green-500");
  });

  test("returns gray for unknown key", () => {
    expect(getCategoryColorClass("Unknown")).toBe("bg-gray-400");
  });
});

describe("getAllCompositeKeys", () => {
  test("returns all expense composite keys", () => {
    const keys = getAllCompositeKeys("expense");
    expect(keys.length).toBe(ALL_EXPENSE_SUBCATEGORIES.length);
    expect(keys).toContain("Food > Groceries");
    expect(keys).toContain("Home > Rent/Mortgage");
  });

  test("returns all income composite keys", () => {
    const keys = getAllCompositeKeys("income");
    expect(keys.length).toBe(ALL_INCOME_SUBCATEGORIES.length);
    expect(keys).toContain("Income > Salary");
  });
});

describe("findParentBySubKey", () => {
  test("finds parent by subcategory key (case-insensitive)", () => {
    const result = findParentBySubKey("groceries", "expense");
    expect(result).toBeDefined();
    expect(result!.parent.key).toBe("Food");
    expect(result!.sub.key).toBe("Groceries");
  });

  test("finds income parent by subcategory key", () => {
    const result = findParentBySubKey("Salary", "income");
    expect(result).toBeDefined();
    expect(result!.parent.key).toBe("Income");
  });

  test("returns undefined for unknown sub key", () => {
    expect(findParentBySubKey("Unknown", "expense")).toBeUndefined();
  });

  test("searches all types when type is omitted", () => {
    const expense = findParentBySubKey("Groceries");
    expect(expense).toBeDefined();
    expect(expense!.parent.key).toBe("Food");

    const income = findParentBySubKey("Salary");
    expect(income).toBeDefined();
    expect(income!.parent.key).toBe("Income");
  });
});
