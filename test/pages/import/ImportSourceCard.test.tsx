import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { ImportSourceCard } from "@/pages/import/ImportSourceCard";

const mockT = (key: string) => key;

test("ImportSourceCard shows upload card title and source buttons", () => {
  const fileInputRef = createRef<HTMLInputElement | null>();
  render(
    <ImportSourceCard
      selectedSource="amex"
      onSourceChange={() => {}}
      fileInputRef={fileInputRef}
      accept=".csv"
      onFileChange={() => {}}
      importError=""
      lastDetected=""
      sourceLabel="American Express"
      previewExpensesCount={0}
      previewIncomeCount={0}
      previewDebtsCount={0}
      previewDebtPaymentsCount={0}
      skippedDuplicates={0}
      onAddToTransactions={() => {}}
      isPdfExport={false}
      cardSources={["amex", "amex-gold", "apple", "manual", "td"]}
      t={mockT}
    />,
  );
  expect(screen.getByText("import.uploadStatement")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /import\.amexcard/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /import\.applecard/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /import\.exportedpdf/i })).toBeInTheDocument();
});
