import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout/legacy";
import { useDashboardLayout } from "@/context/DashboardLayoutContext";
import { WIDGET_REGISTRY } from "@/lib/widgetRegistry";
import { DsWidgetShell } from "@/components/ds/DsWidgetShell";
import { DsEmptyState } from "@/components/ds";
import type { WidgetLayoutItem } from "@/types/widget";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  dashboardData: Record<string, unknown>;
}

export function DashboardGrid({ dashboardData }: DashboardGridProps) {
  const { layout, isEditing, updateDesktopGrid, resizeWidget, hideWidget } =
    useDashboardLayout();

  // Prevent onLayoutChange from firing on initial mount with stale positions
  const hasInteracted = useRef(false);

  const visibleItems = useMemo(
    () => layout.desktopGrid.filter((item) => item.visible),
    [layout.desktopGrid],
  );

  const rglLayouts = useMemo(() => {
    const lg = visibleItems.map((item) => ({
      i: item.id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }));
    return { lg };
  }, [visibleItems]);

  const handleLayoutChange = useCallback(
    (currentLayout: Layout) => {
      if (!hasInteracted.current) return;

      const updated: WidgetLayoutItem[] = layout.desktopGrid.map((item) => {
        const match = currentLayout.find((l) => l.i === item.id);
        if (match && item.visible) {
          return { ...item, x: match.x, y: match.y, w: match.w, h: match.h };
        }
        return item;
      });
      updateDesktopGrid(updated);
    },
    [layout.desktopGrid, updateDesktopGrid],
  );

  const { t } = useTranslation();

  const handleDragStart = useCallback(() => {
    hasInteracted.current = true;
  }, []);

  if (visibleItems.length === 0) {
    return <DsEmptyState title={t("widget.noWidgetsVisible")} className="py-12" />;
  }

  return (
    <ResponsiveGridLayout
      className="widget-grid"
      layouts={rglLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 12, sm: 6, xs: 1, xxs: 1 }}
      rowHeight={40}
      compactType="vertical"
      isDraggable={isEditing}
      isResizable={false}
      draggableHandle=".react-grid-dragHandleExample"
      onLayoutChange={handleLayoutChange}
      onDragStart={handleDragStart}
      margin={[12, 12]}
    >
      {visibleItems.map((item) => {
        const registry = WIDGET_REGISTRY[item.id];
        if (!registry) return null;

        return (
          <div key={item.id}>
            <DsWidgetShell
              widgetType={item.id}
              size={item.size}
              isEditing={isEditing}
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
