import { test, expect } from "bun:test";
import { WIDGET_GROUPS } from "@/lib/widgets/widgetGroups";
import { WIDGET_REGISTRY } from "@/lib/widgets/widgetRegistry";

test("every registered widget type appears in at least one WIDGET_GROUPS category", () => {
  const allGroupedWidgets = WIDGET_GROUPS.flatMap((g) => g.widgets);
  const registeredTypes = Object.keys(WIDGET_REGISTRY);

  for (const type of registeredTypes) {
    expect(allGroupedWidgets).toContain(type);
  }
});

test("owner-expense-by-owner is in the charts group", () => {
  const chartsGroup = WIDGET_GROUPS.find((g) => g.key === "charts");
  expect(chartsGroup).toBeDefined();
  expect(chartsGroup!.widgets).toContain("owner-expense-by-owner");
});
