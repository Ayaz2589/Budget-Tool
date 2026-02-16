import { storage, STORAGE_KEYS } from "@/lib/storage";

// ---------------------------------------------------------------------------
// Widget ID union & metadata
// ---------------------------------------------------------------------------

export type WidgetId =
  | "quick-stats"
  | "spending-pace"
  | "savings-rate"
  | "cash-flow"
  | "net-cash-flow"
  | "category-breakdown"
  | "owner-split"
  | "category-trends"
  | "debt-transfers"
  | "insights";

export interface WidgetMeta {
  id: WidgetId;
  labelKey: string;
  size: "full" | "half";
}

export const WIDGET_REGISTRY: WidgetMeta[] = [
  { id: "quick-stats", labelKey: "dashboard.widget.quickStats", size: "full" },
  { id: "spending-pace", labelKey: "dashboard.widget.spendingPace", size: "half" },
  { id: "savings-rate", labelKey: "dashboard.widget.savingsRate", size: "half" },
  { id: "cash-flow", labelKey: "dashboard.widget.cashFlow", size: "half" },
  { id: "net-cash-flow", labelKey: "dashboard.widget.netCashFlow", size: "half" },
  { id: "category-breakdown", labelKey: "dashboard.widget.categoryBreakdown", size: "half" },
  { id: "owner-split", labelKey: "dashboard.widget.ownerSplit", size: "half" },
  { id: "category-trends", labelKey: "dashboard.widget.categoryTrends", size: "full" },
  { id: "debt-transfers", labelKey: "dashboard.widget.debtTransfers", size: "full" },
  { id: "insights", labelKey: "dashboard.widget.insights", size: "full" },
];

const ALL_IDS: WidgetId[] = WIDGET_REGISTRY.map((w) => w.id);

// ---------------------------------------------------------------------------
// Config type & defaults
// ---------------------------------------------------------------------------

export interface DashboardWidgetConfig {
  order: WidgetId[];
  hidden: WidgetId[];
}

export const DEFAULT_CONFIG: DashboardWidgetConfig = {
  order: [...ALL_IDS],
  hidden: [],
};

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function isWidgetId(value: string): value is WidgetId {
  return ALL_IDS.includes(value as WidgetId);
}

/** Ensure saved config stays valid even if widgets are added/removed. */
function normalizeConfig(raw: Partial<DashboardWidgetConfig>): DashboardWidgetConfig {
  const order = (raw.order ?? []).filter(isWidgetId);
  const hidden = (raw.hidden ?? []).filter(isWidgetId);

  // Add any new widgets that weren't in the saved order
  const missing = ALL_IDS.filter((id) => !order.includes(id));
  return { order: [...order, ...missing], hidden };
}

export function loadWidgetConfig(): DashboardWidgetConfig {
  const json = storage.getItem(STORAGE_KEYS.DASHBOARD_WIDGET_CONFIG);
  if (!json) return DEFAULT_CONFIG;
  try {
    return normalizeConfig(JSON.parse(json));
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveWidgetConfig(config: DashboardWidgetConfig): void {
  storage.setItem(STORAGE_KEYS.DASHBOARD_WIDGET_CONFIG, JSON.stringify(config));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getWidgetMeta(id: WidgetId): WidgetMeta {
  return WIDGET_REGISTRY.find((w) => w.id === id)!;
}

export function getVisibleWidgets(config: DashboardWidgetConfig): WidgetId[] {
  return config.order.filter((id) => !config.hidden.includes(id));
}
