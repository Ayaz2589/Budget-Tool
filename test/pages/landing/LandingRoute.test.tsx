import { test, expect } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LandingRoute } from "@/pages/landing";
import { GoogleAuthContext, GoogleAuthProviderFallback } from "@/context";
import { RETURNING_USER_KEY } from "@/context";
import { TOUR_COMPLETED_KEY } from "@/context";
import type { GoogleAuthContextValue } from "@/context";

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
  isAutoSyncEnabled: false,
  setAutoSyncEnabled: () => {},
  lastSyncAt: null,
  hasUnsyncedChanges: false,
  syncHealth: "healthy",
  sheetSetupState: "idle",
  availableDriveSheets: [],
  runSheetAutoSetup: async () => {},
  linkDriveSheet: () => {},
  createOrthoDriveSheet: async () => {},
  dismissSheetSetupPrompt: () => {},
};

const mockAuthValueSignedIn: GoogleAuthContextValue = {
  ...mockAuthValueSignedOut,
  isSignedIn: true,
};

function clearReturningFlag() {
  try {
    localStorage.removeItem(RETURNING_USER_KEY);
    localStorage.removeItem(TOUR_COMPLETED_KEY);
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
    localStorage.setItem(TOUR_COMPLETED_KEY, "1");
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

test("LandingRoute redirects to /tour when not signed in and first-time user", () => {
  clearReturningFlag();
  const { container } = render(
    <GoogleAuthProviderFallback>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/tour" element={<div>Tour page</div>} />
          <Route path="/auth" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthProviderFallback>,
  );
  expect(within(container).getByText("Tour page")).toBeInTheDocument();
  expect(within(container).queryByText("Login page")).not.toBeInTheDocument();
});

test("LandingRoute renders LandingPage when tour is completed and user is not returning", () => {
  try {
    localStorage.setItem(TOUR_COMPLETED_KEY, "1");
  } catch {
    // ignore
  }
  const { container } = render(
    <GoogleAuthProviderFallback>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/tour" element={<div>Tour page</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthProviderFallback>,
  );
  expect(within(container).getByText("Ortho")).toBeInTheDocument();
  expect(within(container).queryByText("Tour page")).not.toBeInTheDocument();
  clearReturningFlag();
});
