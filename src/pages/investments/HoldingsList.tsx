import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { HoldingMetrics } from "@/lib/investmentsMath";
import type { InvestmentHolding } from "@/types/investments";

interface HoldingsListProps {
  holdings: InvestmentHolding[];
  metrics: HoldingMetrics[];
  onAdd: () => void;
  onEdit: (holding: InvestmentHolding) => void;
  onDelete: (holdingId: string) => void;
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string | null;
  t: (key: string) => string;
}

export function HoldingsList({
  holdings,
  metrics,
  onAdd,
  onEdit,
  onDelete,
  onSelectSymbol,
  selectedSymbol,
  t,
}: HoldingsListProps) {
  const byId = new Map(metrics.map((m) => [m.holdingId, m]));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("investments.holdings")}</h2>
        <Button className="h-11" onClick={onAdd}>
          {t("investments.addHolding")}
        </Button>
      </div>
      {holdings.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          {t("investments.noHoldings")}
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {holdings.map((holding) => {
            const metric = byId.get(holding.id);
            const isSelected = selectedSymbol === holding.symbol;
            return (
              <div
                key={holding.id}
                role="button"
                tabIndex={0}
                className={`w-full text-left p-4 hover:bg-muted/40 ${
                  isSelected ? "bg-muted/40" : ""
                }`}
                onClick={() => onSelectSymbol(holding.symbol)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectSymbol(holding.symbol);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {holding.symbol}
                      {holding.name ? ` · ${holding.name}` : ""}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("investments.qty")}: {holding.quantity}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("investments.invested")}: {formatCurrency(holding.investedAmount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {t("investments.marketValue")}: {formatCurrency(metric?.marketValue ?? 0)}
                    </div>
                    <div
                      className={`text-sm ${
                        (metric?.unrealizedPnL ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {t("investments.unrealized")}: {formatCurrency(metric?.unrealizedPnL ?? 0)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(holding);
                    }}
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-9"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(holding.id);
                    }}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
