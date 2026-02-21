import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoryColor } from "@/lib/categoryColors";
import { cn } from "@/lib/utils";
import type { PresetTransaction } from "@/types/core";
import type { WidgetSize } from "@/types/widget";

interface DashboardQuickAddProps {
  presets: PresetTransaction[];
  onPresetTap: (presetId: string) => void;
  onAddBlank: () => void;
  size?: WidgetSize;
}

export function DashboardQuickAdd({
  presets,
  onPresetTap,
  onAddBlank,
  size,
}: DashboardQuickAddProps) {
  const { t } = useTranslation();
  const effectiveSize: WidgetSize = size && (["sm", "md", "lg"] as const).includes(size) ? size : "md";
  const isSmall = effectiveSize === "sm";

  if (presets.length === 0) return null;

  return (
    <section aria-label={t("dashboard.quickAdd")}>
      <div className={cn(
        "flex items-center gap-2 pb-1 scrollbar-none",
        isSmall ? "overflow-x-auto" : "flex-wrap",
      )}>
        {presets.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            className={cn(
              "shrink-0 gap-2 rounded-full text-xs font-medium",
              isSmall ? "h-7 px-2" : "h-9 px-3",
            )}
            onClick={() => onPresetTap(preset.id)}
          >
            <span
              className={cn("size-2 shrink-0 rounded-full", getCategoryColor(preset.category, "expense"))}
              aria-hidden
            />
            <span className="truncate max-w-[120px]">
              {preset.description}
            </span>
            {!isSmall && typeof preset.amount === "number" && Number.isFinite(preset.amount) ? (
              <span className="text-muted-foreground">
                ${preset.amount.toFixed(2)}
              </span>
            ) : null}
          </Button>
        ))}
        <Button
          variant="outline"
          className={cn(
            "shrink-0 rounded-full p-0",
            isSmall ? "size-7" : "size-9",
          )}
          onClick={onAddBlank}
          aria-label={t("dashboard.addExpense")}
        >
          <Plus className={isSmall ? "size-3.5" : "size-4"} />
        </Button>
      </div>
    </section>
  );
}
