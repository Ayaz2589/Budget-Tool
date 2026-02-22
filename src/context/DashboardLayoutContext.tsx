import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type React from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { DEFAULT_LAYOUT, ALL_WIDGET_TYPES } from "@/lib/defaultLayout";
import { WIDGET_REGISTRY } from "@/lib/widgetRegistry";
import type { DashboardLayout, WidgetLayoutItem, WidgetSize, WidgetType } from "@/types/widget";

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

/** Size preset → fixed grid dimensions (width × height). */
const SIZE_TO_DIMS: Record<WidgetSize, { w: number; h: number }> = {
  sm: { w: 2, h: 2 },
  wide: { w: 4, h: 2 },
  md: { w: 4, h: 3 },
  tall: { w: 4, h: 12 },
  "wide-lg": { w: 8, h: 4 },
  lg: { w: 8, h: 6 },
  xl: { w: 8, h: 12 },
};

const SIZE_ORDER: WidgetSize[] = ["sm", "wide", "md", "tall", "wide-lg", "lg", "xl"];

/** Clamp a size to the nearest allowed size, preferring smaller. */
function clampToAllowed(size: WidgetSize, allowed: WidgetSize[]): WidgetSize {
  if (allowed.includes(size)) return size;
  const idx = SIZE_ORDER.indexOf(size);
  // Search smaller first, then larger
  for (let d = 1; d < SIZE_ORDER.length; d++) {
    if (idx - d >= 0 && allowed.includes(SIZE_ORDER[idx - d])) return SIZE_ORDER[idx - d];
    if (idx + d < SIZE_ORDER.length && allowed.includes(SIZE_ORDER[idx + d]))
      return SIZE_ORDER[idx + d];
  }
  return allowed[0];
}

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

function migrateId(id: string): WidgetType {
  return (ID_MIGRATION[id] ?? id) as WidgetType;
}

function validateLayout(raw: unknown): DashboardLayout | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 3 && obj.version !== 4) return null;
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

  // Migrate disallowed sizes and clamp positions
  for (const item of desktopGrid) {
    const registry = WIDGET_REGISTRY[item.id];
    if (registry && !registry.allowedSizes.includes(item.size)) {
      item.size = clampToAllowed(item.size, registry.allowedSizes);
    }
    const dims = SIZE_TO_DIMS[item.size];
    item.w = dims.w;
    item.h = dims.h;
    if (item.x + item.w > 16) {
      item.x = Math.max(0, 16 - item.w);
    }
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

  return { version: 4, desktopGrid, mobileOrder };
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
      const effectiveSize =
        registry && !registry.allowedSizes.includes(size)
          ? clampToAllowed(size, registry.allowedSizes)
          : size;
      const dims = SIZE_TO_DIMS[effectiveSize];
      const desktopGrid = prev.desktopGrid.map((item) =>
        item.id === id ? { ...item, size: effectiveSize, w: dims.w, h: dims.h } : item,
      );
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
