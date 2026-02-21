import type { DashboardLayout, WidgetType } from "@/types/widget";

/**
 * Default dashboard layout matching the current static arrangement.
 * Used for first-visit users and as the reset target.
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 1,
  desktopGrid: [
    // Row 0: 3 KPI cards (sm → w=4, h=2)
    { id: "kpi-net-cash-flow", x: 0, y: 0, w: 4, h: 2, size: "sm", visible: true },
    { id: "kpi-total-spent", x: 4, y: 0, w: 4, h: 2, size: "sm", visible: true },
    { id: "kpi-total-income", x: 8, y: 0, w: 4, h: 2, size: "sm", visible: true },

    // Row 2: 4th KPI wraps to next row
    { id: "kpi-total-debt", x: 0, y: 2, w: 4, h: 2, size: "sm", visible: true },

    // Row 4: Quick Add bar (lg → w=12, h=3)
    { id: "quick-add", x: 0, y: 4, w: 12, h: 3, size: "lg", visible: true },

    // Row 7: Trend charts (md → w=6, h=7)
    { id: "chart-cash-flow", x: 0, y: 7, w: 6, h: 7, size: "md", visible: true },
    { id: "chart-net-trend", x: 6, y: 7, w: 6, h: 7, size: "md", visible: true },

    // Row 14: Pie charts (md → w=6, h=7)
    { id: "chart-category", x: 0, y: 14, w: 6, h: 7, size: "md", visible: true },
    { id: "chart-owner-split", x: 6, y: 14, w: 6, h: 7, size: "md", visible: true },

    // Row 21: Data sections (md → w=6, h=6)
    { id: "debt-snapshot", x: 0, y: 21, w: 6, h: 6, size: "md", visible: true },
    { id: "spend-by-source", x: 6, y: 21, w: 6, h: 6, size: "md", visible: true },

    // Row 27: More data sections (md → w=6, h=6)
    { id: "owner-transfers", x: 0, y: 27, w: 6, h: 6, size: "md", visible: true },
    { id: "recent-activity", x: 6, y: 27, w: 6, h: 6, size: "md", visible: true },

    // Row 33: Insights (sm → w=4, h=4)
    { id: "smart-insights", x: 0, y: 33, w: 4, h: 4, size: "sm", visible: true },
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
