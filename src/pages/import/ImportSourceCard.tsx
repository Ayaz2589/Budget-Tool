import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { DsSectionHeader } from "@/components/ds";

function PdfExportIcon({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return <FileText size={size} className={className} />;
}
import { AmexPlatinumCardIcon, MasterCardIcon, ChaseCardIcon } from "@/components/cards";
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
  statusText,
  showPrimaryAction = true,
  primaryActionLabel,
}: ImportSourceCardProps) {
  const sourceOptions = [
    {
      value: "amex",
      label: t("import.amexCard"),
      icon: AmexPlatinumCardIcon,
    },
    {
      value: "apple",
      label: t("import.appleCard"),
      icon: MasterCardIcon,
    },
    {
      value: "chase",
      label: t("import.chaseCard"),
      icon: ChaseCardIcon,
    },
    {
      value: "pdf-export",
      label: t("import.exportedPdf"),
      icon: PdfExportIcon,
    },
  ] satisfies {
    value: SourceChoice;
    label: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
  }[];

  const filteredSourceOptions = sourceOptions.filter((opt) => {
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
  const previewCount = isPdfExport
    ? previewExpensesCount +
      previewIncomeCount +
      previewDebtsCount +
      previewDebtPaymentsCount
    : previewExpensesCount;
  const fallbackStatus = lastDetected
    ? `${sourceLabel} · ${t("import.rowsToAddSummary", { count: previewCount })}${
        isPdfExport
          ? ` (${t("import.existingIdsOmitted")})`
          : skippedDuplicates > 0
            ? ` (${t("import.duplicatesSkipped", { count: skippedDuplicates })})`
            : ""
      }`
    : "";

  return (
    <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
      <div className="px-4 py-4 md:px-0 md:py-0">
        <DsSectionHeader
          title={t("import.uploadStatement")}
          subtitle={t("import.uploadStatementDesc")}
          titleClassName="text-lg md:text-xl"
          subtitleClassName="text-xs md:text-sm"
        />
      </div>
      <CardContent className="space-y-4 px-4 md:px-0">
        <div className="rounded-xl border border-border/70 bg-card/40 p-4 md:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredSourceOptions.map((opt) => {
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
                    "flex min-h-11 flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors text-left bg-background/60",
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
          <span className="text-sm text-muted-foreground block">{statusText || fallbackStatus}</span>
        )}
        {hasPreview && showPrimaryAction && (
          <Button onClick={onAddToTransactions} className="w-full md:w-auto">
            {primaryActionLabel ?? t(isPdfExport ? "import.addAll" : "import.addToTransactions")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
