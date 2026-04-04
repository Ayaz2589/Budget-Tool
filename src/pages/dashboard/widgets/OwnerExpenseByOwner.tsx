import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, UserCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { percentOfTotal } from "@/lib/math";
import { cn } from "@/lib/utils";
import { DsChartCard, DsEmptyState } from "@/components/ds";
import type { DashboardOwnerNetRow } from "@/types/dashboard";
import type { buildOwnerExpenseItems } from "@/pages/dashboard/dashboardSelectors";
import type { WidgetSize } from "@/lib/widgets/widget";

const OWNER_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-2)",
  "var(--viz-series-3)",
  "var(--viz-series-4)",
];

interface OwnerExpenseByOwnerProps {
  visibleOwnerNetRows: DashboardOwnerNetRow[];
  ownerExpenseItemsByOwner: Map<string, ReturnType<typeof buildOwnerExpenseItems>>;
  totalSpentForSelectedRange: number;
  percentFormatter: Intl.NumberFormat;
  size?: WidgetSize;
}

export function OwnerExpenseByOwner({
  visibleOwnerNetRows,
  ownerExpenseItemsByOwner,
  totalSpentForSelectedRange,
  percentFormatter,
  size = "lg",
}: OwnerExpenseByOwnerProps) {
  const { t } = useTranslation();
  const [expandedOwnerKey, setExpandedOwnerKey] = useState<string | null>(null);
  const title = t("dashboard.sectionExpenseByOwner");

  if (visibleOwnerNetRows.length === 0) {
    return (
      <DsChartCard title={title} size={size}>
        <DsEmptyState icon={<UserCircle className="size-5" />} title={t("dashboard.sectionNoOwnerExpenses")} className="py-4" />
      </DsChartCard>
    );
  }

  // sm: summary
  if (size === "sm") {
    const total = visibleOwnerNetRows.reduce((sum, r) => sum + r.gross, 0);
    return (
      <DsChartCard title={title} size={size}>
        <p className="text-lg font-semibold">{formatCurrency(total)}</p>
        <p className="text-xs text-muted-foreground">
          {visibleOwnerNetRows.length} {visibleOwnerNetRows.length === 1 ? "owner" : "owners"}
        </p>
      </DsChartCard>
    );
  }

  // Settlement hero — who owes whom
  const settlementHero = (() => {
    if (visibleOwnerNetRows.length !== 2) return null;
    const [a, b] = visibleOwnerNetRows;
    if (!a || !b) return null;
    const diff = a.net - b.net;
    if (Math.abs(diff) < 0.01) return null;
    const higher = diff > 0 ? a : b;
    const lower = diff > 0 ? b : a;
    return {
      from: lower.owner,
      to: higher.owner,
      amount: Math.abs(higher.net - lower.net) / 2,
    };
  })();

  // Proportion bar
  const totalGross = visibleOwnerNetRows.reduce((sum, r) => sum + r.gross, 0);

  // md: compact
  if (size === "md") {
    return (
      <DsChartCard title={title} size={size}>
        {settlementHero && (
          <p className="text-sm font-medium">
            {settlementHero.from} owes {settlementHero.to}{" "}
            <span className="font-semibold">{formatCurrency(settlementHero.amount)}</span>
          </p>
        )}
        <div className="space-y-2 pt-1">
          {visibleOwnerNetRows.map((row, i) => (
            <div key={row.owner} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: OWNER_COLORS[i % OWNER_COLORS.length] }} />
                <span className="font-medium">{row.owner}</span>
              </span>
              <span className="font-medium">{formatCurrency(row.net)}</span>
            </div>
          ))}
        </div>
      </DsChartCard>
    );
  }

  // lg: full redesigned layout
  return (
    <DsChartCard title={title} size={size}>
      <div className="space-y-5">
        {/* Settlement hero */}
        {settlementHero && (
          <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
            <p className="text-sm text-muted-foreground">Settlement</p>
            <p className="text-lg font-semibold">
              {settlementHero.from} owes {settlementHero.to}{" "}
              <span className="text-emerald-500">{formatCurrency(settlementHero.amount)}</span>
            </p>
          </div>
        )}

        {/* Proportion bar */}
        {totalGross > 0 && (
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {visibleOwnerNetRows.map((row, i) => {
              const pct = (row.gross / totalGross) * 100;
              return (
                <div
                  key={row.owner}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: OWNER_COLORS[i % OWNER_COLORS.length],
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Per-owner rows */}
        <div className="space-y-2">
          {visibleOwnerNetRows.map((row, i) => {
            const ownerShare = percentOfTotal(row.gross, totalSpentForSelectedRange);
            const isExpanded = expandedOwnerKey === row.owner;
            const ownerItems = ownerExpenseItemsByOwner.get(row.owner) ?? [];

            return (
              <div key={row.owner}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors md:flex-row",
                    isExpanded ? "bg-muted/30" : "hover:bg-muted/20",
                  )}
                  onClick={() => setExpandedOwnerKey(isExpanded ? null : row.owner)}
                >
                  {/* Mobile: stacked layout */}
                  <div className="flex w-full flex-col gap-1 md:hidden">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        <span
                          className="inline-block size-3 rounded-full"
                          style={{ backgroundColor: OWNER_COLORS[i % OWNER_COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{row.owner}</span>
                        <span className="text-xs text-muted-foreground">
                          {percentFormatter.format(ownerShare)}
                        </span>
                      </span>
                      {isExpanded
                        ? <ChevronUp className="size-4 text-muted-foreground" />
                        : <ChevronDown className="size-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="ml-6 flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatCurrency(row.net)}</span>
                      {row.net !== row.gross && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(row.gross)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desktop: horizontal layout */}
                  <span className="hidden items-center gap-3 md:flex">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ backgroundColor: OWNER_COLORS[i % OWNER_COLORS.length] }}
                    />
                    <span>
                      <span className="text-sm font-medium">{row.owner}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {percentFormatter.format(ownerShare)}
                      </span>
                    </span>
                  </span>
                  <span className="hidden items-center gap-3 md:flex">
                    <span className="text-right">
                      <span className="text-sm font-semibold">{formatCurrency(row.net)}</span>
                      {row.net !== row.gross && (
                        <span className="ml-2 text-xs text-muted-foreground line-through">
                          {formatCurrency(row.gross)}
                        </span>
                      )}
                    </span>
                    {isExpanded
                      ? <ChevronUp className="size-4 text-muted-foreground" />
                      : <ChevronDown className="size-4 text-muted-foreground" />
                    }
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="ml-6 mt-2 space-y-2 pb-2">
                    {/* Transfer summary */}
                    {(row.sent > 0 || row.received > 0) && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {row.sent > 0 && <span>Sent: {formatCurrency(row.sent)}</span>}
                        {row.received > 0 && <span>Received: {formatCurrency(row.received)}</span>}
                      </div>
                    )}

                    {/* Transaction list */}
                    {ownerItems.length > 0 && (
                      <div className="space-y-1">
                        {ownerItems.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-md bg-muted/20 px-2.5 py-1.5 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">{item.description || "\u2014"}</p>
                              <p className="truncate text-muted-foreground">
                                {formatDate(item.date)} · {item.category || t("common.uncategorized")}
                              </p>
                            </div>
                            <p className="shrink-0 pl-3 font-medium">{formatCurrency(item.allocatedAmount)}</p>
                          </div>
                        ))}
                        {ownerItems.length > 5 && (
                          <p className="px-2.5 text-xs text-muted-foreground">
                            +{ownerItems.length - 5} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DsChartCard>
  );
}
