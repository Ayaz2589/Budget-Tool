import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useBudget } from "@/context/BudgetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  getMarketDataCooldownRemainingMs,
  getOhlc,
  type OhlcTimeframe,
} from "@/lib/marketData";
import { computePortfolioMetrics } from "@/lib/investmentsMath";
import type { InvestmentHolding, OhlcBar } from "@/types/investments";
import { HoldingsList } from "./HoldingsList";
import { HoldingDialog } from "./HoldingDialog";
import { PortfolioSelector } from "./PortfolioSelector";

type ChartMode = "line" | "candlestick";

function CandlestickChart({
  data,
}: {
  data: OhlcBar[];
}) {
  if (data.length === 0) {
    return <div className="h-[320px] flex items-center justify-center text-muted-foreground">No chart data.</div>;
  }
  const width = 760;
  const height = 320;
  const pad = 24;
  const min = Math.min(...data.map((d) => d.low));
  const max = Math.max(...data.map((d) => d.high));
  const range = Math.max(0.0001, max - min);
  const candleWidth = Math.max(4, Math.floor((width - pad * 2) / data.length) - 2);
  const xStep = (width - pad * 2) / Math.max(1, data.length - 1);
  const yFor = (value: number) =>
    height - pad - ((value - min) / range) * (height - pad * 2);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[640px] h-[320px]">
        {data.map((bar, index) => {
          const x = pad + xStep * index;
          const yHigh = yFor(bar.high);
          const yLow = yFor(bar.low);
          const yOpen = yFor(bar.open);
          const yClose = yFor(bar.close);
          const bodyTop = Math.min(yOpen, yClose);
          const bodyHeight = Math.max(1, Math.abs(yOpen - yClose));
          const isUp = bar.close >= bar.open;
          const color = isUp ? "#16a34a" : "#dc2626";
          return (
            <g key={`${bar.time}-${index}`}>
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.5" />
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={isUp ? "transparent" : color}
                stroke={color}
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function sliceBarsForTimeframe(allBars: OhlcBar[], timeframe: OhlcTimeframe): OhlcBar[] {
  const points = timeframe === "1W"
    ? 7
    : timeframe === "1M"
      ? 30
      : timeframe === "3M"
        ? 90
        : timeframe === "6M"
          ? 180
          : 365;
  return allBars.slice(-points);
}

export function InvestmentsPage() {
  const { t } = useTranslation();
  const budget = useBudget();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    budget.investmentPortfolios[0]?.id ?? null
  );
  const [showHoldingDialog, setShowHoldingDialog] = useState(false);
  const [editingHolding, setEditingHolding] = useState<InvestmentHolding | null>(null);
  const [timeframe, setTimeframe] = useState<OhlcTimeframe>("1M");
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);
  const [quoteBySymbol, setQuoteBySymbol] = useState<
    Record<
      string,
      {
        symbol: string;
        price: number;
        change: number;
        changePercent: number;
        asOf: string;
      }
    >
  >({});
  const [allOhlc, setAllOhlc] = useState<OhlcBar[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingPortfolioName, setPendingPortfolioName] = useState("");

  const selectedPortfolio = useMemo(
    () =>
      budget.investmentPortfolios.find((p) => p.id === selectedPortfolioId) ??
      null,
    [budget.investmentPortfolios, selectedPortfolioId]
  );

  useEffect(() => {
    if (!selectedPortfolioId && budget.investmentPortfolios.length > 0) {
      setSelectedPortfolioId(budget.investmentPortfolios[0]!.id);
    }
  }, [budget.investmentPortfolios, selectedPortfolioId]);

  useEffect(() => {
    if (!selectedPortfolio || selectedPortfolio.holdings.length === 0) {
      setChartSymbol(null);
      return;
    }
    const firstSymbol = selectedPortfolio.holdings[0]!.symbol;
    setChartSymbol((current) => current ?? firstSymbol);
  }, [selectedPortfolio]);

  const refreshData = async () => {
    if (!selectedPortfolio || selectedPortfolio.holdings.length === 0) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const symbols = Array.from(new Set(selectedPortfolio.holdings.map((h) => h.symbol)));
      const symbolForChart = chartSymbol ?? symbols[0]!;
      // Fetch once at max range, then slice locally for shorter ranges.
      const ohlcBars = await getOhlc(symbolForChart, "1Y");
      setAllOhlc(ohlcBars);
      const latestBar = ohlcBars[ohlcBars.length - 1];
      const prevBar = ohlcBars[ohlcBars.length - 2];
      if (latestBar) {
        const change = prevBar ? latestBar.close - prevBar.close : 0;
        const changePercent = prevBar && prevBar.close > 0 ? change / prevBar.close : 0;
        setQuoteBySymbol((prev) => ({
          ...prev,
          [symbolForChart]: {
            symbol: symbolForChart,
            price: latestBar.close,
            change,
            changePercent,
            asOf: new Date().toISOString(),
          },
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const isRateLimited = message.toLowerCase().includes("rate limit");
      const isDailyRateLimited =
        isRateLimited &&
        (message.toLowerCase().includes("per day") ||
          message.toLowerCase().includes("daily") ||
          message.toLowerCase().includes("25 requests"));
      const normalizedMessage = isRateLimited
        ? isDailyRateLimited
          ? t("investments.rateLimitedDaily")
          : t("investments.rateLimited", {
              seconds: Math.ceil(getMarketDataCooldownRemainingMs() / 1000),
            })
        : message || t("investments.refreshError");
      setErrorMessage(normalizedMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPortfolio || selectedPortfolio.holdings.length === 0) return;
    void refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPortfolioId, chartSymbol]);

  const portfolioMetrics = useMemo(() => {
    if (!selectedPortfolio) return null;
    return computePortfolioMetrics(selectedPortfolio, quoteBySymbol);
  }, [quoteBySymbol, selectedPortfolio]);

  const createPortfolio = () => {
    const defaultName = pendingPortfolioName.trim() || `Portfolio ${budget.investmentPortfolios.length + 1}`;
    budget.addPortfolio(defaultName);
    setPendingPortfolioName("");
    setTimeout(() => {
      const last = budget.investmentPortfolios[budget.investmentPortfolios.length - 1];
      if (last) setSelectedPortfolioId(last.id);
    }, 0);
  };

  const renamePortfolio = () => {
    if (!selectedPortfolioId || !selectedPortfolio) return;
    const nextName = window.prompt(t("investments.renamePrompt"), selectedPortfolio.name);
    if (!nextName) return;
    budget.renamePortfolio(selectedPortfolioId, nextName);
  };

  const deletePortfolio = () => {
    if (!selectedPortfolioId || !selectedPortfolio) return;
    const confirmed = window.confirm(
      t("investments.deletePortfolioConfirm", { name: selectedPortfolio.name })
    );
    if (!confirmed) return;
    budget.deletePortfolio(selectedPortfolioId);
    setSelectedPortfolioId(null);
  };

  const addOrUpdateHolding = (holding: Omit<InvestmentHolding, "id">) => {
    if (!selectedPortfolioId) return;
    if (editingHolding) {
      budget.updateHolding(selectedPortfolioId, editingHolding.id, holding);
      setEditingHolding(null);
      return;
    }
    budget.addHolding(selectedPortfolioId, holding);
  };

  const visibleBars = useMemo(
    () => sliceBarsForTimeframe(allOhlc, timeframe),
    [allOhlc, timeframe],
  );

  const lineData = visibleBars.map((bar) => ({
    date: bar.time,
    close: bar.close,
  }));

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-auto px-4 md:px-6 py-4 gap-4 pb-24 md:pb-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("investments.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("investments.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Input
          className="h-11 md:max-w-sm"
          placeholder={t("investments.newPortfolioPlaceholder")}
          value={pendingPortfolioName}
          onChange={(event) => setPendingPortfolioName(event.target.value)}
        />
        <PortfolioSelector
          portfolios={budget.investmentPortfolios}
          selectedPortfolioId={selectedPortfolioId}
          onSelect={setSelectedPortfolioId}
          onCreate={createPortfolio}
          onRename={renamePortfolio}
          onDelete={deletePortfolio}
          disabled={loading}
          t={t}
        />
      </div>

      {!selectedPortfolio ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {t("investments.noPortfolio")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,1fr] gap-4">
          <Card>
            <CardContent className="p-4">
              <HoldingsList
                holdings={selectedPortfolio.holdings}
                metrics={portfolioMetrics?.byHolding ?? []}
                onAdd={() => {
                  setEditingHolding(null);
                  setShowHoldingDialog(true);
                }}
                onEdit={(holding) => {
                  setEditingHolding(holding);
                  setShowHoldingDialog(true);
                }}
                onDelete={(holdingId) => {
                  budget.removeHolding(selectedPortfolio.id, holdingId);
                }}
                onSelectSymbol={setChartSymbol}
                selectedSymbol={chartSymbol}
                t={t}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("investments.metrics")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Metric label={t("investments.totalInvested")} value={formatCurrency(portfolioMetrics?.totalInvested ?? 0)} />
                <Metric label={t("investments.totalValue")} value={formatCurrency(portfolioMetrics?.totalMarketValue ?? 0)} />
                <Metric label={t("investments.totalPnL")} value={formatCurrency(portfolioMetrics?.totalUnrealizedPnL ?? 0)} />
                <Metric label={t("investments.totalPnLPercent")} value={formatPercent(portfolioMetrics?.totalUnrealizedPnLPercent ?? 0)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{t("investments.chart")}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      className="h-9"
                      variant={chartMode === "line" ? "default" : "outline"}
                      onClick={() => setChartMode("line")}
                    >
                      {t("investments.line")}
                    </Button>
                    <Button
                      className="h-9"
                      variant={chartMode === "candlestick" ? "default" : "outline"}
                      onClick={() => setChartMode("candlestick")}
                    >
                      {t("investments.candlestick")}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {(["1W", "1M", "3M", "6M", "1Y"] as OhlcTimeframe[]).map((value) => (
                    <Button
                      key={value}
                      className="h-8"
                      variant={timeframe === value ? "default" : "outline"}
                      onClick={() => setTimeframe(value)}
                      disabled={loading}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {errorMessage ? (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {errorMessage}
                  </div>
                ) : null}
                {!chartSymbol ? (
                  <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                    {t("investments.noSymbolForChart")}
                  </div>
                ) : chartMode === "line" ? (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} />
                        <YAxis domain={["dataMin", "dataMax"]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="close" stroke="#22c55e" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <CandlestickChart data={visibleBars} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <HoldingDialog
        open={showHoldingDialog}
        onOpenChange={(open) => {
          setShowHoldingDialog(open);
          if (!open) setEditingHolding(null);
        }}
        initialHolding={editingHolding}
        onSave={addOrUpdateHolding}
        t={t}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
