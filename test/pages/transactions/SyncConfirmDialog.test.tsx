import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { SyncConfirmDialog } from "@/pages/transactions/SyncConfirmDialog";

const mockT = (key: string) => key;

test("SyncConfirmDialog shows title and sync button when open", () => {
  render(
    <SyncConfirmDialog
      open={true}
      onOpenChange={() => {}}
      onConfirm={() => {}}
      t={mockT}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("transactions.syncConfirmTitle")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /transactions\.syncToGoogleSheets/i }),
  ).toBeInTheDocument();
});
