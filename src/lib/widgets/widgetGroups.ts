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
    widgets: ["cash-flow-chart", "net-trend-chart", "category-chart", "owner-split-chart"],
  },
  {
    key: "lists",
    label: "widget.groupListsActivity",
    widgets: ["quick-add", "debt-snapshot", "spend-by-source", "owner-transfers", "recent-activity"],
  },
  {
    key: "insights",
    label: "widget.groupInsights",
    widgets: ["smart-insights"],
  },
];
