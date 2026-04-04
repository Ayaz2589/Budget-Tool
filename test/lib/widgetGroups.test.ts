import { describe, test, expect } from "bun:test";
import { WIDGET_GROUPS } from "@/lib/widgets/widgetGroups";
import { WIDGET_REGISTRY } from "@/lib/widgets/widgetRegistry";
import { DEFAULT_LAYOUT, ALL_WIDGET_TYPES } from "@/lib/widgets/defaultLayout";
import type { WidgetType } from "@/lib/widgets/widget";

const ALL_WIDGET_TYPE_VALUES: WidgetType[] = [
  "net-cash-flow",
  "total-spent",
  "total-income",
  "total-debt",
  "cash-flow-chart",
  "net-trend-chart",
  "category-chart",
  "owner-split-chart",
  "debt-snapshot",
  "spend-by-source",
  "owner-transfers",
  "recent-activity",
  "owner-expense-by-owner",
];

describe("WIDGET_REGISTRY", () => {
  test("has an entry for every WidgetType", () => {
    for (const type of ALL_WIDGET_TYPE_VALUES) {
      expect(WIDGET_REGISTRY[type]).toBeDefined();
    }
  });

  test("has exactly 17 registered widgets", () => {
    expect(Object.keys(WIDGET_REGISTRY).length).toBe(17);
  });

  test("each entry has required fields", () => {
    for (const [type, entry] of Object.entries(WIDGET_REGISTRY)) {
      expect(entry.type).toBe(type);
      expect(entry.label).toBeTruthy();
      expect(entry.icon).toBeDefined();
      expect(["sm", "md", "lg"]).toContain(entry.defaultSize);
      expect(entry.sizeDims.sm).toBeDefined();
      expect(entry.sizeDims.md).toBeDefined();
      expect(entry.sizeDims.lg).toBeDefined();
      expect(typeof entry.render).toBe("function");
    }
  });

  test("sizeDims have positive width and height", () => {
    for (const entry of Object.values(WIDGET_REGISTRY)) {
      for (const size of ["sm", "md", "lg"] as const) {
        expect(entry.sizeDims[size].w).toBeGreaterThan(0);
        expect(entry.sizeDims[size].h).toBeGreaterThan(0);
      }
    }
  });
});

describe("WIDGET_GROUPS", () => {
  test("every registered widget type appears in at least one group", () => {
    const allGroupedWidgets = WIDGET_GROUPS.flatMap((g) => g.widgets);
    for (const type of Object.keys(WIDGET_REGISTRY)) {
      expect(allGroupedWidgets).toContain(type);
    }
  });

  test("owner-expense-by-owner is in the charts group", () => {
    const chartsGroup = WIDGET_GROUPS.find((g) => g.key === "charts");
    expect(chartsGroup).toBeDefined();
    expect(chartsGroup!.widgets).toContain("owner-expense-by-owner");
  });

  test("has 3 groups: kpi, charts, lists", () => {
    const keys = WIDGET_GROUPS.map((g) => g.key);
    expect(keys).toEqual(["kpi", "charts", "lists"]);
  });

  test("no duplicate widgets across groups", () => {
    const all = WIDGET_GROUPS.flatMap((g) => g.widgets);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("DEFAULT_LAYOUT", () => {
  test("desktopGrid references only valid widget types", () => {
    for (const item of DEFAULT_LAYOUT.desktopGrid) {
      expect(WIDGET_REGISTRY[item.id]).toBeDefined();
    }
  });

  test("mobileOrder references only valid widget types", () => {
    for (const type of DEFAULT_LAYOUT.mobileOrder) {
      expect(WIDGET_REGISTRY[type]).toBeDefined();
    }
  });

  test("desktopGrid covers all 13 widget types", () => {
    const ids = new Set(DEFAULT_LAYOUT.desktopGrid.map((item) => item.id));
    expect(ids.size).toBe(13);
  });

  test("mobileOrder covers all 13 widget types", () => {
    expect(new Set(DEFAULT_LAYOUT.mobileOrder).size).toBe(13);
  });

  test("ALL_WIDGET_TYPES matches mobileOrder", () => {
    expect(ALL_WIDGET_TYPES).toEqual(DEFAULT_LAYOUT.mobileOrder);
  });

  test("all grid items have valid positions and sizes", () => {
    for (const item of DEFAULT_LAYOUT.desktopGrid) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.w).toBeGreaterThan(0);
      expect(item.h).toBeGreaterThan(0);
      expect(item.smX).toBeGreaterThanOrEqual(0);
      expect(item.smW).toBeGreaterThan(0);
      expect(["sm", "md", "lg"]).toContain(item.size);
      expect(item.visible).toBe(true);
    }
  });
});
