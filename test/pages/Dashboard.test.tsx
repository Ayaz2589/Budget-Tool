import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/dashboard/Dashboard";

function TestWrapper() {
  return (
    <BudgetProvider>
      <GoogleAuthProviderFallback>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<Layout />}>
              <Route index element={<Dashboard />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </GoogleAuthProviderFallback>
    </BudgetProvider>
  );
}

test("Dashboard renders without throwing", () => {
  render(<TestWrapper />);
  expect(
    screen.getByRole("heading", { name: "Dashboard" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Total income")).toBeInTheDocument();
});
