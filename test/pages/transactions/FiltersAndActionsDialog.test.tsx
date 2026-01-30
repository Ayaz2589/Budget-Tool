import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { FiltersAndActionsDialog } from "@/pages/transactions/FiltersAndActionsDialog";

const mockT = (key: string, opts?: { count?: number }) =>
  opts?.count != null ? `${key}:${opts.count}` : key;

test("FiltersAndActionsDialog shows title and Filters section when open", () => {
  render(
    <FiltersAndActionsDialog
      open={true}
      onOpenChange={() => {}}
      monthFilter=""
      onMonthFilterChange={() => {}}
      sourceFilter="all"
      onSourceFilterChange={() => {}}
      categoryFilter=""
      onCategoryFilterChange={() => {}}
      cardMemberFilter="all"
      onCardMemberFilterChange={() => {}}
      searchFilter=""
      onSearchFilterChange={() => {}}
      expenseCategories={["My Purchase", "Amazon"]}
      cardMemberOptions={["AYAZ UDDIN", "TASNUVA AHMED"]}
      hasActiveFilters={false}
      onClearFilters={() => {}}
      onCleanDescriptions={() => {}}
      onDownloadPdf={() => {}}
      someSelected={false}
      selectedCount={0}
      onDeleteSelected={() => {}}
      onClearSelection={() => {}}
      expensesCount={0}
      onDeleteAll={() => {}}
      t={mockT}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(
    screen.getByText("transactions.filtersActionsTitle"),
  ).toBeInTheDocument();
  expect(screen.getByText("common.filters")).toBeInTheDocument();
  expect(screen.getByText("common.actions")).toBeInTheDocument();
});
