import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { DsChartCard, DsEmptyState, DsHelpTooltip } from "@/components/ds";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const INCOME_OWNER_COLORS = [
  "var(--viz-series-1)",
  "var(--viz-series-2)",
  "var(--viz-series-3)",
  "var(--viz-series-4)",
  "var(--viz-series-5)",
  "#EC4899",
];

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function monthLabelFromTooltipPayload(payload: unknown): string {
  if (!Array.isArray(payload) || payload.length === 0) return "";
  const first = payload[0] as { payload?: { monthLabel?: string } };
  return first?.payload?.monthLabel ?? "";
}

interface CashFlowDisplayRow {
  monthKey: string;
  monthLabel: string;
  monthAxisLabel: string;
  incomeTotal: number;
  expensesTotal: number;
  debtPaymentsTotal: number;
  incomeByOwner: Record<string, number>;
}

interface DashboardCashFlowChartProps {
  cashFlowDisplayRows: CashFlowDisplayRow[];
  incomeOwnerKeys: string[];
  includeDebtPayments: boolean;
}

export function DashboardCashFlowChart({
  cashFlowDisplayRows,
  incomeOwnerKeys,
  includeDebtPayments,
}: DashboardCashFlowChartProps) {
  const { t } = useTranslation();

  return (
    <DsChartCard
      title={
        <span className="inline-flex items-center gap-1.5">
          {t("dashboard.chartIncomeVsExpenses")}
          <DsHelpTooltip
            content={t("dashboard.help.chartIncomeVsExpenses")}
            ariaLabel={t("common.help")}
          />
        </span>
      }
      className="min-w-0"
    >
      <div className="hidden md:block">
        <ChartContainer
          config={{
            expenses: { label: t("dashboard.chartExpenses"), color: "var(--viz-expense)" },
            ...(includeDebtPayments
              ? {
                  debtPayments: {
                    label: t("dashboard.chartDebtPayments"),
                    color: "var(--viz-debt)",
                  },
                }
              : {}),
          }}
          heightMobile={220}
          heightDesktop={280}
        >
          <BarChart data={cashFlowDisplayRows}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="monthAxisLabel"
              interval={0}
              tickMargin={8}
              minTickGap={0}
            />
            <YAxis />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                  labelClassName="text-sm font-semibold"
                  labelFormatter={(_, payload) => monthLabelFromTooltipPayload(payload)}
                  valueFormatter={(value) => formatCurrency(asNumber(value))}
                />
              }
            />
            {incomeOwnerKeys.map((owner, index) => (
              <Bar
                key={owner}
                dataKey={(row) => row.incomeByOwner[owner] ?? 0}
                name={t("dashboard.chartIncomeOwner", { owner })}
                fill={INCOME_OWNER_COLORS[index % INCOME_OWNER_COLORS.length]}
                stackId="income"
                radius={index === incomeOwnerKeys.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
            <Bar
              dataKey="expensesTotal"
              name={t("dashboard.chartExpenses")}
              fill="var(--viz-expense)"
              stackId="outflow"
            />
            {includeDebtPayments ? (
              <Bar
                dataKey="debtPaymentsTotal"
                name={t("dashboard.chartDebtPayments")}
                fill="var(--viz-debt)"
                stackId="outflow"
              />
            ) : null}
          </BarChart>
        </ChartContainer>
      </div>
      <div className="md:hidden">
        <ChartContainer
          config={{
            income: { label: t("dashboard.chartIncome"), color: INCOME_OWNER_COLORS[0] },
            expenses: { label: t("dashboard.chartExpenses"), color: "var(--viz-expense)" },
            ...(includeDebtPayments
              ? {
                  debtPayments: {
                    label: t("dashboard.chartDebtPayments"),
                    color: "var(--viz-debt)",
                  },
                }
              : {}),
          }}
          heightMobile={220}
          heightDesktop={280}
        >
          <BarChart
            data={cashFlowDisplayRows}
            margin={{ top: 4, right: 24, left: -4, bottom: 2 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="monthAxisLabel"
              tick={{ fontSize: 11 }}
              tickMargin={8}
              minTickGap={18}
              interval="preserveStartEnd"
              padding={{ left: 0, right: 8 }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              width={34}
              tickFormatter={(value) => {
                const abs = Math.abs(Number(value));
                if (abs >= 1000) return `${Math.round(Number(value) / 1000)}k`;
                return String(Math.round(Number(value)));
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="min-w-[16rem] bg-card border-border px-4 py-3 text-sm shadow-md"
                  labelClassName="text-sm font-semibold"
                  labelFormatter={(_, payload) => monthLabelFromTooltipPayload(payload)}
                  valueFormatter={(value) => formatCurrency(asNumber(value))}
                />
              }
            />
            <Bar dataKey="incomeTotal" name={t("dashboard.chartIncome")} fill="var(--viz-income)" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="expensesTotal"
              name={t("dashboard.chartExpenses")}
              fill="var(--viz-expense)"
              radius={[4, 4, 0, 0]}
              stackId="outflow"
            />
            {includeDebtPayments ? (
              <Bar
                dataKey="debtPaymentsTotal"
                name={t("dashboard.chartDebtPayments")}
                fill="var(--viz-debt)"
                radius={[4, 4, 0, 0]}
                stackId="outflow"
              />
            ) : null}
          </BarChart>
        </ChartContainer>
      </div>
      {cashFlowDisplayRows.length === 0 ? (
        <DsEmptyState title={t("dashboard.chartNoDataRange")} className="py-4" />
      ) : null}
    </DsChartCard>
  );
}
