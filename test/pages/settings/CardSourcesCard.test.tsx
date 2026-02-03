import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { CardSourcesCard } from "@/pages/settings/CardSourcesCard";
import { BudgetProvider } from "@/context/BudgetContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";

function TestWrapper() {
  return (
    <BudgetProvider>
      <PresetTransactionsProvider>
        <GoogleAuthProviderFallback>
          <CardSourcesCard />
        </GoogleAuthProviderFallback>
      </PresetTransactionsProvider>
    </BudgetProvider>
  );
}

test("CardSourcesCard renders title and list of sources", () => {
  render(<TestWrapper />);
  expect(screen.getByText("Card sources")).toBeInTheDocument();
  // All expense sources should appear (labels from i18n)
  expect(screen.getByText("Manual")).toBeInTheDocument();
  expect(screen.getByText("Chase")).toBeInTheDocument();
});

test("CardSourcesCard renders checkboxes for each source", () => {
  render(<TestWrapper />);
  const checkboxes = screen.getAllByRole("checkbox");
  expect(checkboxes.length).toBeGreaterThanOrEqual(6); // amex, amex-gold, chase, apple, manual, td
});
