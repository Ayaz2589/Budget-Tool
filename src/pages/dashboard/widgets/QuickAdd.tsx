import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoryColor } from "@/lib/categoryColors";
import { cn } from "@/lib/utils";
import type { PresetTransaction } from "@/types/core";
import type { WidgetSize } from "@/lib/widgets/widget";

interface QuickAddProps {
  presets: PresetTransaction[];
  onPresetTap: (presetId: string) => void;
  onAddBlank: () => void;
  size?: WidgetSize;
}

export function QuickAdd({
  presets,
  onPresetTap,
  onAddBlank,
  size,
}: QuickAddProps) {
  const { t } = useTranslation();
  const effectiveSize: WidgetSize = size ?? "md";

  if (presets.length === 0) return null;

  // md (~290×216px): compact 2-column preset button grid
  if (effectiveSize === "md") {
    const displayPresets = presets.slice(0, 4);
    return (
      <section aria-label={t("dashboard.quickAdd")}>
        <div className="grid grid-cols-2 gap-1.5">
          {displayPresets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              className="h-8 gap-1.5 rounded-full text-xs font-medium justify-start px-2.5"
              onClick={() => onPresetTap(preset.id)}
            >
              <span
                className={cn("size-2 shrink-0 rounded-full", getCategoryColor(preset.category, "expense"))}
                aria-hidden
              />
              <span className="truncate">{preset.description}</span>
            </Button>
          ))}
          <Button
            variant="outline"
            className="h-8 rounded-full gap-1.5 text-xs"
            onClick={onAddBlank}
            aria-label={t("dashboard.addExpense")}
          >
            <Plus className="size-3.5" />
            <span>{t("dashboard.addExpense")}</span>
          </Button>
        </div>
      </section>
    );
  }

  // lg (~588×328px) / xl (~588×664px): expanded preset grid with amounts
  return (
    <section aria-label={t("dashboard.quickAdd")}>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            className="h-10 gap-2 rounded-full text-xs font-medium justify-start px-3"
            onClick={() => onPresetTap(preset.id)}
          >
            <span
              className={cn("size-2 shrink-0 rounded-full", getCategoryColor(preset.category, "expense"))}
              aria-hidden
            />
            <span className="truncate">{preset.description}</span>
            {typeof preset.amount === "number" && Number.isFinite(preset.amount) ? (
              <span className="ml-auto text-muted-foreground shrink-0">
                ${preset.amount.toFixed(2)}
              </span>
            ) : null}
          </Button>
        ))}
        <Button
          variant="outline"
          className="h-10 rounded-full gap-2 text-xs"
          onClick={onAddBlank}
          aria-label={t("dashboard.addExpense")}
        >
          <Plus className="size-4" />
          <span>{t("dashboard.addExpense")}</span>
        </Button>
      </div>
    </section>
  );
}
