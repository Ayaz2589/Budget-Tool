import { test, expect } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LandingRoute } from "@/pages/landing";
import { GoogleAuthContext, GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { RETURNING_USER_KEY } from "@/context/GoogleAuthContext";
import type { GoogleAuthContextValue } from "@/context/GoogleAuthContext";

const mockAuthValueSignedOut: GoogleAuthContextValue = {
  isSignedIn: false,
  userProfile: null,
  signIn: () => {},
  signOut: () => {},
  spreadsheetId: null,
  setSpreadsheetId: () => {},
  syncToSheets: async () => {},
  pullFromSheet: async () => {},
  syncStatus: "idle",
  syncErrorMessage: null,
};

const mockAuthValueSignedIn: GoogleAuthContextValue = {
  ...mockAuthValueSignedOut,
  isSignedIn: true,
};

function clearReturningFlag() {
  try {
    localStorage.removeItem(RETURNING_USER_KEY);
  } catch {
    // ignore
  }
}

test("LandingRoute redirects to /dashboard when signed in", () => {
  clearReturningFlag();
  const { container } = render(
    <GoogleAuthContext.Provider value={mockAuthValueSignedIn}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthContext.Provider>,
  );
  expect(within(container).getByText("Dashboard")).toBeInTheDocument();
});

test("LandingRoute redirects to /auth when not signed in and returning user", () => {
  try {
    localStorage.setItem(RETURNING_USER_KEY, "1");
  } catch {
    // ignore
  }
  const { container } = render(
    <GoogleAuthProviderFallback>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/auth" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthProviderFallback>,
  );
  expect(within(container).getByText("Login page")).toBeInTheDocument();
  try {
    localStorage.removeItem(RETURNING_USER_KEY);
  } catch {
    // ignore
  }
});

test("LandingRoute renders LandingPage when not signed in and new visitor", () => {
  clearReturningFlag();
  const { container } = render(
    <GoogleAuthProviderFallback>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/auth" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthProviderFallback>,
  );
  expect(within(container).getByText("Ortho")).toBeInTheDocument();
  expect(within(container).getByRole("link", { name: /get started/i })).toBeInTheDocument();
  expect(within(container).queryByText("Login page")).not.toBeInTheDocument();
});
