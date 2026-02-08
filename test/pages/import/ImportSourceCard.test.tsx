import { afterEach, test, expect, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { ImportSourceCard } from "@/pages/import/ImportSourceCard";

const mockT = (key: string) => key;
afterEach(() => cleanup());

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
      cardSources={["amex", "amex-gold", "apple", "chase", "manual", "td"]}
      t={mockT}
    />,
  );
  expect(screen.getByText("import.uploadStatement")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /import\.amexcard/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /import\.applecard/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /import\.chasecard/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /import\.exportedpdf/i })).toBeInTheDocument();
});

test("ImportSourceCard hides unavailable sources and shows add button for preview", () => {
  const onAddToTransactions = mock(() => {});
  render(
    <ImportSourceCard
      selectedSource="apple"
      onSourceChange={() => {}}
      fileInputRef={createRef<HTMLInputElement | null>()}
      accept=".csv"
      onFileChange={() => {}}
      importError=""
      lastDetected="apple"
      sourceLabel="MasterCard"
      previewExpensesCount={2}
      previewIncomeCount={0}
      previewDebtsCount={0}
      previewDebtPaymentsCount={0}
      skippedDuplicates={1}
      onAddToTransactions={onAddToTransactions}
      isPdfExport={false}
      cardSources={["apple"]}
      t={mockT}
    />,
  );
  expect(
    screen.getByText("MasterCard · import.rowsToAddSummary (import.duplicatesSkipped)"),
  ).toBeInTheDocument();
  const addButton = screen.getByRole("button", { name: /import\.addtotransactions/i });
  fireEvent.click(addButton);
  expect(onAddToTransactions).toHaveBeenCalledTimes(1);
});
