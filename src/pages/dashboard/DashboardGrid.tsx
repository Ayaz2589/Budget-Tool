import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Responsive, WidthProvider, type Layout, type LayoutItem } from "react-grid-layout/legacy";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { WIDGET_REGISTRY } from "@/lib/widgets/widgetRegistry";
import { DsWidgetShell } from "@/components/ds/DsWidgetShell";
import { DsEmptyState } from "@/components/ds";
import type { WidgetLayoutItem } from "@/lib/widgets/widget";

const ResponsiveGridLayout = WidthProvider(Responsive);

const SM_COLS = 12;

/** Scale a 24-column RGL layout to a 12-column layout. */
export function deriveSmLayout(lgLayout: readonly LayoutItem[]): LayoutItem[] {
  return lgLayout.map((item) => {
    const w = Math.max(1, Math.round(item.w * 0.5));
    const x = Math.min(Math.round(item.x * 0.5), SM_COLS - w);
    return { ...item, x, w };
  });
}

/** Push items left to eliminate horizontal gaps within a grid. */
function compactHorizontal(layout: readonly LayoutItem[], cols: number): LayoutItem[] {
  const sorted = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
  const placed: LayoutItem[] = [];

  for (const item of sorted) {
    let x = 0;
    for (;;) {
      if (x + item.w > cols) { x = Math.max(0, cols - item.w); break; }
      const blocker = placed.find(
        (p) =>
          x < p.x + p.w && x + item.w > p.x &&
          item.y < p.y + p.h && item.y + item.h > p.y,
      );
      if (!blocker) break;
      x = blocker.x + blocker.w;
    }
    placed.push({ ...item, x });
  }

  return placed;
}

interface DashboardGridProps {
  dashboardData: Record<string, unknown>;
}

export function DashboardGrid({ dashboardData }: DashboardGridProps) {
  const { layout, updateDesktopGrid, resizeWidget, hideWidget } =
    useDashboardLayout();

  const currentBreakpoint = useRef("lg");

  const visibleItems = useMemo(
    () => layout.desktopGrid.filter((item) => item.visible),
    [layout.desktopGrid],
  );

  const rglLayouts = useMemo(() => {
    const lg = compactHorizontal(
      visibleItems.map((item) => ({
        i: item.id, x: item.x, y: item.y, w: item.w, h: item.h,
      })),
      24,
    );
    const sm = compactHorizontal(
      visibleItems.map((item) => ({
        i: item.id, x: item.smX, y: item.y, w: item.smW, h: item.h,
      })),
      SM_COLS,
    );
    return { lg, md: lg, sm };
  }, [visibleItems]);

  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    currentBreakpoint.current = newBreakpoint;
  }, []);

  const handleDragStop = useCallback(
    (currentLayout: Layout) => {
      const bp = currentBreakpoint.current;
      const isLg = bp === "lg" || bp === "md";
      if (!isLg && bp !== "sm") return;

      const cols = isLg ? 24 : SM_COLS;
      const compacted = compactHorizontal(currentLayout, cols);

      let changed = false;
      const updated: WidgetLayoutItem[] = layout.desktopGrid.map((item) => {
        const match = compacted.find((l) => l.i === item.id);
        if (!match || !item.visible) return item;

        if (isLg) {
          if (item.x !== match.x || item.y !== match.y) {
            changed = true;
            const smW = Math.max(1, Math.round(match.w * 0.5));
            const smX = Math.min(Math.round(match.x * 0.5), SM_COLS - smW);
            return { ...item, x: match.x, y: match.y, smX, smW };
          }
        } else {
          if (item.smX !== match.x) {
            changed = true;
            return { ...item, smX: match.x };
          }
        }
        return item;
      });
      if (changed) {
        updateDesktopGrid(updated);
      }
    },
    [layout.desktopGrid, updateDesktopGrid],
  );

  const { t } = useTranslation();

  if (visibleItems.length === 0) {
    return <DsEmptyState title={t("widget.noWidgetsVisible")} className="py-12" />;
  }

  return (
    <ResponsiveGridLayout
      className="widget-grid"
      layouts={rglLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 24, md: 24, sm: 12, xs: 1, xxs: 1 }}
      rowHeight={48}
      compactType="vertical"
      isDraggable
      isResizable={false}
      draggableHandle=".react-grid-dragHandleExample"
      onBreakpointChange={handleBreakpointChange}
      onDragStop={handleDragStop}
      margin={[8, 8]}
    >
      {visibleItems.map((item) => {
        const registry = WIDGET_REGISTRY[item.id];
        if (!registry) return null;

        return (
          <div key={item.id}>
            <DsWidgetShell
              widgetType={item.id}
              size={item.size}
              onResize={(size) => resizeWidget(item.id, size)}
              onHide={() => hideWidget(item.id)}
            >
              {registry.render(dashboardData, item.size)}
            </DsWidgetShell>
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
}
