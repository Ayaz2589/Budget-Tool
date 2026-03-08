import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { EXPENSE_SOURCE_LOCALE_KEYS } from "@/lib/format/sourceLabels";
import { CreditCard } from "lucide-react";
import { DsDataRow, DsEmptyState } from "@/components/ds";
import type { Expense } from "@/types/core";
import type { WidgetSize } from "@/lib/widgets/widget";

interface SpendBySourceRow {
  source: Expense["source"];
  value: number;
}

interface SpendBySourceProps {
  spendBySourceRows: SpendBySourceRow[];
  size?: WidgetSize;
}

export function SpendBySource({ spendBySourceRows, size = "md" }: SpendBySourceProps) {
  const { t } = useTranslation();
  const total = spendBySourceRows.reduce((sum, r) => sum + r.value, 0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1);
  }, []);

  const refCallback = useCallback(
    (node: HTMLDivElement | null) => {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (node) requestAnimationFrame(updateScroll);
    },
    [updateScroll],
  );

  // sm (~141×104px): total spend + source count badge
  if (size === "sm") {
    return (
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">{t("dashboard.sectionSpendByCardSource")}</h3>
        <p className="mt-1 text-lg font-semibold">{formatCurrency(total)}</p>
        <p className="text-xs text-muted-foreground">
          {t("dashboard.sourceCount", { count: spendBySourceRows.length })}
        </p>
      </div>
    );
  }

  const limit = size === "lg" ? spendBySourceRows.length : 4;
  const displayRows = spendBySourceRows.slice(0, limit);

  return (
    <div>
      <h3 className="py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">{t("dashboard.sectionSpendByCardSource")}</h3>
      {spendBySourceRows.length === 0 ? (
        <DsEmptyState icon={<CreditCard className="size-5" />} title={t("dashboard.sectionNoSpendByCardSource")} className="py-4" />
      ) : (
        <div className="relative">
          <div
            ref={refCallback}
            onScroll={updateScroll}
            className="max-h-[320px] overflow-y-auto"
          >
            {displayRows.map((row) => (
              <DsDataRow
                key={row.source}
                title={t(`addTransaction.${EXPENSE_SOURCE_LOCALE_KEYS[row.source]}`)}
                subtitle={size === "lg" && total > 0
                  ? `${Math.round((row.value / total) * 100)}%`
                  : undefined}
                trailing={<p className="font-semibold">{formatCurrency(row.value)}</p>}
                dense
              />
            ))}
          </div>

          {/* Scroll hint — visible shadow + chevron when more content below */}
          {canScrollDown && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
              <div className="h-10 w-full bg-gradient-to-t from-background to-transparent" />
              <div className="absolute bottom-1 flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
                <ChevronDown className="size-3" />
                {t("common.scrollForMore", { defaultValue: "Scroll for more" })}
              </div>
            </div>
          )}

          {size === "md" && spendBySourceRows.length > 4 && (
            <p className="px-4 py-2 text-xs text-muted-foreground">
              {t("dashboard.moreItemsCount", { count: spendBySourceRows.length - 4 })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
