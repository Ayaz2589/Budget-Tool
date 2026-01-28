import { useState, useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
import {
  computeAllTotals,
  computeGrandTotals,
  computeMonthTotals,
  getMonthLabel,
  type MonthTotals,
} from "@/lib/totals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function Dashboard() {
  const { expenses, income, iOweNova } = useBudget();
  const months = computeAllTotals({
    expenses,
    income,
    iOweNovaByMonth: iOweNova,
  });
  const grand = computeGrandTotals(months);
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([
      currentMonthKey,
      ...months.map((m) => m.monthKey),
    ]);
    return Array.from(keys).sort().reverse();
  }, [currentMonthKey, months]);

  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

  const selectedMonth = useMemo((): MonthTotals => {
    const found = months.find((m) => m.monthKey === selectedMonthKey);
    if (found) return found;
    return computeMonthTotals(
      selectedMonthKey,
      expenses,
      income,
      iOweNova[selectedMonthKey] ?? 0,
      0,
      0,
    );
  }, [months, selectedMonthKey, expenses, income, iOweNova]);

  const isCurrentMonth = selectedMonthKey === currentMonthKey;

  const chartData = useMemo(
    () =>
      [...months].reverse().map((m) => ({
        month: m.monthLabel,
        earned: m.totalEarned,
        spent: m.totalSpent,
      })),
    [months],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>View month</Label>
          <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((key) => (
                <SelectItem key={key} value={key}>
                  {getMonthLabel(key)}
                  {key === currentMonthKey ? " (current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground text-sm pb-2">
          {isCurrentMonth
            ? "Current month summary."
            : `Showing ${getMonthLabel(selectedMonthKey)}.`}{" "}
          Sync to Google Sheets from Settings.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {formatCurrency(selectedMonth.totalEarned)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {formatCurrency(selectedMonth.totalSpent)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent w/o Mortgage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {formatCurrency(selectedMonth.totalSpentWithoutMortgage)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              50/50 Split
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {formatCurrency(selectedMonth.split5050)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasnuva&apos;s Total Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {formatCurrency(selectedMonth.novasTotalSpending)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Total Spending w/o Mortgage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {formatCurrency(selectedMonth.myTotalSpendingWithoutMortgage)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {formatCurrency(selectedMonth.totalSaved)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Personal Savings Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {formatPercent(selectedMonth.personalSavingsRate)}
            </span>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All-time totals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Total Earned: {formatCurrency(grand.totalEarned)} · Total Spent:{" "}
            {formatCurrency(grand.totalSpent)} · Total Saved:{" "}
            {formatCurrency(grand.totalSaved)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total earned vs total spent by month.
          </p>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `$${v / 1000}k` : `$${v}`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="earned"
                    name="Total Earned"
                    fill="hsl(var(--chart-1, 142 76% 36%))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="spent"
                    name="Total Spent"
                    fill="hsl(var(--chart-2, 221 83% 53%))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No data yet. Add income or expenses to see the chart.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spending by month</CardTitle>
          <p className="text-sm text-muted-foreground">
            Totals for each month. Current month is highlighted.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Total Earned</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">
                    Spent w/o Mortgage
                  </TableHead>
                  <TableHead className="text-right">Total Saved</TableHead>
                  <TableHead className="text-right">Savings Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map((m: MonthTotals) => (
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
    </div>
  );
}
