import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";

function TestWrapper() {
  return (
    <BudgetProvider>
      <GoogleAuthProviderFallback>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<Layout />}>
              <Route index element={<div>Dashboard content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </GoogleAuthProviderFallback>
    </BudgetProvider>
  );
}

test("Layout renders branding and nav", () => {
  render(<TestWrapper />);
  // App name appears in mobile header and in desktop sidebar
  expect(screen.getAllByText("Ortho").length).toBeGreaterThanOrEqual(1);
  expect(
    screen.getAllByRole("link", { name: /dashboard/i }).length,
  ).toBeGreaterThanOrEqual(1);
  expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  // Mobile bottom nav has More button
  expect(screen.getByRole("button", { name: /more/i })).toBeInTheDocument();
});
