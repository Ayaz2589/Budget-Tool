import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";

test("SyncStatusIndicator shows syncing state", () => {
  render(
    <SyncStatusIndicator
      hasUnsyncedChanges={true}
      syncStatus="syncing"
      showSyncComplete={false}
    />
  );
  expect(screen.getByText("Syncing")).toBeInTheDocument();
});

test("SyncStatusIndicator shows pending state", () => {
  render(
    <SyncStatusIndicator
      hasUnsyncedChanges={true}
      syncStatus="idle"
      showSyncComplete={false}
    />
  );
  expect(screen.getByText("Sync pending")).toBeInTheDocument();
});

test("SyncStatusIndicator shows complete state", () => {
  render(
    <SyncStatusIndicator
      hasUnsyncedChanges={false}
      syncStatus="success"
      showSyncComplete={true}
    />
  );
  expect(screen.getByText("Sync complete")).toBeInTheDocument();
});
