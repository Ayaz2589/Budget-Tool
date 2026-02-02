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
import {
  AmexPlatinumCardIcon,
  AmexGoldCardIcon,
  AppleCardIcon,
  ChaseCardIcon,
} from "@/components/cards";
import { EXPENSE_SOURCE_DISPLAY_LABELS } from "@/lib/sourceLabels";
import { cn } from "@/lib/utils";
import type { SourceChoice, ImportSourceCardProps } from "@/types/import";

export type { ImportSourceCardProps };

const ALL_SOURCE_OPTIONS: {
  value: SourceChoice;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}[] = [
  {
    value: "amex",
    label: EXPENSE_SOURCE_DISPLAY_LABELS.amex,
    icon: AmexPlatinumCardIcon,
  },
  {
    value: "amex-gold",
    label: EXPENSE_SOURCE_DISPLAY_LABELS["amex-gold"],
    icon: AmexGoldCardIcon,
  },
  {
    value: "apple",
    label: EXPENSE_SOURCE_DISPLAY_LABELS.apple,
    icon: AppleCardIcon,
  },
  {
    value: "chase",
    label: EXPENSE_SOURCE_DISPLAY_LABELS.chase,
    icon: ChaseCardIcon,
  },
  {
    value: "pdf-export",
    label: "Exported PDF (re-import)",
    icon: PdfExportIcon,
  },
];

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
  const sourceOptions = ALL_SOURCE_OPTIONS.filter(
    (opt) => opt.value === "pdf-export" || cardSources.includes(opt.value)
  );
  const hasPreview =
    previewExpensesCount > 0 ||
    previewIncomeCount > 0 ||
    previewDebtsCount > 0 ||
    previewDebtPaymentsCount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("import.uploadStatement")}</CardTitle>
        <CardDescription>{t("import.uploadStatementDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sourceOptions.map((opt) => {
            const Icon = opt.icon;
            const isPdfOpt = opt.value === "pdf-export";
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSourceChange(opt.value)}
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
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="size-4" />
          {selectedSource === "pdf-export"
            ? "Choose exported PDF"
            : selectedSource === "chase"
            ? "Choose PDF statement"
            : "Choose CSV/PDF file"}
        </Button>
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
          <Button onClick={onAddToTransactions}>
            {isPdfExport ? "Add all" : "Add to transactions"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
