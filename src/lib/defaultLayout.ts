import type { DashboardLayout, WidgetType } from "@/types/widget";

/**
 * Default dashboard layout matching the current static arrangement.
 * Used for first-visit users and as the reset target.
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 1,
  desktopGrid: [
    // Row 0: 3 KPI cards (sm → w=4, 3 fit per 12-col row)
    { id: "kpi-net-cash-flow", x: 0, y: 0, w: 4, h: 3, size: "sm", visible: true },
    { id: "kpi-total-spent", x: 4, y: 0, w: 4, h: 3, size: "sm", visible: true },
    { id: "kpi-total-income", x: 8, y: 0, w: 4, h: 3, size: "sm", visible: true },

    // Row 3: 4th KPI wraps to next row
    { id: "kpi-total-debt", x: 0, y: 3, w: 4, h: 3, size: "sm", visible: true },

    // Row 6: Quick Add bar (lg → w=12, full width)
    { id: "quick-add", x: 0, y: 6, w: 12, h: 4, size: "lg", visible: true },

    // Row 10: Trend charts (md → w=6, 2 per row)
    { id: "chart-cash-flow", x: 0, y: 10, w: 6, h: 8, size: "md", visible: true },
    { id: "chart-net-trend", x: 6, y: 10, w: 6, h: 8, size: "md", visible: true },

    // Row 18: Pie charts (md → w=6, 2 per row)
    { id: "chart-category", x: 0, y: 18, w: 6, h: 8, size: "md", visible: true },
    { id: "chart-owner-split", x: 6, y: 18, w: 6, h: 8, size: "md", visible: true },

    // Row 26: Data sections (md → w=6, 2 per row)
    { id: "debt-snapshot", x: 0, y: 26, w: 6, h: 8, size: "md", visible: true },
    { id: "spend-by-source", x: 6, y: 26, w: 6, h: 8, size: "md", visible: true },

    // Row 34: More data sections (md → w=6, 2 per row)
    { id: "owner-transfers", x: 0, y: 34, w: 6, h: 8, size: "md", visible: true },
    { id: "recent-activity", x: 6, y: 34, w: 6, h: 8, size: "md", visible: true },

    // Row 42: Insights (lg → w=12, full width)
    { id: "smart-insights", x: 0, y: 42, w: 12, h: 8, size: "lg", visible: true },
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
