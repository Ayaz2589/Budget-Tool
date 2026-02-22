import type { DashboardLayout, WidgetType } from "@/types/widget";

/**
 * Default dashboard layout for 16-column grid with fixed tile sizes.
 * Used for first-visit users and as the reset target.
 *
 * Sizes: sm=2×2, md=4×3, lg=8×6, xl=8×12
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 3,
  desktopGrid: [
    // Row 0-1: 4 KPIs (wide, w=4, h=2)
    { id: "kpi-net-cash-flow", x: 0, y: 0, w: 4, h: 2, size: "wide", visible: true },
    { id: "kpi-total-spent", x: 4, y: 0, w: 4, h: 2, size: "wide", visible: true },
    { id: "kpi-total-income", x: 8, y: 0, w: 4, h: 2, size: "wide", visible: true },
    { id: "kpi-total-debt", x: 12, y: 0, w: 4, h: 2, size: "wide", visible: true },

    // Row 2-4: 4 medium tiles (md, w=4, h=3)
    { id: "quick-add", x: 0, y: 2, w: 4, h: 3, size: "md", visible: true },
    { id: "debt-snapshot", x: 4, y: 2, w: 4, h: 3, size: "md", visible: true },
    { id: "spend-by-source", x: 8, y: 2, w: 4, h: 3, size: "md", visible: true },
    { id: "recent-activity", x: 12, y: 2, w: 4, h: 3, size: "md", visible: true },

    // Row 5-16: 2 xl chart tiles (xl, w=8, h=12)
    { id: "chart-cash-flow", x: 0, y: 5, w: 8, h: 12, size: "xl", visible: true },
    { id: "chart-net-trend", x: 8, y: 5, w: 8, h: 12, size: "xl", visible: true },

    // Row 17-28: 2 xl chart tiles (xl, w=8, h=12)
    { id: "chart-category", x: 0, y: 17, w: 8, h: 12, size: "xl", visible: true },
    { id: "chart-owner-split", x: 8, y: 17, w: 8, h: 12, size: "xl", visible: true },

    // Row 29-31: owner-transfers (md) + smart-insights (wide)
    { id: "owner-transfers", x: 0, y: 29, w: 4, h: 3, size: "md", visible: true },
    { id: "smart-insights", x: 4, y: 29, w: 4, h: 2, size: "wide", visible: true },
  ],
  mobileOrder: [
    "kpi-net-cash-flow",
    "kpi-total-spent",
    "kpi-total-income",
    "kpi-total-debt",
    "quick-add",
    "chart-cash-flow",
    "chart-net-trend",
    "chart-category",
    "chart-owner-split",
    "debt-snapshot",
    "spend-by-source",
    "owner-transfers",
    "recent-activity",
    "smart-insights",
  ] as WidgetType[],
};

/** All known widget type IDs in display order. */
export const ALL_WIDGET_TYPES: WidgetType[] = DEFAULT_LAYOUT.mobileOrder;
