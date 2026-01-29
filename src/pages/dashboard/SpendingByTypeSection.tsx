import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/format";

export type SpendingByTypeDatum = { name: string; amount: number };

export type SpendingByTypeSectionProps = {
  fiftyFiftyByType: SpendingByTypeDatum[];
  mySpendingByType: SpendingByTypeDatum[];
  tasnuvasSpendingByType: SpendingByTypeDatum[];
  fiftyFiftyChartConfig: ChartConfig;
  mySpendingChartConfig: ChartConfig;
  tasnuvasSpendingChartConfig: ChartConfig;
  t: (key: string) => string;
};

export function SpendingByTypeSection({
  fiftyFiftyByType,
  mySpendingByType,
  tasnuvasSpendingByType,
  fiftyFiftyChartConfig,
  mySpendingChartConfig,
  tasnuvasSpendingChartConfig,
  t,
}: SpendingByTypeSectionProps) {
  const barChartProps = {
    layout: "vertical" as const,
    margin: { top: 5, right: 24, left: 0, bottom: 5 },
    barCategoryGap: "20%" as const,
    accessibilityLayer: true,
  };
  const axisProps = {
    tickFormatter: (v: number) => formatCurrency(v),
    YWidth: 240,
    tickFormatterY: (v: string) => (v.length > 52 ? `${v.slice(0, 50)}…` : v),
  };

  return (
    <AccordionItem value="spending">
      <AccordionTrigger className="px-4 py-4 text-lg font-semibold hover:no-underline data-[state=open]:border-b">
        {t("dashboard.spendingByType")}
      </AccordionTrigger>
      <AccordionContent className="px-4 pt-4 pb-4 space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.fiftyFiftySpendByType")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.fiftyFiftyExpensesInCategory")}
            </p>
          </CardHeader>
          <CardContent>
            {fiftyFiftyByType.length > 0 ? (
              <ChartContainer
                config={fiftyFiftyChartConfig}
                className="h-[480px] w-full"
              >
                <BarChart data={fiftyFiftyByType} {...barChartProps}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={axisProps.tickFormatter}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={axisProps.YWidth}
                    tick={{ fontSize: 11 }}
                    tickFormatter={axisProps.tickFormatterY}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.name ?? ""
                        }
                        formatter={(value) =>
                          typeof value === "number"
                            ? formatCurrency(value)
                            : String(value ?? "")
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="amount"
                    fill="var(--color-amount)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={16}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t("dashboard.no5050Expenses")}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.mySpendingByType")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.myExpensesExcluding")}
              </p>
            </CardHeader>
            <CardContent>
              {mySpendingByType.length > 0 ? (
                <ChartContainer
                  config={mySpendingChartConfig}
                  className="h-[480px] w-full"
                >
                  <BarChart data={mySpendingByType} {...barChartProps}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={axisProps.tickFormatter}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={axisProps.YWidth}
                      tick={{ fontSize: 11 }}
                      tickFormatter={axisProps.tickFormatterY}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.name ?? ""
                          }
                          formatter={(value) =>
                            typeof value === "number"
                              ? formatCurrency(value)
                              : String(value ?? "")
                          }
                        />
                      }
                    />
                    <Bar
                      dataKey="amount"
                      fill="var(--color-amount)"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={16}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {t("dashboard.noExpensesForMonth")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.tasnuvasSpendingByType")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.tasnuvasOnly")}
              </p>
            </CardHeader>
            <CardContent>
              {tasnuvasSpendingByType.length > 0 ? (
                <ChartContainer
                  config={tasnuvasSpendingChartConfig}
                  className="h-[480px] w-full"
                >
                  <BarChart data={tasnuvasSpendingByType} {...barChartProps}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={axisProps.tickFormatter}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={axisProps.YWidth}
                      tick={{ fontSize: 11 }}
                      tickFormatter={axisProps.tickFormatterY}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.name ?? ""
                          }
                          formatter={(value) =>
                            typeof value === "number"
                              ? formatCurrency(value)
                              : String(value ?? "")
                          }
                        />
                      }
                    />
                    <Bar
                      dataKey="amount"
                      fill="var(--color-amount)"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={16}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {t("dashboard.noExpensesForMonth")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
