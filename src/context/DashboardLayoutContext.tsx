import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type React from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { DEFAULT_LAYOUT, ALL_WIDGET_TYPES } from "@/lib/defaultLayout";
import { WIDGET_REGISTRY } from "@/lib/widgetRegistry";
import type {
  DashboardLayout,
  WidgetLayoutItem,
  WidgetSize,
  WidgetType,
  SavedLayoutEntry,
  SavedLayoutCollection,
  SaveLayoutResult,
  RenameResult,
} from "@/types/widget";

interface DashboardLayoutContextValue {
  layout: DashboardLayout;
  updateDesktopGrid: (items: WidgetLayoutItem[]) => void;
  updateMobileOrder: (order: WidgetType[]) => void;
  resizeWidget: (id: WidgetType, size: WidgetSize) => void;
  hideWidget: (id: WidgetType) => void;
  showWidget: (id: WidgetType) => void;
  resetToDefault: () => void;
  // Layout collection
  savedLayouts: SavedLayoutEntry[];
  activeLayoutId: string;
  activeLayoutName: string;
  saveLayout: (name: string) => SaveLayoutResult;
  switchLayout: (id: string) => void;
  deleteLayout: (id: string) => void;
  renameLayout: (id: string, newName: string) => RenameResult;
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

// ---------------------------------------------------------------------------
// Layout collection — load / persist
// ---------------------------------------------------------------------------

function loadLayoutCollection(): SavedLayoutCollection {
  const stored = storage.getItem(STORAGE_KEYS.SAVED_LAYOUTS);

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as SavedLayoutCollection;
      if (parsed && Array.isArray(parsed.layouts) && parsed.layouts.length > 0) {
        const validLayouts: SavedLayoutEntry[] = [];
        for (const entry of parsed.layouts) {
          if (entry.id === "default") {
            // Default entry always uses factory layout
            validLayouts.push({
              ...entry,
              layout: structuredClone(DEFAULT_LAYOUT),
            });
          } else {
            const validated = validateLayout(entry.layout);
            if (validated) {
              validLayouts.push({ ...entry, layout: validated });
            }
          }
        }

        // Ensure default always exists
        if (!validLayouts.find((e) => e.id === "default")) {
          validLayouts.unshift({
            id: "default",
            name: "Default",
            layout: structuredClone(DEFAULT_LAYOUT),
            createdAt: 0,
          });
        }

        const activeId = validLayouts.find((e) => e.id === parsed.activeId)
          ? parsed.activeId
          : "default";

        return { activeId, layouts: validLayouts };
      }
    } catch {
      // Fall through to migration / fresh install
    }
  }

  // No valid collection — check for existing single layout (migration)
  const hasExistingLayout = storage.getItem(STORAGE_KEYS.DASHBOARD_LAYOUT) !== null;

  const defaultEntry: SavedLayoutEntry = {
    id: "default",
    name: "Default",
    layout: structuredClone(DEFAULT_LAYOUT),
    createdAt: 0,
  };

  if (hasExistingLayout) {
    const existingLayout = loadLayout();
    const migratedEntry: SavedLayoutEntry = {
      id: crypto.randomUUID(),
      name: "My Layout",
      layout: existingLayout,
      createdAt: Date.now(),
    };
    return { activeId: migratedEntry.id, layouts: [defaultEntry, migratedEntry] };
  }

  return { activeId: "default", layouts: [defaultEntry] };
}

