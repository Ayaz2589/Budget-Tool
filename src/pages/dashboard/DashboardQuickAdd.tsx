import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoryColor } from "@/lib/categoryColors";
import { cn } from "@/lib/utils";
import type { PresetTransaction } from "@/types/core";

interface DashboardQuickAddProps {
  presets: PresetTransaction[];
  onPresetTap: (presetId: string) => void;
  onAddBlank: () => void;
}

export function DashboardQuickAdd({
  presets,
  onPresetTap,
  onAddBlank,
}: DashboardQuickAddProps) {
  const { t } = useTranslation();

  if (presets.length === 0) return null;

  return (
    <section aria-label={t("dashboard.quickAdd")}>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {presets.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            className="shrink-0 h-9 gap-2 rounded-full px-3 text-xs font-medium"
            onClick={() => onPresetTap(preset.id)}
          >
            <span
              className={cn("size-2 shrink-0 rounded-full", getCategoryColor(preset.category, "expense"))}
              aria-hidden
            />
            <span className="truncate max-w-[120px]">
              {preset.description}
            </span>
            {typeof preset.amount === "number" && Number.isFinite(preset.amount) ? (
              <span className="text-muted-foreground">
                ${preset.amount.toFixed(2)}
              </span>
            ) : null}
          </Button>
        ))}
        <Button
          variant="outline"
          className="shrink-0 size-9 rounded-full p-0"
          onClick={onAddBlank}
          aria-label={t("dashboard.addExpense")}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </section>
  );
}
