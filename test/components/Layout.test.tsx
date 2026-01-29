import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { RulesProvider } from "@/context/RulesContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";

function TestWrapper() {
  return (
    <BudgetProvider>
      <RulesProvider>
        <GoogleAuthProviderFallback>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<div>Dashboard content</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GoogleAuthProviderFallback>
      </RulesProvider>
    </BudgetProvider>
  );
}

test("Layout renders branding and nav", () => {
  render(<TestWrapper />);
  expect(screen.getByText("Ortho")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
  expect(screen.getByText("Dashboard content")).toBeInTheDocument();
});
