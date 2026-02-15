import { useState, useEffect, useRef } from "react";
import { ImportSourceCard } from "./ImportSourceCard";
import { ImportPreviewCard } from "./ImportPreviewCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { DsActionBar, DsSectionHeader } from "@/components/ds";
import { useImportState } from "./useImportState";

export function ImportPage() {
  const {
    fileInputRef,
    jsonInputRef,
    selectedSource,
    previewExpenses,
    previewIncome,
    previewDebts,
    previewDebtPayments,
    lastDetected,
    skippedDuplicates,
    importError,
    exportString,
    exportStringError,
    jsonImportError,
    missingMetaOpen,
    missingExpenseCategories,
    missingIncomeCategories,
    missingOwners,
    hasPreview,
    primaryAddLabel,
    importStatusText,
    expenseCategories,
    cardSources,
    setSelectedSource,
    setExportString,
    setMissingMetaOpen,
    handleFileChange,
    handleExportStringImport,
    handleJsonFileChange,
    updatePreviewCategory,
    addToTransactions,
    handleDownloadPdf,
    handleDownloadJson,
    handleDownloadExportString,
    applyPendingImport,
    t,
  } = useImportState();

  const [openItem, setOpenItem] = useState("import-source");

  const prevHasPreview = useRef(false);
  useEffect(() => {
    if (hasPreview && !prevHasPreview.current) {
      setOpenItem("import-source");
    }
    prevHasPreview.current = hasPreview;
  }, [hasPreview]);

  const importSourceProps = {
    selectedSource,
    onSourceChange: setSelectedSource,
    fileInputRef,
    accept: selectedSource === "pdf-export" ? ".pdf" : ".csv",
    onFileChange: handleFileChange,
    importError,
    lastDetected,
    sourceLabel: importStatusText ? importStatusText.split(" \u00B7 ")[0] ?? "" : "",
    previewExpensesCount: previewExpenses.length,
    previewIncomeCount: previewIncome.length,
    previewDebtsCount: previewDebts.length,
    previewDebtPaymentsCount: previewDebtPayments.length,
    skippedDuplicates,
    onAddToTransactions: addToTransactions,
    isPdfExport: lastDetected === "pdf-export",
    cardSources,
    t,
    statusText: importStatusText,
    showPrimaryAction: false,
    primaryActionLabel: primaryAddLabel,
  } as const;

  const previewProps = {
    previewExpenses,
    previewIncome,
    previewDebts,
    previewDebtPayments,
    expenseCategories,
    onUpdateCategory: updatePreviewCategory,
    lastDetected,
    t,
  } as const;

  const exportStringInner = (
    <>
      <textarea
        value={exportString}
        onChange={(e) => setExportString(e.target.value)}
        placeholder={t("import.exportStringPlaceholder")}
        className="min-h-[120px] w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm shadow-[var(--field-shadow)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]/45"
      />
      {exportStringError && (
        <span className="text-sm text-destructive block">
          {exportStringError}
        </span>
      )}
      <Button onClick={handleExportStringImport} className="h-11 w-full md:w-auto">
        {t("import.importExportString")}
      </Button>
    </>
  );

  const jsonImportInner = (
    <>
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleJsonFileChange}
      />
      <Button
        onClick={() => jsonInputRef.current?.click()}
        className="h-11 w-full md:w-auto"
      >
        {t("import.importJson")}
      </Button>
      {jsonImportError && (
        <span className="text-sm text-destructive block">
          {jsonImportError}
        </span>
      )}
    </>
  );

  const exportInner = (
    <>
      <Button
        variant="outline"
        onClick={handleDownloadPdf}
        className="h-11 w-full md:w-auto"
      >
        {t("import.downloadPdf")}
      </Button>
      <Button
        variant="outline"
        onClick={handleDownloadJson}
        className="h-11 w-full md:w-auto"
      >
        {t("import.downloadJson")}
      </Button>
      <Button
        variant="outline"
        onClick={handleDownloadExportString}
        className="h-11 w-full md:w-auto"
      >
        {t("import.downloadExportString")}
      </Button>
    </>
  );

  const accordionItemClass = "rounded-2xl border border-border/60 bg-card px-4";
  const accordionTriggerClass = "cursor-pointer py-4 text-base font-semibold hover:no-underline";

  return (
    <div data-tour-page="data" className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="mb-2 md:mb-3 px-4 md:px-0 pt-3 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={t("import.title")}
          subtitle={t("import.subtitle")}
          actions={
            hasPreview ? (
              <Button className="hidden md:inline-flex" onClick={addToTransactions}>
                {primaryAddLabel}
              </Button>
            ) : undefined
          }
        />
      </div>

      <Accordion
        type="single"
        collapsible
        value={openItem}
        onValueChange={setOpenItem}
        className="space-y-3 pb-24 px-4 md:px-0"
        data-tour="data-page"
      >
        <AccordionItem value="import-source" className={accordionItemClass}>
          <AccordionTrigger className={accordionTriggerClass}>
            <div className="flex flex-col items-start gap-0.5">
              <span>{t("import.uploadStatement")}</span>
              <span className="text-xs font-normal text-muted-foreground">{t("import.uploadStatementDesc")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-0">
            <ImportSourceCard bare {...importSourceProps} />
            {hasPreview && (
              <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                <h3 className="text-sm font-semibold mb-3">{t("import.previewTitle")}</h3>
                <ImportPreviewCard bare {...previewProps} />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="export-string" className={accordionItemClass}>
          <AccordionTrigger className={accordionTriggerClass}>
            <div className="flex flex-col items-start gap-0.5">
              <span>{t("import.exportStringTitle")}</span>
              <span className="text-xs font-normal text-muted-foreground">{t("import.exportStringDesc")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-0">
            <div className="space-y-3">{exportStringInner}</div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="json-import" className={accordionItemClass}>
          <AccordionTrigger className={accordionTriggerClass}>
            <div className="flex flex-col items-start gap-0.5">
              <span>{t("import.jsonImportTitle")}</span>
              <span className="text-xs font-normal text-muted-foreground">{t("import.jsonImportDesc")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-0">
            <div className="space-y-3">{jsonImportInner}</div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="export" className={accordionItemClass}>
          <AccordionTrigger className={accordionTriggerClass}>
            <div className="flex flex-col items-start gap-0.5">
              <span>{t("import.exportTitle")}</span>
              <span className="text-xs font-normal text-muted-foreground">{t("import.exportDesc")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-0">
            <div className="flex flex-col md:flex-row gap-2">{exportInner}</div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog open={missingMetaOpen} onOpenChange={setMissingMetaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("import.missingMetaTitle")}</DialogTitle>
            <DialogDescription>{t("import.missingMetaDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {missingExpenseCategories.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {t("import.missingExpenseCategories")}
                </div>
                <div>{missingExpenseCategories.join(", ")}</div>
              </div>
            )}
            {missingIncomeCategories.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {t("import.missingIncomeCategories")}
                </div>
                <div>{missingIncomeCategories.join(", ")}</div>
              </div>
            )}
            {missingOwners.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {t("import.missingOwners")}
                </div>
                <div>{missingOwners.join(", ")}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => applyPendingImport(true)}>
              {t("import.skipMissing")}
            </Button>
            <Button onClick={() => applyPendingImport(false)}>
              {t("import.addMissing")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {hasPreview ? (
        <DsActionBar>
          <Button onClick={addToTransactions}>{primaryAddLabel}</Button>
        </DsActionBar>
      ) : null}
    </div>
  );
}
