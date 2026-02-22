import type { DashboardLayout, WidgetType } from "@/types/widget";

/**
 * Default dashboard layout for 16-column grid with fixed tile sizes.
 * Used for first-visit users and as the reset target.
 *
 * Sizes: sm=2×2, md=4×3, lg=8×6, xl=8×12
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 4,
  desktopGrid: [
    // Row 0-1: 4 KPIs (wide, w=4, h=2)
    { id: "net-cash-flow", x: 0, y: 0, w: 4, h: 2, size: "wide", visible: true },
    { id: "total-spent", x: 4, y: 0, w: 4, h: 2, size: "wide", visible: true },
    { id: "total-income", x: 8, y: 0, w: 4, h: 2, size: "wide", visible: true },
    { id: "total-debt", x: 12, y: 0, w: 4, h: 2, size: "wide", visible: true },

    // Row 2-4: 4 medium tiles (md, w=4, h=3)
    { id: "quick-add", x: 0, y: 2, w: 4, h: 3, size: "md", visible: true },
    { id: "debt-snapshot", x: 4, y: 2, w: 4, h: 3, size: "md", visible: true },
    { id: "spend-by-source", x: 8, y: 2, w: 4, h: 3, size: "md", visible: true },
    { id: "recent-activity", x: 12, y: 2, w: 4, h: 3, size: "md", visible: true },

    // Row 5-16: 2 xl chart tiles (xl, w=8, h=12)
    { id: "cash-flow-chart", x: 0, y: 5, w: 8, h: 12, size: "xl", visible: true },
    { id: "net-trend-chart", x: 8, y: 5, w: 8, h: 4, size: "wide-lg", visible: true },

    // Row 17-28: 2 xl chart tiles (xl, w=8, h=12)
    { id: "category-chart", x: 0, y: 17, w: 8, h: 12, size: "xl", visible: true },
    { id: "owner-split-chart", x: 8, y: 17, w: 8, h: 12, size: "xl", visible: true },

    // Row 29-31: owner-transfers (md) + smart-insights (wide)
    { id: "owner-transfers", x: 0, y: 29, w: 4, h: 3, size: "md", visible: true },
    { id: "smart-insights", x: 4, y: 29, w: 4, h: 2, size: "wide", visible: true },
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
