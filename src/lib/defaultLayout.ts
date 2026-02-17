import type { DashboardLayout, WidgetType } from "@/types/widget";

/**
 * Default dashboard layout matching the current static arrangement.
 * Used for first-visit users and as the reset target.
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 1,
  desktopGrid: [
    // Row 0: 4 KPI cards across the top
    { id: "kpi-net-cash-flow", x: 0, y: 0, w: 3, h: 2, size: "md", visible: true },
    { id: "kpi-total-spent", x: 3, y: 0, w: 3, h: 2, size: "md", visible: true },
    { id: "kpi-total-income", x: 6, y: 0, w: 3, h: 2, size: "md", visible: true },
    { id: "kpi-total-debt", x: 9, y: 0, w: 3, h: 2, size: "md", visible: true },

    // Row 2: Quick Add bar (full width)
    { id: "quick-add", x: 0, y: 2, w: 12, h: 2, size: "md", visible: true },

    // Row 4: Trend charts (2 per row)
    { id: "chart-cash-flow", x: 0, y: 4, w: 6, h: 5, size: "md", visible: true },
    { id: "chart-net-trend", x: 6, y: 4, w: 6, h: 5, size: "md", visible: true },

    // Row 9: Pie charts (2 per row)
    { id: "chart-category", x: 0, y: 9, w: 6, h: 5, size: "md", visible: true },
    { id: "chart-owner-split", x: 6, y: 9, w: 6, h: 5, size: "md", visible: true },

    // Row 14: Data sections (2 per row)
    { id: "debt-snapshot", x: 0, y: 14, w: 6, h: 4, size: "md", visible: true },
    { id: "spend-by-source", x: 6, y: 14, w: 6, h: 4, size: "md", visible: true },

    // Row 18: More data sections
    { id: "owner-transfers", x: 0, y: 18, w: 6, h: 4, size: "md", visible: true },
    { id: "recent-activity", x: 6, y: 18, w: 6, h: 4, size: "md", visible: true },

    // Row 22: Insights (full width)
    { id: "smart-insights", x: 0, y: 22, w: 12, h: 4, size: "md", visible: true },
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
