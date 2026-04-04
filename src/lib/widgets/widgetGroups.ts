import type { WidgetType } from "@/lib/widgets/widget";

export interface WidgetGroup {
  key: string;
  label: string;
  widgets: WidgetType[];
}

export const WIDGET_GROUPS: WidgetGroup[] = [
  {
    key: "kpi",
    label: "widget.groupKpiMetrics",
    widgets: ["net-cash-flow", "total-spent", "total-income", "total-debt"],
  },
  {
    key: "charts",
    label: "widget.groupCharts",
    widgets: ["cash-flow-chart", "net-trend-chart", "category-chart", "owner-split-chart", "owner-expense-by-owner", "spend-by-category", "category-trends", "top-categories", "daily-spending-heatmap"],
  },
  {
    key: "lists",
    label: "widget.groupListsActivity",
    widgets: ["debt-snapshot", "spend-by-source", "owner-transfers", "recent-activity"],
  },
];
