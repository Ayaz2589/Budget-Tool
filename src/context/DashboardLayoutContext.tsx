import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type React from "react";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";
import { DEFAULT_LAYOUT, ALL_WIDGET_TYPES } from "@/lib/widgets/defaultLayout";
import { WIDGET_REGISTRY } from "@/lib/widgets/widgetRegistry";
import type { DashboardLayout, WidgetLayoutItem, WidgetSize, WidgetType } from "@/lib/widgets/widget";

interface DashboardLayoutContextValue {
  layout: DashboardLayout;
  updateDesktopGrid: (items: WidgetLayoutItem[]) => void;
  updateMobileOrder: (order: WidgetType[]) => void;
  resizeWidget: (id: WidgetType, size: WidgetSize) => void;
  hideWidget: (id: WidgetType) => void;
  showWidget: (id: WidgetType) => void;
  resetToDefault: () => void;
}

const DashboardLayoutCtx = createContext<DashboardLayoutContextValue | null>(null);

/** Maps v3 widget IDs to their v4 equivalents. */
const ID_MIGRATION: Record<string, string> = {
  "kpi-net-cash-flow": "net-cash-flow",
  "kpi-total-spent": "total-spent",
  "kpi-total-income": "total-income",
  "kpi-total-debt": "total-debt",
  "chart-cash-flow": "cash-flow-chart",
  "chart-net-trend": "net-trend-chart",
  "chart-category": "category-chart",
  "chart-owner-split": "owner-split-chart",
};

/** Maps v4 size names to v5 equivalents. */
const SIZE_MIGRATION: Record<string, WidgetSize> = {
  sm: "sm",
  wide: "md",
  md: "md",
  tall: "md",
  "wide-lg": "lg",
  lg: "lg",
  xl: "lg",
};

function migrateId(id: string): WidgetType {
  return (ID_MIGRATION[id] ?? id) as WidgetType;
}

function validateLayout(raw: unknown): DashboardLayout | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 3 && obj.version !== 4 && obj.version !== 5 && obj.version !== 6 && obj.version !== 7) return null;
  if (!Array.isArray(obj.desktopGrid)) return null;
  if (!Array.isArray(obj.mobileOrder)) return null;

  // Migrate v3 IDs → v4
  if (obj.version === 3) {
    for (const item of obj.desktopGrid as WidgetLayoutItem[]) {
      item.id = migrateId(item.id);
    }
    obj.mobileOrder = (obj.mobileOrder as string[]).map(migrateId);
  }

  // Filter out unknown widget types
  const knownTypes = new Set<string>(ALL_WIDGET_TYPES);
  const desktopGrid = (obj.desktopGrid as WidgetLayoutItem[]).filter(
    (item) => knownTypes.has(item.id),
  );

  // Migrate v3/v4 sizes → v5
  if (obj.version === 3 || obj.version === 4) {
    for (const item of desktopGrid) {
      const newSize = SIZE_MIGRATION[item.size] ?? "md";
      item.size = newSize;
      const registry = WIDGET_REGISTRY[item.id];
      if (registry) {
        const dims = registry.sizeDims[newSize];
        item.w = dims.w;
        item.h = dims.h;
      }
    }
  }

  // Migrate v3/v4/v5 columns → v6 (16-col → 24-col)
  if (obj.version === 3 || obj.version === 4 || obj.version === 5) {
    for (const item of desktopGrid) {
      item.x = Math.round(item.x * 1.5);
      item.w = Math.round(item.w * 1.5);
    }
  }

  // Ensure dimensions match registry for all versions
  for (const item of desktopGrid) {
    const registry = WIDGET_REGISTRY[item.id];
    if (registry) {
      const dims = registry.sizeDims[item.size];
      item.w = dims.w;
      item.h = dims.h;
    }
    if (item.x + item.w > 24) {
      item.x = Math.max(0, 24 - item.w);
    }
    // Compute or recompute sm values after w may have changed
    item.smW = Math.max(1, Math.round(item.w * 0.5));
    item.smX = Math.min(item.smX ?? Math.round(item.x * 0.5), 12 - item.smW);
  }

  const mobileOrder = (obj.mobileOrder as WidgetType[]).filter((id) =>
    knownTypes.has(id),
  );

  // Merge any new widget types that were added to the registry
  const existingIds = new Set(desktopGrid.map((item) => item.id));
  for (const wType of ALL_WIDGET_TYPES) {
    if (!existingIds.has(wType)) {
      const defaultItem = DEFAULT_LAYOUT.desktopGrid.find((d) => d.id === wType);
      if (defaultItem) {
        desktopGrid.push({ ...defaultItem });
      }
      if (!mobileOrder.includes(wType)) {
        mobileOrder.push(wType);
      }
    }
  }

  return { version: 7, desktopGrid, mobileOrder };
}

