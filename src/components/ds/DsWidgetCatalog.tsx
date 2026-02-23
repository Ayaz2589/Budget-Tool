import { useTranslation } from "react-i18next";
import { Plus, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { WIDGET_REGISTRY } from "@/lib/widgets/widgetRegistry";
import { ALL_WIDGET_TYPES } from "@/lib/widgets/defaultLayout";
import type { WidgetType } from "@/lib/widgets/widget";

interface DsWidgetCatalogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleWidgetIds: Set<WidgetType>;
  onShow: (id: WidgetType) => void;
  onHide: (id: WidgetType) => void;
  onReset?: () => void;
}

export function DsWidgetCatalog({
  open,
  onOpenChange,
  visibleWidgetIds,
  onShow,
  onHide,
  onReset,
}: DsWidgetCatalogProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-80 sm:w-96 px-5">
        <SheetHeader>
          <SheetTitle>{t("widget.manageWidgets")}</SheetTitle>
          <SheetDescription>{t("widget.catalogDescription")}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 mt-4 space-y-1 overflow-y-auto">
          {ALL_WIDGET_TYPES.map((wType) => {
            const entry = WIDGET_REGISTRY[wType];
            if (!entry) return null;
            const isVisible = visibleWidgetIds.has(wType);

            return (
              <div
                key={wType}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50"
              >
                <span className="shrink-0 text-muted-foreground">{entry.icon}</span>
                <span className="flex-1 text-sm font-medium truncate">
                  {t(entry.label)}
                </span>
                {isVisible ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-muted-foreground"
                    onClick={() => onHide(wType)}
                  >
                    <Check className="size-3.5" />
                    {t("widget.visible")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => onShow(wType)}
                  >
                    <Plus className="size-3.5" />
                    {t("widget.addWidget")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {onReset && (
          <SheetFooter className="border-t pt-4">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onReset}
            >
              <RotateCcw className="size-4" />
              {t("widget.resetLayout")}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
