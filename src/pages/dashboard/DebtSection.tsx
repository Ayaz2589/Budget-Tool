import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

export interface DebtSummaryData {
  totalRemaining: number;
  totalPaidOff: number;
  chartData: { metric: string; value: number; fill: string }[];
  hasDebtData: boolean;
}

const DEBT_CHART_CONFIG = {
  remaining: {
    label: "Remaining balance",
    theme: {
      light: "oklch(0.55 0.18 35)",
      dark: "oklch(0.65 0.16 35)",
    },
  },
  paidOff: {
    label: "Paid off",
    theme: {
      light: "oklch(0.55 0.2 145)",
      dark: "oklch(0.65 0.18 145)",
    },
  },
} satisfies ChartConfig;

interface DebtSectionProps {
  debtSummary: DebtSummaryData;
}

export function DebtSection({ debtSummary }: DebtSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total debt: remaining vs paid off
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Remaining balance (what you still owe) and total paid off across all
          debts.{" "}
          <Link to="/debt" className="font-medium text-primary hover:underline">
            View & manage debt →
          </Link>
        </p>
      </CardHeader>
      <CardContent>
        {debtSummary.hasDebtData ? (
          <>
            <div className="flex flex-wrap items-baseline gap-4 mb-4">
              <span className="text-sm">
                Remaining:{" "}
                <span className="font-semibold">
                  {formatCurrency(debtSummary.totalRemaining)}
                </span>
              </span>
              <span className="text-sm">
                Paid off:{" "}
                <span className="font-semibold text-green-600 dark:text-green-500">
                  {formatCurrency(debtSummary.totalPaidOff)}
                </span>
              </span>
            </div>
            <ChartContainer
              config={DEBT_CHART_CONFIG}
              className="h-[180px] w-full"
            >
              <BarChart
                data={debtSummary.chartData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 100, bottom: 5 }}
                accessibilityLayer
              >
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <YAxis
                  type="category"
                  dataKey="metric"
                  tickLine={false}
                  axisLine={false}
                  width={95}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        typeof value === "number"
                          ? formatCurrency(value)
                          : String(value ?? "")
                      }
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={32}>
                  {debtSummary.chartData.map((_, i) => (
                    <Cell key={i} fill={debtSummary.chartData[i]!.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No debt yet.{" "}
            <Link
              to="/debt"
              className="font-medium text-primary hover:underline"
            >
              Add a debt
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
