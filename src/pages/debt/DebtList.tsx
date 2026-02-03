import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Calendar, Trash2 } from "lucide-react";
import { getDebtBalance } from "@/lib/debtUtils";
import { formatCurrency } from "@/lib/format";
import type { DebtListProps } from "@/types/debt";

export type { DebtListProps };

export function DebtList({
  debts,
  paymentsByDebt,
  onAddPayment,
  onEditRecurring,
  onUpdateOwner,
  ownerOptions = [],
  onDelete,
  onRemovePayment,
}: DebtListProps) {
  if (debts.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6 text-center">
        No debts yet. Add one above.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {debts.map((debt) => {
          const payments = paymentsByDebt.get(debt.id) ?? [];
          const balance = getDebtBalance(debt, payments);
          return (
            <div
              key={debt.id}
              className="rounded-lg border bg-card p-5 space-y-4"
            >
              <div>
                <h3 className="font-semibold text-lg">{debt.name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm mt-0.5">
                  <Select
                    value={debt.owner || "_none"}
                    onValueChange={(v) =>
                      onUpdateOwner(debt.id, v === "_none" ? "" : v)
                    }
                  >
                    <SelectTrigger className="h-7 w-[140px]">
                      <SelectValue placeholder="No Owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No Owner</SelectItem>
                      {ownerOptions.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {debt.startDate ? (
                    <span>· Started {debt.startDate}</span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Initial
                  </p>
                  <p className="text-sm font-medium mt-0.5">
                    {formatCurrency(debt.initialAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Balance
                  </p>
                  <p className="text-lg font-semibold mt-0.5">
                    {formatCurrency(balance)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Recurring
                  </p>
                  <p className="text-sm font-medium mt-0.5">
                    {debt.recurringAmount != null &&
                    debt.recurringAmount > 0 ? (
                      <>
                        {formatCurrency(debt.recurringAmount)}{" "}
                        <span className="text-muted-foreground font-normal">
                          {debt.recurringFrequency === "biweekly"
                            ? `bi-weekly from ${
                                debt.recurringStartDate ?? debt.startDate ?? "—"
                              }`
                            : `monthly on day ${
                                debt.recurringDayOfMonth ?? "—"
                              }`}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onEditRecurring(debt)}
                >
                  <Calendar className="size-4" />
                  {debt.recurringAmount != null && debt.recurringAmount > 0
                    ? "Edit recurring"
                    : "Set recurring"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onAddPayment(debt.id)}
                  disabled={balance <= 0}
                >
                  <DollarSign className="size-4" />
                  Make payment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive ml-auto"
                  onClick={() => onDelete(debt.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                  Delete debt
                </Button>
              </div>

              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Payment history
                </h4>
                {payments.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-3">
                    No payments yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Amount</TableHead>
                          <TableHead className="text-xs">Note</TableHead>
                          <TableHead className="w-[72px] text-right text-xs">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm">{p.date}</TableCell>
                            <TableCell className="text-sm font-medium">
                              {formatCurrency(p.amount)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {p.note ?? "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => onRemovePayment(p.id)}
                                aria-label="Remove"
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
