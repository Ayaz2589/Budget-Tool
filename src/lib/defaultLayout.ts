import type { DashboardLayout, WidgetType } from "@/types/widget";

/**
 * Default dashboard layout for 16-column grid with per-widget size presets.
 * Used for first-visit users and as the reset target.
 *
 * Sizes: sm (S), md (M), lg (L) — dimensions vary per widget.
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 5,
  desktopGrid: [
    // Row 0-1: 4 KPIs (md, w=4, h=2)
    { id: "net-cash-flow", x: 0, y: 0, w: 4, h: 2, size: "md", visible: true },
    { id: "total-spent", x: 4, y: 0, w: 4, h: 2, size: "md", visible: true },
    { id: "total-income", x: 8, y: 0, w: 4, h: 2, size: "md", visible: true },
    { id: "total-debt", x: 12, y: 0, w: 4, h: 2, size: "md", visible: true },

    // Row 2-4: 4 medium tiles (sm for list/form widgets, w=4, h=3)
    { id: "quick-add", x: 0, y: 2, w: 4, h: 3, size: "sm", visible: true },
    { id: "debt-snapshot", x: 4, y: 2, w: 4, h: 3, size: "sm", visible: true },
    { id: "spend-by-source", x: 8, y: 2, w: 4, h: 3, size: "sm", visible: true },
    { id: "recent-activity", x: 12, y: 2, w: 4, h: 3, size: "sm", visible: true },

    // Row 5-16: cash-flow-chart (lg, w=8, h=12) + net-trend-chart (md, w=8, h=4)
    { id: "cash-flow-chart", x: 0, y: 5, w: 8, h: 12, size: "lg", visible: true },
    { id: "net-trend-chart", x: 8, y: 5, w: 8, h: 4, size: "md", visible: true },

    // Row 17-28: 2 large chart tiles (lg, w=8, h=12)
    { id: "category-chart", x: 0, y: 17, w: 8, h: 12, size: "lg", visible: true },
    { id: "owner-split-chart", x: 8, y: 17, w: 8, h: 12, size: "lg", visible: true },

    // Row 29-31: owner-transfers (sm) + smart-insights (md)
    { id: "owner-transfers", x: 0, y: 29, w: 4, h: 3, size: "sm", visible: true },
    { id: "smart-insights", x: 4, y: 29, w: 4, h: 2, size: "md", visible: true },
  ],
  mobileOrder: [
    "net-cash-flow",
    "total-spent",
    "total-income",
    "total-debt",
    "quick-add",
    "cash-flow-chart",
    "net-trend-chart",
    "category-chart",
    "owner-split-chart",
    "debt-snapshot",
    "spend-by-source",
    "owner-transfers",
    "recent-activity",
    "smart-insights",
  ] as WidgetType[],
};

/** All known widget type IDs in display order. */
export const ALL_WIDGET_TYPES: WidgetType[] = DEFAULT_LAYOUT.mobileOrder;
