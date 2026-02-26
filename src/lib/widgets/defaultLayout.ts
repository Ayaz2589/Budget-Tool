import type { DashboardLayout, WidgetType } from "@/lib/widgets/widget";

/**
 * Default dashboard layout for 24-column grid with per-widget size presets.
 * Used for first-visit users and as the reset target.
 *
 * Sizes: sm (S), md (M), lg (L) — dimensions vary per widget.
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 7,
  desktopGrid: [
    // Row 0-1: 4 KPIs (md, w=6, h=2)
    { id: "net-cash-flow", x: 0, y: 0, w: 6, h: 2, smX: 0, smW: 3, size: "md", visible: true },
    { id: "total-spent", x: 6, y: 0, w: 6, h: 2, smX: 3, smW: 3, size: "md", visible: true },
    { id: "total-income", x: 12, y: 0, w: 6, h: 2, smX: 6, smW: 3, size: "md", visible: true },
    { id: "total-debt", x: 18, y: 0, w: 6, h: 2, smX: 9, smW: 3, size: "md", visible: true },

    // Row 2-3: 4 list widgets (sm, w=3, h=2)
    { id: "debt-snapshot", x: 0, y: 2, w: 3, h: 2, smX: 0, smW: 3, size: "sm", visible: true },
    { id: "spend-by-source", x: 3, y: 2, w: 3, h: 2, smX: 3, smW: 3, size: "sm", visible: true },
    { id: "recent-activity", x: 6, y: 2, w: 3, h: 2, smX: 6, smW: 3, size: "sm", visible: true },
    { id: "owner-transfers", x: 9, y: 2, w: 3, h: 2, smX: 9, smW: 3, size: "sm", visible: true },

    // Row 5-12: cash-flow-chart (lg, w=12, h=8) + net-trend-chart (md, w=9, h=3)
    { id: "cash-flow-chart", x: 0, y: 5, w: 12, h: 8, smX: 0, smW: 6, size: "lg", visible: true },
    { id: "net-trend-chart", x: 12, y: 5, w: 9, h: 3, smX: 6, smW: 5, size: "md", visible: true },

    // Row 13+: 2 large chart tiles (lg, w=12, h=5)
    { id: "category-chart", x: 0, y: 13, w: 12, h: 5, smX: 0, smW: 6, size: "lg", visible: true },
    { id: "owner-split-chart", x: 12, y: 13, w: 12, h: 5, smX: 6, smW: 6, size: "lg", visible: true },

    // Row 18+: owner-expense-by-owner (lg, w=12, h=6)
    { id: "owner-expense-by-owner", x: 0, y: 18, w: 12, h: 6, smX: 0, smW: 6, size: "lg", visible: true },
  ],
  mobileOrder: [
    "net-cash-flow",
    "total-spent",
    "total-income",
    "total-debt",
    "cash-flow-chart",
    "net-trend-chart",
    "category-chart",
    "owner-split-chart",
    "owner-expense-by-owner",
    "debt-snapshot",
    "spend-by-source",
    "owner-transfers",
    "recent-activity",
  ] as WidgetType[],
};

/** All known widget type IDs in display order. */
export const ALL_WIDGET_TYPES: WidgetType[] = DEFAULT_LAYOUT.mobileOrder;
