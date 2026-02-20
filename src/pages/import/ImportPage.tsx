import { useState, useEffect, useRef, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selectedExpCats, setSelectedExpCats] = useState<Set<string>>(new Set());
  const [selectedIncCats, setSelectedIncCats] = useState<Set<string>>(new Set());
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (missingMetaOpen) {
      setSelectedExpCats(new Set(missingExpenseCategories));
      setSelectedIncCats(new Set(missingIncomeCategories));
      setSelectedOwners(new Set(missingOwners));
    }
  }, [missingMetaOpen, missingExpenseCategories, missingIncomeCategories, missingOwners]);

  const totalMissing = missingExpenseCategories.length + missingIncomeCategories.length + missingOwners.length;
  const totalSelected = selectedExpCats.size + selectedIncCats.size + selectedOwners.size;
  const allSelected = totalSelected === totalMissing;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedExpCats(new Set());
      setSelectedIncCats(new Set());
      setSelectedOwners(new Set());
    } else {
      setSelectedExpCats(new Set(missingExpenseCategories));
      setSelectedIncCats(new Set(missingIncomeCategories));
      setSelectedOwners(new Set(missingOwners));
    }
  }, [allSelected, missingExpenseCategories, missingIncomeCategories, missingOwners]);

  const handleApplySelected = useCallback(() => {
    applyPendingImport({
      expenseCategories: [...selectedExpCats],
      incomeCategories: [...selectedIncCats],
      owners: [...selectedOwners],
    });
  }, [applyPendingImport, selectedExpCats, selectedIncCats, selectedOwners]);

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
      <Button onClick={handleExportStringImport} className="w-full md:w-auto">
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
        className="w-full md:w-auto"
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
        className="w-full md:w-auto"
      >
        {t("import.downloadPdf")}
      </Button>
      <Button
        variant="outline"
        onClick={handleDownloadJson}
        className="w-full md:w-auto"
      >
        {t("import.downloadJson")}
      </Button>
      <Button
        variant="outline"
        onClick={handleDownloadExportString}
        className="w-full md:w-auto"
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
          <div className="space-y-3 text-sm max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-end">
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {allSelected ? t("common.deselectAll") : t("common.selectAll")}
              </Button>
            </div>
            {missingExpenseCategories.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("import.missingExpenseCategories")}
                </div>
                {missingExpenseCategories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <Checkbox
                      checked={selectedExpCats.has(cat)}
                      onCheckedChange={(checked) => {
                        setSelectedExpCats((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(cat);
                          else next.delete(cat);
                          return next;
                        });
                      }}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            )}
            {missingIncomeCategories.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("import.missingIncomeCategories")}
                </div>
                {missingIncomeCategories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <Checkbox
                      checked={selectedIncCats.has(cat)}
                      onCheckedChange={(checked) => {
                        setSelectedIncCats((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(cat);
                          else next.delete(cat);
                          return next;
                        });
                      }}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            )}
            {missingOwners.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">
                  {t("import.missingOwners")}
                </div>
                {missingOwners.map((name) => (
                  <label key={name} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <Checkbox
                      checked={selectedOwners.has(name)}
                      onCheckedChange={(checked) => {
                        setSelectedOwners((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(name);
                          else next.delete(name);
                          return next;
                        });
                      }}
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => applyPendingImport({ expenseCategories: [], incomeCategories: [], owners: [] })}>
              {t("import.skipMissing")}
            </Button>
            <Button onClick={handleApplySelected}>
              {totalSelected > 0
                ? t("import.addSelected", { count: totalSelected })
                : t("import.addMissing")}
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
