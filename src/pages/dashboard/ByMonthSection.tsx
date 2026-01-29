import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { MonthTotals } from "@/lib/totals";

function getChartConfig(t: (key: string) => string) {
  return {
    earned: {
      label: t("common.totalEarned"),
      theme: {
        light: "oklch(0.55 0.2 160)",
        dark: "oklch(0.7 0.18 165)",
      },
    },
    spent: {
      label: t("common.totalSpent"),
      theme: {
        light: "oklch(0.72 0.18 55)",
        dark: "oklch(0.78 0.15 55)",
      },
    },
  } satisfies ChartConfig;
}

interface ByMonthSectionProps {
  chartData: { month: string; earned: number; spent: number }[];
  months: MonthTotals[];
  currentMonthKey: string;
}

export function ByMonthSection({
  chartData,
  months,
  currentMonthKey,
}: ByMonthSectionProps) {
  const { t } = useTranslation();
  const CHART_CONFIG = getChartConfig(t);
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.monthlyBreakdown")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.totalEarnedVsSpentByMonth")}
          </p>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={CHART_CONFIG} className="h-[300px] w-full">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                accessibilityLayer
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item: { fill?: string }) => (
                        <div className="flex w-full flex-wrap items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: item?.fill }}
                          />
                          <div className="flex flex-1 justify-between leading-none items-center gap-2">
                            <span className="text-muted-foreground">
                              {CHART_CONFIG[name as keyof typeof CHART_CONFIG]
                                ?.label ?? name}
                            </span>
                            <span className="text-foreground font-mono font-medium tabular-nums">
                              {typeof value === "number"
                                ? formatCurrency(value)
                                : String(value ?? "")}
                            </span>
                          </div>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="earned"
                  fill="var(--color-earned)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="spent"
                  fill="var(--color-spent)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("dashboard.noDataYet")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.spendingByMonth")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.totalsPerMonth")}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.month")}</TableHead>
                  <TableHead className="text-right">
                    {t("common.totalEarned")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.totalSpent")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.spentWoMortgage")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.totalSaved")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.savingsRate")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map((m) => (
                  <TableRow
                    key={m.monthKey}
                    className={
                      m.monthKey === currentMonthKey
                        ? "bg-primary/10 font-medium"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium">
                      {m.monthLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(m.totalEarned)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(m.totalSpent)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(m.totalSpentWithoutMortgage)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(m.totalSaved)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(m.personalSavingsRate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
