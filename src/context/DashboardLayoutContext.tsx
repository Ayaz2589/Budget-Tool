import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type React from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { DEFAULT_LAYOUT, ALL_WIDGET_TYPES } from "@/lib/defaultLayout";
import { WIDGET_REGISTRY } from "@/lib/widgetRegistry";
import type { DashboardLayout, WidgetLayoutItem, WidgetSize, WidgetType } from "@/types/widget";

interface DashboardLayoutContextValue {
  layout: DashboardLayout;
  isEditing: boolean;
  startEditing: () => void;
  stopEditing: () => void;
  updateDesktopGrid: (items: WidgetLayoutItem[]) => void;
  updateMobileOrder: (order: WidgetType[]) => void;
  resizeWidget: (id: WidgetType, size: WidgetSize) => void;
  hideWidget: (id: WidgetType) => void;
  showWidget: (id: WidgetType) => void;
  resetToDefault: () => void;
}

const DashboardLayoutCtx = createContext<DashboardLayoutContextValue | null>(null);

/** Size preset → grid column width mapping. */
const SIZE_TO_W: Record<WidgetSize, number> = { sm: 4, md: 6, lg: 12 };

const SIZE_ORDER: WidgetSize[] = ["sm", "md", "lg"];

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

function validateLayout(raw: unknown): DashboardLayout | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) return null;
  if (!Array.isArray(obj.desktopGrid)) return null;
  if (!Array.isArray(obj.mobileOrder)) return null;

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
      item.w = SIZE_TO_W[item.size];
      item.h = registry.minH[item.size];
    }
    if (item.x + item.w > 12) {
      item.x = Math.max(0, 12 - item.w);
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

  return { version: 1, desktopGrid, mobileOrder };
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
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    persistLayout(layout);
  }, [layout]);

  const startEditing = useCallback(() => setIsEditing(true), []);
  const stopEditing = useCallback(() => setIsEditing(false), []);

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
      const newW = SIZE_TO_W[effectiveSize];
      const newH = registry ? registry.minH[effectiveSize] : 4;
      const desktopGrid = prev.desktopGrid.map((item) =>
        item.id === id ? { ...item, size: effectiveSize, w: newW, h: newH } : item,
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
        isEditing,
        startEditing,
        stopEditing,
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
