import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { MonthlySummaryRow } from "@/lib/domain/mortgageMath";

interface MortgageAmortizationChartProps {
  rows: MonthlySummaryRow[];
}

export function MortgageAmortizationChart({ rows }: MortgageAmortizationChartProps) {
  const [mode, setMode] = useState<"balance" | "principal-interest">("balance");
  const data = useMemo(
    () =>
      rows.map((row) => ({
        month: row.monthKey.slice(2),
        balance: row.balance,
        principal: row.principal,
        interest: row.interest,
      })),
    [rows]
  );

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Amortization</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "balance" ? "default" : "outline"}
            onClick={() => setMode("balance")}
          >
            Balance
          </Button>
          <Button
            size="sm"
            variant={mode === "principal-interest" ? "default" : "outline"}
            onClick={() => setMode("principal-interest")}
          >
            Principal vs Interest
          </Button>
        </div>
      </div>
      <ChartContainer className="h-[260px] w-full" config={{}}>
        {mode === "balance" ? (
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="balance" stroke="var(--viz-series-2)" strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="principal" stackId="a" fill="var(--viz-series-1)" />
            <Bar dataKey="interest" stackId="a" fill="var(--viz-series-3)" />
          </BarChart>
        )}
      </ChartContainer>
    </section>
  );
}