function loadLayout(): DashboardLayout {
  const stored = storage.getItem(STORAGE_KEYS.DASHBOARD_LAYOUT);
  if (!stored) return structuredClone(DEFAULT_LAYOUT);

  try {
    const parsed = JSON.parse(stored);
    const validated = validateLayout(parsed);
    return validated ?? structuredClone(DEFAULT_LAYOUT);
  } catch {
    return structuredClone(DEFAULT_LAYOUT);
  }
}

function persistLayout(layout: DashboardLayout) {
  storage.setItem(STORAGE_KEYS.DASHBOARD_LAYOUT, JSON.stringify(layout));
}

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<DashboardLayout>(loadLayout);

  useEffect(() => {
    persistLayout(layout);
  }, [layout]);

  const updateDesktopGrid = useCallback((items: WidgetLayoutItem[]) => {
    setLayout((prev) => ({ ...prev, desktopGrid: items }));
  }, []);

  const updateMobileOrder = useCallback((order: WidgetType[]) => {
    setLayout((prev) => ({ ...prev, mobileOrder: order }));
  }, []);

  const resizeWidget = useCallback((id: WidgetType, size: WidgetSize) => {
    setLayout((prev) => {
      const registry = WIDGET_REGISTRY[id];
      const dims = registry.sizeDims[size];
      const desktopGrid = prev.desktopGrid.map((item) => {
        if (item.id !== id) return item;
        const smW = Math.max(1, Math.round(dims.w * 0.5));
        const smX = Math.min(item.smX, 12 - smW);
        return { ...item, size, w: dims.w, h: dims.h, smW, smX };
      });
      return { ...prev, desktopGrid };
    });
  }, []);

  const hideWidget = useCallback((id: WidgetType) => {
    setLayout((prev) => ({
      ...prev,
      desktopGrid: prev.desktopGrid.map((item) =>
        item.id === id ? { ...item, visible: false } : item,
      ),
      mobileOrder: prev.mobileOrder.filter((wId) => wId !== id),
    }));
  }, []);

  const showWidget = useCallback((id: WidgetType) => {
    setLayout((prev) => {
      const desktopGrid = prev.desktopGrid.map((item) =>
        item.id === id ? { ...item, visible: true } : item,
      );
      // If the widget was removed from the grid entirely, add it back
      if (!desktopGrid.find((item) => item.id === id)) {
        const defaultItem = DEFAULT_LAYOUT.desktopGrid.find((d) => d.id === id);
        if (defaultItem) {
          desktopGrid.push({ ...defaultItem, visible: true });
        }
      }
      const mobileOrder = prev.mobileOrder.includes(id)
        ? prev.mobileOrder
        : [...prev.mobileOrder, id];
      return { ...prev, desktopGrid, mobileOrder };
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setLayout(structuredClone(DEFAULT_LAYOUT));
  }, []);

  return (
    <DashboardLayoutCtx.Provider
      value={{
        layout,
        updateDesktopGrid,
        updateMobileOrder,
        resizeWidget,
        hideWidget,
        showWidget,
        resetToDefault,
      }}
    >
      {children}
    </DashboardLayoutCtx.Provider>
  );
}

export function useDashboardLayout(): DashboardLayoutContextValue {
  const ctx = useContext(DashboardLayoutCtx);
  if (!ctx) throw new Error("useDashboardLayout must be used within DashboardLayoutProvider");
  return ctx;
}