function persistLayoutCollection(collection: SavedLayoutCollection) {
  storage.setItem(STORAGE_KEYS.SAVED_LAYOUTS, JSON.stringify(collection));
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
  // Initialize collection and working layout together (single localStorage read)
  const [init] = useState(() => {
    const collection = loadLayoutCollection();
    persistLayoutCollection(collection);
    const activeEntry = collection.layouts.find((e) => e.id === collection.activeId);
    const layout = activeEntry
      ? structuredClone(activeEntry.layout)
      : structuredClone(DEFAULT_LAYOUT);
    return { layout, collection };
  });

  const [layout, setLayout] = useState<DashboardLayout>(init.layout);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayoutEntry[]>(init.collection.layouts);
  const [activeLayoutId, setActiveLayoutId] = useState<string>(init.collection.activeId);

  // Refs hold the latest collection data for the sync effect and CRUD methods
  // so we avoid calling setState inside useEffect (react-hooks/set-state-in-effect).
  const collectionRef = useRef({ layouts: init.collection.layouts, activeId: init.collection.activeId });

  // Persist active layout and sync edits to collection ref + localStorage
  useEffect(() => {
    persistLayout(layout);
    const { activeId, layouts } = collectionRef.current;
    // Default entry always keeps factory layout — skip collection sync
    if (activeId === "default") return;
    const updated = layouts.map((entry) =>
      entry.id === activeId
        ? { ...entry, layout: structuredClone(layout) }
        : entry,
    );
    collectionRef.current = { activeId, layouts: updated };
    persistLayoutCollection({ activeId, layouts: updated });
  }, [layout, activeLayoutId]);

  // Helper: update both state and ref for collection mutations
  const updateCollection = useCallback((layouts: SavedLayoutEntry[], activeId: string) => {
    collectionRef.current = { layouts, activeId };
    setSavedLayouts(layouts);
    setActiveLayoutId(activeId);
    persistLayoutCollection({ activeId, layouts });
  }, []);

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

  // --- Layout collection methods (read from ref for latest data) ---

  const saveLayout = useCallback(
    (name: string): SaveLayoutResult => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, reason: "empty_name" };
      if (trimmed.length > 30) return { ok: false, reason: "name_too_long" };
      if (collectionRef.current.layouts.length >= 10) return { ok: false, reason: "limit_reached" };

      const newId = crypto.randomUUID();
      const newEntry: SavedLayoutEntry = {
        id: newId,
        name: trimmed,
        layout: structuredClone(layout),
        createdAt: Date.now(),
      };

      updateCollection([...collectionRef.current.layouts, newEntry], newId);
      return { ok: true };
    },
    [layout, updateCollection],
  );

  const switchLayout = useCallback(
    (id: string) => {
      const entry = collectionRef.current.layouts.find((e) => e.id === id);
      if (!entry) return;

      collectionRef.current = { ...collectionRef.current, activeId: id };
      setActiveLayoutId(id);
      setLayout(structuredClone(entry.layout));
      persistLayoutCollection(collectionRef.current);
    },
    [],
  );

  const deleteLayout = useCallback(
    (id: string) => {
      if (id === "default") return;

      const { layouts, activeId } = collectionRef.current;
      const updated = layouts.filter((e) => e.id !== id);
      const newActiveId = activeId === id ? "default" : activeId;

      if (activeId === id) {
        const defaultEntry = updated.find((e) => e.id === "default");
        if (defaultEntry) {
          setLayout(structuredClone(defaultEntry.layout));
        }
      }

      updateCollection(updated, newActiveId);
    },
    [updateCollection],
  );

  const renameLayout = useCallback(
    (id: string, newName: string): RenameResult => {
      const trimmed = newName.trim();
      if (!trimmed) return { ok: false, reason: "empty_name" };
      if (trimmed.length > 30) return { ok: false, reason: "name_too_long" };

      const { layouts, activeId } = collectionRef.current;
      const isDuplicate = layouts.some(
        (e) => e.id !== id && e.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (isDuplicate) return { ok: false, reason: "duplicate_name" };

      const updated = layouts.map((e) =>
        e.id === id ? { ...e, name: trimmed } : e,
      );
      updateCollection(updated, activeId);
      return { ok: true };
    },
    [updateCollection],
  );

  const activeLayoutName =
    savedLayouts.find((e) => e.id === activeLayoutId)?.name ?? "Default";

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
        savedLayouts,
        activeLayoutId,
        activeLayoutName,
        saveLayout,
        switchLayout,
        deleteLayout,
        renameLayout,
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
