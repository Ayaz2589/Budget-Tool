import { Card, CardContent } from "@/components/ui/card";
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
import { formatCurrency, formatDate } from "@/lib/format";
import { DsDataRow, DsSectionHeader } from "@/components/ds";
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
  t,
  bare = false,
}: ImportPreviewCardProps) {
  const isPdfExport = lastDetected === "pdf-export";

  const content = (
    <div className="rounded-xl border border-border/70 bg-card/40 p-4 md:p-5 space-y-6">
    {previewExpenses.length > 0 && (
      <section className="space-y-2">
        <h3 className="text-sm font-medium ds-label">{t("import.expensesToAdd")}</h3>
        <div className="hidden md:block overflow-x-auto max-h-[40vh] overflow-y-auto rounded-lg border border-[var(--border-subtle)]">
          <Table density="comfortable">
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.id")}</TableHead>
                <TableHead>{t("common.date")}</TableHead>
                <TableHead>{t("common.description")}</TableHead>
                <TableHead>{t("common.amount")}</TableHead>
                <TableHead>{t("common.owner")}</TableHead>
                <TableHead>{t("common.category")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewExpenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.id}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(e.date)}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{e.description}</TableCell>
                  <TableCell>{formatCurrency(e.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.owner ?? t("import.noOwner")}
                  </TableCell>
                  <TableCell>
                    {isPdfExport ? (
                      e.category || t("import.uncategorized")
                    ) : (
                      <Select
                        value={e.category || "_"}
                        onValueChange={(v) => onUpdateCategory(e.id, v === "_" ? "" : v)}
                      >
                        <SelectTrigger className="w-[220px] min-w-[200px]">
                          <SelectValue placeholder={t("common.category")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_">
                            <CategoryOption name={t("import.uncategorized")} type="expense" />
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
        <div className="md:hidden rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          {previewExpenses.map((e) => (
            <DsDataRow
              key={e.id}
              dense
              title={e.description}
              subtitle={`${formatDate(e.date)} · ${(e.owner ?? t("import.noOwner")).toUpperCase()}`}
              trailing={<span className="text-sm font-semibold">{formatCurrency(e.amount)}</span>}
              meta={
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground font-mono">{e.id}</p>
                  {isPdfExport ? (
                    <p className="text-xs text-muted-foreground">
                      {t("common.category")}: {e.category || t("import.uncategorized")}
                    </p>
                  ) : (
                    <Select
                      value={e.category || "_"}
                      onValueChange={(v) => onUpdateCategory(e.id, v === "_" ? "" : v)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder={t("common.category")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_">
                          <CategoryOption name={t("import.uncategorized")} type="expense" />
                        </SelectItem>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c} value={c}>
                            <CategoryOption name={c} type="expense" />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              }
            />
          ))}
        </div>
      </section>
    )}

    {previewIncome.length > 0 && (
      <section className="space-y-2">
        <h3 className="text-sm font-medium ds-label">{t("import.incomeToAdd")}</h3>
        <div className="hidden md:block overflow-x-auto max-h-[40vh] overflow-y-auto rounded-lg border border-[var(--border-subtle)]">
          <Table density="comfortable">
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.id")}</TableHead>
                <TableHead>{t("common.date")}</TableHead>
                <TableHead>{t("common.description")}</TableHead>
                <TableHead>{t("common.amount")}</TableHead>
                <TableHead>{t("common.category")}</TableHead>
                <TableHead>{t("common.owner")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewIncome.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.id}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(i.date)}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{i.description}</TableCell>
                  <TableCell>{formatCurrency(i.amount)}</TableCell>
                  <TableCell>{i.category || t("import.uncategorized")}</TableCell>
                  <TableCell>{i.owner ?? t("import.noOwner")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          {previewIncome.map((i) => (
            <DsDataRow
              key={i.id}
              dense
              title={i.description}
              subtitle={`${formatDate(i.date)} · ${(i.owner ?? t("import.noOwner")).toUpperCase()}`}
              trailing={<span className="text-sm font-semibold">{formatCurrency(i.amount)}</span>}
              meta={
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground font-mono">{i.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("common.category")}: {i.category || t("import.uncategorized")}
                  </p>
                </div>
              }
            />
          ))}
        </div>
      </section>
    )}

    {isPdfExport && previewDebts.length > 0 && (
      <section className="space-y-2">
        <h3 className="text-sm font-medium ds-label">{t("import.debtsToAdd")}</h3>
        <div className="hidden md:block overflow-x-auto max-h-[30vh] overflow-y-auto rounded-lg border border-[var(--border-subtle)]">
          <Table density="comfortable">
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("import.initialAmount")}</TableHead>
                <TableHead>{t("import.startDate")}</TableHead>
                <TableHead>{t("common.owner")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewDebts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{formatCurrency(d.initialAmount)}</TableCell>
                  <TableCell>{d.startDate ? formatDate(d.startDate) : "—"}</TableCell>
                  <TableCell>{d.owner ?? t("import.noOwner")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          {previewDebts.map((d) => (
            <DsDataRow
              key={d.id}
              dense
              title={d.name}
              subtitle={(d.owner ?? t("import.noOwner")).toUpperCase()}
              trailing={<span className="text-sm font-semibold">{formatCurrency(d.initialAmount)}</span>}
              meta={
                <p className="text-xs text-muted-foreground">
                  {t("import.startDate")}: {d.startDate ? formatDate(d.startDate) : "—"}
                </p>
              }
            />
          ))}
        </div>
      </section>
    )}

    {isPdfExport && previewDebtPayments.length > 0 && (
      <section className="space-y-2">
        <h3 className="text-sm font-medium ds-label">{t("import.debtPaymentsToAdd")}</h3>
        <div className="hidden md:block overflow-x-auto max-h-[30vh] overflow-y-auto rounded-lg border border-[var(--border-subtle)]">
          <Table density="comfortable">
            <TableHeader>
              <TableRow>
                <TableHead>{t("import.debtId")}</TableHead>
                <TableHead>{t("common.date")}</TableHead>
                <TableHead>{t("common.amount")}</TableHead>
                <TableHead>{t("common.note")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewDebtPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.debtId}</TableCell>
                  <TableCell>{formatDate(p.date)}</TableCell>
                  <TableCell>{formatCurrency(p.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.note ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          {previewDebtPayments.map((p) => (
            <DsDataRow
              key={p.id}
              dense
              title={`${t("import.debtId")}: ${p.debtId}`}
              subtitle={formatDate(p.date)}
              trailing={<span className="text-sm font-semibold">{formatCurrency(p.amount)}</span>}
              meta={
                <p className="text-xs text-muted-foreground">{p.note ?? "—"}</p>
              }
            />
          ))}
        </div>
      </section>
    )}
    </div>
  );

  if (bare) {
    return content;
  }

  return (
    <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
      <div className="px-4 py-4 md:px-0 md:py-0">
        <DsSectionHeader
          title={t("import.previewTitle")}
          subtitle={t(isPdfExport ? "import.previewDescriptionPdf" : "import.previewDescriptionCsv")}
          titleClassName="text-lg md:text-xl"
          subtitleClassName="text-xs md:text-sm"
        />
      </div>
      <CardContent className="px-4 pb-4 md:px-0">
        {content}
      </CardContent>
    </Card>
  );
}
