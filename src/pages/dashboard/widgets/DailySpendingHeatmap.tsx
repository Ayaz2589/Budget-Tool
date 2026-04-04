import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState } from "@/components/ds";
import type { DashboardDailySpending, DashboardDailySpendingDay } from "@/types/dashboard";
import type { WidgetSize } from "@/lib/widgets/widget";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getOpacity(amount: number, max: number): number {
  if (max <= 0 || amount <= 0) return 0;
  return Math.cbrt(amount / max);
}

const LEGEND_OPACITIES = [0, 0.15, 0.35, 0.6, 1];

function formatDayLabel(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("default", { weekday: "long", month: "short", day: "numeric" });
}

interface DailySpendingHeatmapProps {
  dailySpending: DashboardDailySpending;
  size?: WidgetSize;
}

function DetailPanel({ day, t }: { day: DashboardDailySpendingDay | null; t: (key: string, opts?: Record<string, string>) => string }) {
  if (!day) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {t("dashboard.heatmapHover", { defaultValue: "Select a day to see details" })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{formatDayLabel(day.date)}</p>
        <p className="text-lg font-semibold">{formatCurrency(day.amount)}</p>
      </div>
      {day.items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No transactions</p>
      ) : (
        <div className="space-y-1.5">
          {day.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="min-w-0 pr-3">
                <p className="truncate font-medium">{item.description || "\u2014"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.category || "Uncategorized"}
                </p>
              </div>
              <p className="shrink-0 font-medium">{formatCurrency(item.amount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DailySpendingHeatmap({
  dailySpending,
  size = "lg",
}: DailySpendingHeatmapProps) {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const title = t("dashboard.dailySpending", { defaultValue: "Daily Spending" });

  const hasSpending = dailySpending.maxAmount > 0;

  if (!hasSpending) {
    return (
      <DsChartCard title={title} size={size}>
        <DsEmptyState
          icon={<CalendarDays className="size-5" />}
          title={t("dashboard.noDailySpending", { defaultValue: "No spending data" })}
          className="py-4"
        />
      </DsChartCard>
    );
  }

  // sm: highest spend day
  if (size === "sm") {
    const highest = dailySpending.days.reduce((max, d) => d.amount > max.amount ? d : max, dailySpending.days[0]!);
    const dayNum = highest.date.slice(-2);
    return (
      <DsChartCard title={title} size={size}>
        <p className="text-sm font-medium">Peak: {formatCurrency(highest.amount)}</p>
        <p className="text-xs text-muted-foreground">Day {dayNum}</p>
      </DsChartCard>
    );
  }

  // Build calendar grid
  const [y, m] = dailySpending.monthKey.split("-").map(Number);
  const firstDayOfMonth = new Date(y!, m! - 1, 1);
  const startDow = (firstDayOfMonth.getDay() + 6) % 7;

  const cells: (typeof dailySpending.days[0] | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (const day of dailySpending.days) cells.push(day);

  const selectedData = selectedDay
    ? dailySpending.days.find((d) => d.date === selectedDay) ?? null
    : null;

  const heatmapGrid = (
    <div className="space-y-3">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[10px] font-medium text-muted-foreground/60">
            {label}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }
          const opacity = getOpacity(cell.amount, dailySpending.maxAmount);
          const dayNum = Number(cell.date.slice(-2));
          const isSelected = cell.date === selectedDay;
          return (
            <button
              key={cell.date}
              type="button"
              className={`aspect-square rounded-sm flex items-center justify-center text-[10px] transition-all ${
                isSelected ? "ring-2 ring-foreground/50" : "hover:ring-1 hover:ring-foreground/30"
              }`}
              style={opacity > 0
                ? { backgroundColor: `color-mix(in srgb, var(--viz-expense) ${Math.round(opacity * 100)}%, transparent)` }
                : undefined
              }
              onClick={() => setSelectedDay(isSelected ? null : cell.date)}
              onMouseEnter={() => { if (!selectedDay) setSelectedDay(cell.date); }}
            >
              <span className={opacity >= 0.6 ? "text-white/80" : "text-muted-foreground/70"}>
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1 pt-1">
        <span className="text-[10px] text-muted-foreground/60">Less</span>
        {LEGEND_OPACITIES.map((op) => (
          <div
            key={op}
            className="size-3 rounded-sm"
            style={op > 0
              ? { backgroundColor: `color-mix(in srgb, var(--viz-expense) ${Math.round(op * 100)}%, transparent)` }
              : { backgroundColor: "var(--muted)" }
            }
          />
        ))}
        <span className="text-[10px] text-muted-foreground/60">More</span>
      </div>
    </div>
  );

  // Mobile: stacked (heatmap then detail below when selected)
  // Desktop: side by side
  return (
    <DsChartCard title={title} size={size}>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:w-1/2">{heatmapGrid}</div>
        {/* Desktop: always visible side panel */}
        <div className="hidden min-h-[120px] md:block md:w-1/2 md:border-l md:border-border/40 md:pl-6">
          <DetailPanel day={selectedData} t={t} />
        </div>
      </div>

      {/* Mobile: show detail below when tapped */}
      {selectedData && (
        <div className="mt-4 border-t border-border/40 pt-4 md:hidden">
          <DetailPanel day={selectedData} t={t} />
        </div>
      )}
    </DsChartCard>
  );
}
