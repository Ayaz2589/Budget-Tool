import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart } from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { percentOfTotal } from "@/lib/math";
import { DsChartCard, DsDataRow, DsEmptyState, DsLegendList } from "@/components/ds";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { DashboardOwnerSlice, DashboardOwnerNetRow } from "@/types/dashboard";
import type { buildOwnerExpenseItems } from "@/pages/dashboard/dashboardSelectors";
import type { WidgetSize } from "@/types/widget";

const DONUT_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-4)",
  "var(--viz-series-3)",
  "var(--viz-series-2)",
  "var(--viz-series-5)",
  "var(--viz-expense)",
  "var(--viz-debt)",
];

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

interface DashboardOwnerSplitProps {
  ownerSlices: DashboardOwnerSlice[];
  visibleOwnerNetRows: DashboardOwnerNetRow[];
  ownerExpenseItemsByOwner: Map<string, ReturnType<typeof buildOwnerExpenseItems>>;
  totalSpentForSelectedRange: number;
  percentFormatter: Intl.NumberFormat;
  size?: WidgetSize;
}

export function DashboardOwnerSplit({
  ownerSlices,
  visibleOwnerNetRows,
  ownerExpenseItemsByOwner,
  totalSpentForSelectedRange,
  percentFormatter,
  size,
}: DashboardOwnerSplitProps) {
  const { t } = useTranslation();
  const [expandedOwnerKey, setExpandedOwnerKey] = useState<string | null>(null);
  const effectiveSize: WidgetSize = size ?? "md";

  const chartTitle = t("dashboard.chartSharedVsIndividualSpending");

  if (ownerSlices.length === 0) {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <DsEmptyState title={t("dashboard.chartNoOwnerSplitData")} className="py-4" />
      </DsChartCard>
    );
  }

  // sm: summary text (owner count + largest contributor)
  if (effectiveSize === "sm") {
    const sorted = [...ownerSlices].sort((a, b) => b.value - a.value);
    const largest = sorted[0];
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t("dashboard.splitOwners")}
            </span>
            <span className="text-sm font-semibold">{ownerSlices.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground truncate mr-2">
              {largest.label}
            </span>
            <span className="text-sm font-semibold shrink-0">{formatCurrency(largest.value)}</span>
          </div>
        </div>
      </DsChartCard>
    );
  }

  // Single-owner: skip pie chart, show direct summary at md/lg
  if (ownerSlices.length === 1) {
    const single = ownerSlices[0];
    return (
      <>
        <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium truncate">{single.label}</span>
            <span className="text-lg font-semibold">{formatCurrency(single.value)}</span>
          </div>
        </DsChartCard>
        {(effectiveSize === "xl" || effectiveSize === "lg") && (
          <OwnerExpenseByOwner
            visibleOwnerNetRows={visibleOwnerNetRows}
            ownerExpenseItemsByOwner={ownerExpenseItemsByOwner}
            totalSpentForSelectedRange={totalSpentForSelectedRange}
            percentFormatter={percentFormatter}
            expandedOwnerKey={expandedOwnerKey}
            setExpandedOwnerKey={setExpandedOwnerKey}
          />
        )}
      </>
    );
  }

  const tooltipContent = (
    <ChartTooltipContent
      className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
      labelClassName="text-sm font-semibold"
      valueFormatter={(value) => formatCurrency(asNumber(value))}
    />
  );

  const chartConfig = { value: { label: t("dashboard.chartAmount"), color: DONUT_COLORS[0]! } };

  const pieChart = (
    <ChartContainer config={chartConfig} heightMobile={110} heightDesktop={effectiveSize === "xl" ? 400 : effectiveSize === "lg" ? 220 : 110}>
      <PieChart>
        <Pie
          data={ownerSlices}
          dataKey="value"
          nameKey="label"
          innerRadius={effectiveSize === "md" ? 30 : undefined}
          outerRadius={effectiveSize === "md" ? 48 : effectiveSize === "lg" ? 80 : 90}
        >
          {ownerSlices.map((slice, index) => (
            <Cell key={slice.key} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <ChartTooltip content={tooltipContent} />
      </PieChart>
    </ChartContainer>
  );

  const legend = (
    <DsLegendList
      items={ownerSlices.map((slice, index) => ({
        key: slice.key,
        label: slice.label,
        value: formatCurrency(slice.value),
        color: DONUT_COLORS[index % DONUT_COLORS.length]!,
      }))}
    />
  );

  // md: pie chart + legend only (no detail rows)
  if (effectiveSize === "md") {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        <div className="space-y-2">
          {pieChart}
          {legend}
        </div>
      </DsChartCard>
    );
  }

  // lg (~588×328px): pie chart + legend (no detail rows)
  if (effectiveSize === "lg") {
    return (
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        {pieChart}
        {legend}
      </DsChartCard>
    );
  }

  // xl (~588×664px): full pie chart + legend + OwnerExpenseByOwner detail rows
  return (
    <>
      <DsChartCard title={chartTitle} className="min-w-0" size={effectiveSize}>
        {pieChart}
        {legend}
      </DsChartCard>

      <OwnerExpenseByOwner
        visibleOwnerNetRows={visibleOwnerNetRows}
        ownerExpenseItemsByOwner={ownerExpenseItemsByOwner}
        totalSpentForSelectedRange={totalSpentForSelectedRange}
        percentFormatter={percentFormatter}
        expandedOwnerKey={expandedOwnerKey}
        setExpandedOwnerKey={setExpandedOwnerKey}
      />
    </>
  );
}

function OwnerExpenseByOwner({
  visibleOwnerNetRows,
  ownerExpenseItemsByOwner,
  totalSpentForSelectedRange,
  percentFormatter,
  expandedOwnerKey,
  setExpandedOwnerKey,
}: {
  visibleOwnerNetRows: DashboardOwnerNetRow[];
  ownerExpenseItemsByOwner: Map<string, ReturnType<typeof buildOwnerExpenseItems>>;
  totalSpentForSelectedRange: number;
  percentFormatter: Intl.NumberFormat;
  expandedOwnerKey: string | null;
  setExpandedOwnerKey: (key: string | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <section data-tour="dashboard-expense-by-owner" className="space-y-2 pt-2">
      <h2 className="inline-flex items-center gap-1.5 text-base font-semibold">
        {t("dashboard.sectionExpenseByOwner")}
      </h2>
      {visibleOwnerNetRows.length === 0 ? (
        <DsEmptyState title={t("dashboard.sectionNoOwnerExpenses")} className="py-4" />
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card">
          <div className="grid grid-cols-2 gap-2 border-b border-[var(--border-subtle)] px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <p>{t("dashboard.grossExpenseByOwner")}</p>
            <p className="text-right">{t("dashboard.netAfterTransfers")}</p>
          </div>
          <div>
            {visibleOwnerNetRows.map((row) => {
              const ownerShareOfTotal = percentOfTotal(
                row.gross,
                totalSpentForSelectedRange,
              );
              const isExpanded = expandedOwnerKey === row.owner;
              const ownerItems = ownerExpenseItemsByOwner.get(row.owner) ?? [];
              const transferImpact = row.received - row.sent;
              const netToneClass =
                row.net >= 0 ? "text-foreground" : "text-destructive";
              const transferToneClass =
                transferImpact >= 0 ? "text-emerald-500" : "text-amber-500";
              const transferImpactDisplay =
                transferImpact > 0
                  ? `+${formatCurrency(transferImpact)}`
                  : formatCurrency(transferImpact);
              return (
                <DsDataRow
                  key={row.owner}
                  title={row.owner}
                  subtitle={t("dashboard.ofTotalSpent", {
                    percent: percentFormatter.format(ownerShareOfTotal),
                  })}
                  trailing={
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {t("dashboard.netAfterTransfers")}
                        </p>
                        <p className={`text-2xl font-bold leading-none ${netToneClass}`}>
                          {formatCurrency(row.net)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("dashboard.grossShort")}:{" "}
                          <span className="font-semibold text-foreground">
                            {formatCurrency(row.gross)}
                          </span>
                        </p>
                        <p className={`text-xs font-semibold ${transferToneClass}`}>
                          {t("dashboard.transferImpact")}: {transferImpactDisplay}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  }
                  onClick={() =>
                    setExpandedOwnerKey(expandedOwnerKey === row.owner ? null : row.owner)
                  }
                  ariaLabel={row.owner}
                  meta={
                    isExpanded ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <p>
                            {t("dashboard.grossExpenseByOwner")}: {formatCurrency(row.gross)}
                          </p>
                          <p className="text-right text-sm font-semibold">
                            {t("dashboard.netAfterTransfers")}:{" "}
                            <span className={netToneClass}>{formatCurrency(row.net)}</span>
                          </p>
                          <p>{t("dashboard.transfersSent")}: {formatCurrency(row.sent)}</p>
                          <p className="text-right">
                            {t("dashboard.transfersReceived")}: {formatCurrency(row.received)}
                          </p>
                          <p className="col-span-2 text-right">
                            {t("dashboard.transferImpact")}:{" "}
                            <span className={transferToneClass}>
                              {transferImpactDisplay}
                            </span>
                          </p>
                        </div>
                        {ownerItems.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {t("dashboard.sectionNoOwnerExpenseItems")}
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {ownerItems.map((item) => (
                              <div
                                key={`${row.owner}-${item.id}`}
                                className="flex items-start justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5 text-xs"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-foreground">
                                    {item.description || "\u2014"}
                                  </p>
                                  <p className="truncate text-muted-foreground">
                                    {formatDate(item.date)} {"\u00B7"}{" "}
                                    {item.category || t("common.uncategorized")} {"\u00B7"}{" "}
                                    {t("addTransaction.paidBy")}:{" "}
                                    {item.paidByOwner || t("common.noOwner")}
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="font-medium text-foreground">
                                    {formatCurrency(item.allocatedAmount)}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {formatCurrency(item.totalAmount)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : undefined
                  }
                  className={isExpanded ? "bg-muted/20 cursor-pointer" : "cursor-pointer"}
                  dense
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
