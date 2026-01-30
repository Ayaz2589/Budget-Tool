import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";

export type SourceChoice = "amex" | "apple" | "chase" | "pdf-export";

const SOURCE_OPTIONS: { value: SourceChoice; label: string }[] = [
  { value: "amex", label: "American Express" },
  { value: "apple", label: "Apple Card" },
  { value: "chase", label: "Chase (PDF statement)" },
  { value: "pdf-export", label: "Exported PDF (re-import)" },
];

export type ImportSourceCardProps = {
  selectedSource: SourceChoice;
  onSourceChange: (value: SourceChoice) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importError: string;
  lastDetected: string;
  sourceLabel: string;
  previewExpensesCount: number;
  previewIncomeCount: number;
  previewDebtsCount: number;
  previewDebtPaymentsCount: number;
  skippedDuplicates: number;
  onAddToTransactions: () => void;
  isPdfExport: boolean;
  t: (key: string) => string;
};

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
  t,
}: ImportSourceCardProps) {
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
      <CardContent className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">
            CSV source:
          </span>
          <Select
            value={selectedSource}
            onValueChange={(v) => onSourceChange(v as SourceChoice)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              : "Choose CSV file"}
        </Button>
        {importError && (
          <span className="text-sm text-destructive self-center">
            {importError}
          </span>
        )}
        {lastDetected && !importError && (
          <span className="text-sm text-muted-foreground self-center">
            {sourceLabel}
            {isPdfExport
              ? ` · ${previewExpensesCount} expenses, ${previewIncomeCount} income${previewDebtsCount > 0 ? `, ${previewDebtsCount} debts` : ""}${previewDebtPaymentsCount > 0 ? `, ${previewDebtPaymentsCount} debt payments` : ""} to add (existing IDs omitted)`
              : ` · ${previewExpensesCount} rows${skippedDuplicates > 0 ? ` (${skippedDuplicates} duplicates skipped)` : ""}`}
          </span>
        )}
        {hasPreview && (
          <>
            <Button onClick={onAddToTransactions}>
              {isPdfExport ? "Add all" : "Add to transactions"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
