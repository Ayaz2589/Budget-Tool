import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TourPage, resolveSwipeAction } from "@/pages/tour/TourPage";
import {
  GoogleAuthContext,
  RETURNING_USER_KEY,
  TOUR_COMPLETED_KEY,
} from "@/context";
import type { GoogleAuthContextValue } from "@/context";

function renderWithAuth(value: GoogleAuthContextValue) {
  return render(
    <GoogleAuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/tour"]}>
        <Routes>
          <Route path="/tour" element={<TourPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthContext.Provider>,
  );
}

function baseAuth(overrides: Partial<GoogleAuthContextValue> = {}): GoogleAuthContextValue {
  return {
    isSignedIn: false,
    signIn: () => {},
    signOut: () => {},
    userProfile: null,
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
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.removeItem(RETURNING_USER_KEY);
  localStorage.removeItem(TOUR_COMPLETED_KEY);
});

afterEach(() => {
  cleanup();
});

test("X button on language card navigates to landing page", () => {
  render(
    <GoogleAuthContext.Provider value={baseAuth()}>
      <MemoryRouter initialEntries={["/tour"]}>
        <Routes>
          <Route path="/tour" element={<TourPage />} />
          <Route path="/" element={<div>Landing</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthContext.Provider>,
  );
  fireEvent.click(screen.getByTestId("tour-close"));
  expect(screen.getByText("Landing")).toBeInTheDocument();
});

test("X button on content step navigates to landing page", async () => {
  renderWithAuth(baseAuth());
  fireEvent.click(screen.getByTestId("tour-language-continue"));
  await screen.findByText("Welcome to Ortho");
  fireEvent.click(screen.getByTestId("tour-close"));
  expect(screen.queryByText("Welcome to Ortho")).not.toBeInTheDocument();
});

test("X button in replay mode navigates to dashboard", async () => {
  render(
    <GoogleAuthContext.Provider value={baseAuth({ isSignedIn: true })}>
      <MemoryRouter initialEntries={["/tour?replay=1"]}>
        <Routes>
          <Route path="/tour" element={<TourPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthContext.Provider>,
  );
  fireEvent.click(screen.getByTestId("tour-language-continue"));
  await screen.findByText("Welcome to Ortho");
  fireEvent.click(screen.getByTestId("tour-close"));
  expect(screen.getByText("Dashboard")).toBeInTheDocument();
});

test("TourPage redirects signed-in users to dashboard", () => {
  renderWithAuth(baseAuth({ isSignedIn: true }));
  expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
});

test("TourPage allows signed-in replay mode", async () => {
  render(
    <GoogleAuthContext.Provider value={baseAuth({ isSignedIn: true })}>
      <MemoryRouter initialEntries={["/tour?replay=1"]}>
        <Routes>
          <Route path="/tour" element={<TourPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </GoogleAuthContext.Provider>,
  );

  expect(
    screen.getByText("What language do you want to use Ortho?"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tour-language-continue"));
  await screen.findByText("Welcome to Ortho");
  for (let i = 0; i < 10; i += 1) {
    if (screen.queryByRole("button", { name: "Finish tour" })) break;
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    // allow animated card transitions to complete
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  expect(screen.getByRole("button", { name: "Finish tour" })).toBeInTheDocument();
  expect(
    screen.getByText(
      "Your account is already connected. You can finish this walkthrough and continue to your dashboard.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Sign in with Google" }),
  ).not.toBeInTheDocument();
});

test("TourPage allows stepping through tour and sign-in on final step", async () => {
  const signIn = mock(() => {});
  renderWithAuth(baseAuth({ signIn }));

  expect(
    screen.getByText("What language do you want to use Ortho?"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tour-language-continue"));
  await screen.findByText("Welcome to Ortho");
  for (let i = 0; i < 10; i += 1) {
    if (screen.queryByRole("button", { name: "Sign in with Google" })) break;
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  expect(
    screen.getByRole("button", { name: "Sign in with Google" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Ready to Start")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

  expect(signIn).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(RETURNING_USER_KEY)).toBe("1");
  expect(localStorage.getItem(TOUR_COMPLETED_KEY)).toBe("1");
});

test("TourPage language selector changes tour copy", async () => {
  renderWithAuth(baseAuth());
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(screen.getByText("Español"));
  fireEvent.click(screen.getByTestId("tour-language-continue"));
  expect(await screen.findByText("Bienvenido a Ortho")).toBeInTheDocument();
});

test("Toggle does not appear on language step", () => {
  renderWithAuth(baseAuth());
  expect(screen.queryByTestId("tour-text-toggle")).not.toBeInTheDocument();
});

test("Toggle switches to simplified text and back", async () => {
  renderWithAuth(baseAuth());
  fireEvent.click(screen.getByTestId("tour-language-continue"));
  await screen.findByText("Welcome to Ortho");

  // Detailed text is shown by default
  expect(
    screen.getByText(/Ortho is built to give you one place/),
  ).toBeInTheDocument();

  // Toggle should say "Simple" (switch-to label)
  const toggle = screen.getByTestId("tour-text-toggle");
  expect(toggle.textContent).toBe("Simple");

  // Click toggle to switch to simplified
  fireEvent.click(toggle);
  await screen.findByText(/Ortho helps you manage your household money/);
  expect(toggle.textContent).toBe("Detailed");

  // Click toggle again to revert
  fireEvent.click(toggle);
  await screen.findByText(/Ortho is built to give you one place/);
});

test("Simplified mode persists across step navigation", async () => {
  renderWithAuth(baseAuth());
  fireEvent.click(screen.getByTestId("tour-language-continue"));
  await screen.findByText("Welcome to Ortho");

  // Switch to simplified on step 1
  fireEvent.click(screen.getByTestId("tour-text-toggle"));
  await screen.findByText(/Ortho helps you manage your household money/);

  // Navigate to next step
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  // Step 2 should also show simplified text
  await screen.findByText(/Back up your data to Google Sheets/);
});

describe("resolveSwipeAction", () => {
  test("returns next for left swipe past threshold", () => {
    expect(resolveSwipeAction(-60, 0, 2, 8)).toBe("next");
  });

  test("returns back for right swipe past threshold", () => {
    expect(resolveSwipeAction(60, 0, 2, 8)).toBe("back");
  });

  test("returns null when below threshold", () => {
    expect(resolveSwipeAction(-20, 0, 2, 8)).toBeNull();
  });

  test("returns null at boundaries", () => {
    expect(resolveSwipeAction(-60, 0, 8, 8)).toBeNull(); // last step
    expect(resolveSwipeAction(60, 0, 0, 8)).toBeNull(); // first step
  });

  test("responds to velocity", () => {
    expect(resolveSwipeAction(-20, -400, 2, 8)).toBe("next");
    expect(resolveSwipeAction(20, 400, 2, 8)).toBe("back");
  });
});
