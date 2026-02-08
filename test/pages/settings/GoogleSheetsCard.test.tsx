import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { GoogleSheetsCard } from "@/pages/settings/GoogleSheetsCard";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";

const mockT = (key: string) => key;

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <GoogleAuthProviderFallback>{children}</GoogleAuthProviderFallback>;
}

test("GoogleSheetsCard shows card title and Connect Google when signed out", () => {
  render(
    <TestWrapper>
      <GoogleSheetsCard
        isSignedIn={false}
        signIn={() => {}}
        signOut={() => {}}
        spreadsheetId={undefined}
        sheetIdInput=""
        onSheetIdChange={() => {}}
        onSetSheetId={() => {}}
        syncToSheets={() => {}}
        pullFromSheet={() => {}}
        syncStatus="idle"
        syncErrorMessage={undefined}
        isAutoSyncEnabled={false}
        onAutoSyncToggle={() => {}}
        lastSyncAt={null}
        hasUnsyncedChanges={false}
        syncHealth="healthy"
        onRepairDates={() => {}}
        repairResult={null}
        syncConfirmOpen={false}
        setSyncConfirmOpen={() => {}}
        restoreConfirmOpen={false}
        setRestoreConfirmOpen={() => {}}
        t={mockT}
      />
    </TestWrapper>,
  );
  expect(screen.getByText("settings.googleSheets")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /settings\.connectgoogle/i }),
  ).toBeInTheDocument();
});
