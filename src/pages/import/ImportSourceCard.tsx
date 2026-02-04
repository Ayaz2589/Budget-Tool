import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

function PdfExportIcon({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return <FileText size={size} className={className} />;
}
import { AmexPlatinumCardIcon, AppleCardIcon } from "@/components/cards";
import { cn } from "@/lib/utils";
import type { SourceChoice, ImportSourceCardProps } from "@/types/import";

export type { ImportSourceCardProps };

export function ImportSourceCard({
  selectedSource,
  onSourceChange,
  fileInputRef,
  accept,
  onFileChange,
  importError,
  lastDetected,
  sourceLabel,
  previewExpensesCount,
  previewIncomeCount,
  previewDebtsCount,
  previewDebtPaymentsCount,
  skippedDuplicates,
  onAddToTransactions,
  isPdfExport,
  cardSources,
  t,
}: ImportSourceCardProps) {
  const sourceOptions: {
    value: SourceChoice;
    label: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
  }[] = [
    {
      value: "amex",
      label: t("import.amexCard"),
      icon: AmexPlatinumCardIcon,
    },
    {
      value: "apple",
      label: t("import.appleCard"),
      icon: AppleCardIcon,
    },
    {
      value: "pdf-export",
      label: t("import.exportedPdf"),
      icon: PdfExportIcon,
    },
  ].filter((opt) => {
    if (opt.value === "pdf-export") return true;
    if (opt.value === "amex") {
      return cardSources.includes("amex") || cardSources.includes("amex-gold");
    }
    return cardSources.includes(opt.value);
  });
  const hasPreview =
    previewExpensesCount > 0 ||
    previewIncomeCount > 0 ||
    previewDebtsCount > 0 ||
    previewDebtPaymentsCount > 0;

  return (
    <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
      <CardHeader className="px-4 md:px-0">
        <CardTitle>{t("import.uploadStatement")}</CardTitle>
        <CardDescription>{t("import.uploadStatementDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {sourceOptions.map((opt) => {
            const Icon = opt.icon;
            const isPdfOpt = opt.value === "pdf-export";
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSourceChange(opt.value);
                  if (fileInputRef.current) {
                    fileInputRef.current.accept =
                      opt.value === "pdf-export" ? ".pdf" : ".csv";
                    fileInputRef.current.click();
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors text-left",
                  "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedSource === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-center justify-center size-12 shrink-0 text-foreground">
                  <Icon
                    size={isPdfOpt ? 32 : 48}
                    className={isPdfOpt ? "text-muted-foreground" : ""}
                  />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onFileChange}
        />
        {importError && (
          <span className="text-sm text-destructive block">{importError}</span>
        )}
        {lastDetected && !importError && (
          <span className="text-sm text-muted-foreground block">
            {sourceLabel}
            {isPdfExport
              ? ` · ${previewExpensesCount} expenses, ${previewIncomeCount} income${
                  previewDebtsCount > 0 ? `, ${previewDebtsCount} debts` : ""
                }${
                  previewDebtPaymentsCount > 0
                    ? `, ${previewDebtPaymentsCount} debt payments`
                    : ""
                } to add (existing IDs omitted)`
              : ` · ${previewExpensesCount} rows${
                  skippedDuplicates > 0
                    ? ` (${skippedDuplicates} duplicates skipped)`
                    : ""
                }`}
          </span>
        )}
        {hasPreview && (
          <Button onClick={onAddToTransactions} className="w-full md:w-auto">
            {isPdfExport ? "Add all" : "Add to transactions"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
