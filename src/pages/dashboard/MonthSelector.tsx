import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getMonthLabel } from "@/lib/totals";

export type MonthSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  currentMonthKey: string;
  isCurrentMonth: boolean;
  t: (key: string, opts?: { month?: string }) => string;
};

export function MonthSelector({
  value,
  onChange,
  options,
  currentMonthKey,
  isCurrentMonth,
  t,
}: MonthSelectorProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label>{t("dashboard.viewMonth")}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((key) => (
              <SelectItem key={key} value={key}>
                {getMonthLabel(key)}
                {key === currentMonthKey ? ` (${t("common.current")})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-muted-foreground text-sm pb-2">
        {isCurrentMonth
          ? t("dashboard.currentMonthSummary")
          : t("dashboard.showingMonth", {
              month: getMonthLabel(value),
            })}{" "}
        {t("dashboard.syncFromSettings")}
      </p>
    </div>
  );
}
