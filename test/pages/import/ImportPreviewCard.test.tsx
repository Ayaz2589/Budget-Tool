import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ImportPreviewCard } from "@/pages/import/ImportPreviewCard";

const mockT = (key: string) => key;

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
