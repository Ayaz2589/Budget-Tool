import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/format";

const PIE_COLORS = [
  "oklch(0.65 0.2 25)",
  "oklch(0.7 0.18 55)",
  "oklch(0.65 0.2 280)",
  "oklch(0.6 0.2 160)",
];

const INCOME_CATEGORY_COLORS: Record<string, string> = {
  Rent: "oklch(0.6 0.18 145)",
  Paycheck: "oklch(0.65 0.2 160)",
  Bonus: "oklch(0.55 0.22 85)",
  Other: "oklch(0.6 0.15 280)",
};

export type SummaryBarDatum = { metric: string; value: number; fill: string };
export type SpendingPieDatum = { name: string; value: number };
export type IncomeStackedRow = { name: string; [cat: string]: string | number };

export type OverviewSectionProps = {
  summaryBarData: SummaryBarDatum[];
  summaryBarConfig: ChartConfig;
  spendingPieData: SpendingPieDatum[];
  incomeStackedBarData: IncomeStackedRow[];
  incomeStackedBarConfig: ChartConfig;
  incomeCategoryKeys: string[];
  t: (key: string) => string;
};

export function OverviewSection({
  summaryBarData,
  summaryBarConfig,
  spendingPieData,
  incomeStackedBarData,
  incomeStackedBarConfig,
  incomeCategoryKeys,
  t,
}: OverviewSectionProps) {
  return (
    <AccordionItem value="overview">
      <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
        {t("dashboard.overview")}
      </AccordionTrigger>
      <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.earnedVsSpentVsSaved")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryBarData.some((d) => d.value > 0) ? (
                <ChartContainer
                  config={summaryBarConfig}
                  className="h-[220px] w-full"
                >
                  <BarChart
                    data={summaryBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 60, bottom: 5 }}
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
                      width={55}
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
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {summaryBarData.map((_, i) => (
                        <Cell key={i} fill={summaryBarData[i]!.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {t("dashboard.noDataForMonth")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.spendingBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {spendingPieData.length > 0 ? (
                <ChartContainer
                  config={{
                    "50/50": {
                      label: "50/50",
                      theme: { light: PIE_COLORS[0], dark: PIE_COLORS[0] },
                    },
                    "Tasnuva's": {
                      label: "Tasnuva's",
                      theme: { light: PIE_COLORS[1], dark: PIE_COLORS[1] },
                    },
                    My: {
                      label: "My",
                      theme: { light: PIE_COLORS[2], dark: PIE_COLORS[2] },
                    },
                  }}
                  className="h-[220px] w-full"
                >
                  <PieChart>
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
                    <Pie
                      data={spendingPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {spendingPieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {t("dashboard.noSpendingForMonth")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.incomeBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeStackedBarData.length > 0 ? (
                <ChartContainer
                  config={incomeStackedBarConfig}
                  className="h-[220px] w-full"
                >
                  <BarChart
                    data={incomeStackedBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 80, bottom: 5 }}
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
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={76}
                      tick={{ fontSize: 11 }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.name ?? ""
                          }
                          formatter={(value, name) => (
                            <div className="flex w-full items-center justify-between gap-4">
                              <span className="text-muted-foreground">
                                {String(name)}
                              </span>
                              <span>
                                {typeof value === "number"
                                  ? formatCurrency(value)
                                  : String(value ?? "")}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {incomeCategoryKeys.map((cat, idx) => (
                      <Bar
                        key={cat}
                        dataKey={cat}
                        stackId="income"
                        radius={
                          idx === incomeCategoryKeys.length - 1
                            ? [0, 4, 4, 0]
                            : 0
                        }
                        maxBarSize={36}
                        fill={
                          INCOME_CATEGORY_COLORS[cat] ?? "oklch(0.6 0.15 200)"
                        }
                      />
                    ))}
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {t("dashboard.noIncomeForMonth")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
