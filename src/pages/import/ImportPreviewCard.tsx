import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { CategoryOption } from "@/lib/categoryColors";
import { formatCurrency } from "@/lib/format";
import type { ImportPreviewCardProps } from "@/types/import";

export type { ImportPreviewCardProps };

export function ImportPreviewCard({
  previewExpenses,
  previewIncome,
  previewDebts,
  previewDebtPayments,
  expenseCategories,
  onUpdateCategory,
  lastDetected,
  t: _t,
}: ImportPreviewCardProps) {
  const isPdfExport = lastDetected === "pdf-export";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          {isPdfExport
            ? 'Transactions and income with existing IDs are omitted. Click "Add all" to add the rest.'
            : 'Transactions matching existing entries (same date and amount) are skipped. Edit category per row if needed, then click "Add to transactions".'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {previewExpenses.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Expenses to add</h3>
            <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">
                        {e.id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {e.date}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {e.description}
                      </TableCell>
                      <TableCell>{formatCurrency(e.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.owner ?? "No Owner"}
                      </TableCell>
                      <TableCell>
                        {isPdfExport ? (
                          e.category || "Uncategorized"
                        ) : (
                          <Select
                            value={e.category || "_"}
                            onValueChange={(v) =>
                              onUpdateCategory(e.id, v === "_" ? "" : v)
                            }
                          >
                            <SelectTrigger className="w-[220px] min-w-[200px]">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_">
                                <CategoryOption
                                  name="Uncategorized"
                                  type="expense"
                                />
                              </SelectItem>
                              {expenseCategories.map((c) => (
                                <SelectItem key={c} value={c}>
                                  <CategoryOption name={c} type="expense" />
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        {previewIncome.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Income to add</h3>
            <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewIncome.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">
                        {i.id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {i.date}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {i.description}
                      </TableCell>
                      <TableCell>{formatCurrency(i.amount)}</TableCell>
                      <TableCell>{i.category || "Uncategorized"}</TableCell>
                      <TableCell>{i.owner ?? "No Owner"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        {isPdfExport && previewDebts.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Debts to add</h3>
            <div className="overflow-x-auto max-h-[30vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Initial Amount</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewDebts.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>{formatCurrency(d.initialAmount)}</TableCell>
                      <TableCell>{d.startDate ?? "—"}</TableCell>
                      <TableCell>{d.owner ?? "Ayaz"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        {isPdfExport && previewDebtPayments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Debt payments to add</h3>
            <div className="overflow-x-auto max-h-[30vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Debt Id</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewDebtPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">
                        {p.debtId}
                      </TableCell>
                      <TableCell>{p.date}</TableCell>
                      <TableCell>{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.note ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
