import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { CardSourcesCard } from "@/pages/settings/CardSourcesCard";
import { BudgetProvider } from "@/context";
import { PresetTransactionsProvider } from "@/context";
import { GoogleAuthProviderFallback } from "@/context";

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
  expect(screen.getAllByText("Manual").length).toBeGreaterThan(0);
});

test("CardSourcesCard renders checkboxes for each source", () => {
  render(<TestWrapper />);
  const checkboxes = screen.getAllByRole("checkbox");
  expect(checkboxes.length).toBeGreaterThanOrEqual(10); // amex, amex-gold, apple/mastercard, visa, sapphire, boa, wells-fargo, chase, manual, td
});
