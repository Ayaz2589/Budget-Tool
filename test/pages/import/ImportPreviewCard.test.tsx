import { afterEach, test, expect } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ImportPreviewCard } from "@/pages/import/ImportPreviewCard";

const mockT = (key: string) => key;

afterEach(() => cleanup());

test("ImportPreviewCard shows Preview title and description when empty", () => {
  render(
    <ImportPreviewCard
      previewExpenses={[]}
      previewIncome={[]}
      previewDebts={[]}
      previewDebtPayments={[]}
      expenseCategories={[]}
      onUpdateCategory={() => {}}
      lastDetected=""
      t={mockT}
    />,
  );
  expect(screen.getByText("Preview")).toBeInTheDocument();
  expect(
    screen.getByText(/transactions matching existing entries/i),
  ).toBeInTheDocument();
});

test("ImportPreviewCard renders expense rows and category selector for csv imports", () => {
  render(
    <ImportPreviewCard
      previewExpenses={[
        {
          id: "e1",
          date: "2026-02-01",
          amount: 10.5,
          description: "Coffee",
          category: "",
          source: "manual",
        },
      ]}
      previewIncome={[]}
      previewDebts={[]}
      previewDebtPayments={[]}
      expenseCategories={["Food"]}
      onUpdateCategory={() => {}}
      lastDetected="amex"
      t={mockT}
    />,
  );
  expect(screen.getByText("Expenses to add")).toBeInTheDocument();
  expect(screen.getByText("Coffee")).toBeInTheDocument();
  expect(screen.getByRole("combobox")).toBeInTheDocument();
});

test("ImportPreviewCard shows debts section for PDF export", () => {
  render(
    <ImportPreviewCard
      previewExpenses={[]}
      previewIncome={[]}
      previewDebts={[
        {
          id: "d1",
          name: "Loan",
          initialAmount: 1000,
          startDate: "2026-01-01",
          owner: "Ayaz",
        },
      ]}
      previewDebtPayments={[]}
      expenseCategories={[]}
      onUpdateCategory={() => {}}
      lastDetected="pdf-export"
      t={mockT}
    />,
  );
  expect(screen.getByText("Debts to add")).toBeInTheDocument();
  expect(screen.getAllByText("Loan").length).toBeGreaterThan(0);
});
