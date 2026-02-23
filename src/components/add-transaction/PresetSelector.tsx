import { useTranslation } from "react-i18next";
import {
  EXPENSE_SOURCE_LOCALE_KEYS,
} from "@/lib/format/sourceLabels";
import { getCategoryColor } from "@/lib/format/categoryColors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PresetTransaction } from "@/types/core";

const PRESET_NONE_VALUE = "_none";

interface PresetSelectorProps {
  presetId: string | undefined;
  sortedPresetTransactions: PresetTransaction[];
  onPresetChange: (presetId: string) => void;
  selectTriggerClass: string;
}

export function PresetSelector({
  presetId,
  sortedPresetTransactions,
  onPresetChange,
  selectTriggerClass,
}: PresetSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">
        {t("addTransaction.preset")}
      </div>
      <Select
        value={presetId ?? PRESET_NONE_VALUE}
        onValueChange={onPresetChange}
      >
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue
            placeholder={t("addTransaction.presetNone")}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PRESET_NONE_VALUE}>
            {t("addTransaction.presetNone")}
          </SelectItem>
          {sortedPresetTransactions.map((preset) => {
            const sourceLabel = t(
              `addTransaction.${
                EXPENSE_SOURCE_LOCALE_KEYS[preset.source]
              }`,
            );
            const descPart =
              preset.description.trim().length > 0
                ? `${preset.description.slice(0, 30)}${
                    preset.description.length > 30 ? "\u2026" : ""
                  }`
                : "";
            const label = descPart
              ? `${sourceLabel} \u2013 ${descPart} \u00B7 ${preset.category}`
              : `${sourceLabel} \u00B7 ${preset.category}`;
            const dotColor = getCategoryColor(
              preset.category,
              "expense",
            );
            return (
              <SelectItem key={preset.id} value={preset.id}>
                <span className="flex items-center gap-2">
                  <span
                    className={`size-2 shrink-0 rounded-full ${dotColor}`}
                    aria-hidden
                  />
                  {label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
