import type React from "react";

export type WidgetType =
  | "kpi-net-cash-flow"
  | "kpi-total-spent"
  | "kpi-total-income"
  | "kpi-total-debt"
  | "quick-add"
  | "chart-cash-flow"
  | "chart-net-trend"
  | "chart-category"
  | "chart-owner-split"
  | "debt-snapshot"
  | "spend-by-source"
  | "owner-transfers"
  | "recent-activity"
  | "smart-insights";

export type WidgetSize = "sm" | "wide" | "md" | "tall" | "lg" | "xl";

export interface WidgetLayoutItem {
  id: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  size: WidgetSize;
  visible: boolean;
}

export interface DashboardLayout {
  version: number;
  desktopGrid: WidgetLayoutItem[];
  mobileOrder: WidgetType[];
}

export interface WidgetRegistryEntry {
  type: WidgetType;
  label: string;
  icon: React.ReactNode;
  defaultSize: WidgetSize;
  allowedSizes: WidgetSize[];
  render: (props: Record<string, unknown>, size: WidgetSize) => React.ReactNode;
}
