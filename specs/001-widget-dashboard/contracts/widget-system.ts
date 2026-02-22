/**
 * Widget Dashboard — Component Contracts
 *
 * These are the TypeScript interfaces that define the contract between
 * the widget system's components. This is a design artifact — not
 * production code. Copy and adapt during implementation.
 */

// ─── Widget Types ──────────────────────────────────────────────

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

export type WidgetSize = "sm" | "md" | "lg";

// ─── Layout Persistence ────────────────────────────────────────

export interface WidgetLayoutItem {
  id: WidgetType;
  x: number; // column (0–11)
  y: number; // row (0-based, grows down)
  w: number; // width in columns (4 | 6 | 12)
  h: number; // height in rows (varies by widget type)
  size: WidgetSize;
  visible: boolean;
}

export interface DashboardLayout {
  version: 1;
  desktopGrid: WidgetLayoutItem[];
  mobileOrder: WidgetType[];
}

// ─── Widget Registry ───────────────────────────────────────────

export interface WidgetRegistryEntry {
  type: WidgetType;
  label: string; // i18n key
  icon: React.ReactNode;
  defaultSize: WidgetSize;
  /** Minimum row height per size preset */
  minH: Record<WidgetSize, number>;
  /** Render the widget content */
  render: (props: DashboardDataProps, size: WidgetSize) => React.ReactNode;
}

// ─── Context Contract ──────────────────────────────────────────

export interface DashboardLayoutContextValue {
  /** Current layout state */
  layout: DashboardLayout;
  /** Whether edit mode is active */
  isEditing: boolean;
  /** Enter edit mode */
  startEditing: () => void;
  /** Exit edit mode (persists automatically) */
  stopEditing: () => void;
  /** Update the desktop grid layout (called by react-grid-layout onChange) */
  updateDesktopGrid: (items: WidgetLayoutItem[]) => void;
  /** Update mobile widget order */
  updateMobileOrder: (order: WidgetType[]) => void;
  /** Change a widget's preset size */
  resizeWidget: (id: WidgetType, size: WidgetSize) => void;
  /** Hide a widget */
  hideWidget: (id: WidgetType) => void;
  /** Show a previously hidden widget */
  showWidget: (id: WidgetType) => void;
  /** Reset to default layout (caller must confirm first) */
  resetToDefault: () => void;
}

// ─── Component Props ───────────────────────────────────────────

/** Props for the WidgetShell wrapper (edit mode chrome around each widget) */
export interface WidgetShellProps {
  widgetType: WidgetType;
  size: WidgetSize;
  isEditing: boolean;
  onResize: (size: WidgetSize) => void;
  onHide: () => void;
  children: React.ReactNode;
}

/** Props for the WidgetCatalog panel (add/restore hidden widgets) */
export interface WidgetCatalogProps {
  allWidgets: WidgetRegistryEntry[];
  hiddenWidgetIds: WidgetType[];
  onShow: (id: WidgetType) => void;
  onClose: () => void;
}

/** Props passed to each widget's render function (subset of useDashboardData) */
export interface DashboardDataProps {
  // This mirrors the return type of useDashboardData — specific fields
  // will be typed during implementation based on the existing hook's shape.
  [key: string]: unknown;
}
