import { test, expect, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
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
      categoryFilter={[]}
      onCategoryFilterChange={() => {}}
      ownerFilter="all"
      onOwnerFilterChange={() => {}}
      searchFilter=""
      onSearchFilterChange={() => {}}
      expenseCategories={["My Purchase", "Amazon"]}
      ownerOptions={["AYAZ UDDIN", "TASNUVA AHMED"]}
      cardSources={["amex", "apple", "chase", "manual", "td"]}
      hasActiveFilters={false}
      onClearFilters={() => {}}
      t={mockT}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(
    screen.getByText("transactions.filtersActionsTitle"),
  ).toBeInTheDocument();
  expect(screen.getByText("common.filters")).toBeInTheDocument();
});

test("FiltersAndActionsDialog month picker updates month filter", () => {
  const onMonthFilterChange = mock(() => {});
  render(
    <FiltersAndActionsDialog
      open={true}
      onOpenChange={() => {}}
      monthFilter="2026-02"
      onMonthFilterChange={onMonthFilterChange}
      sourceFilter="all"
      onSourceFilterChange={() => {}}
      categoryFilter={[]}
      onCategoryFilterChange={() => {}}
      ownerFilter="all"
      onOwnerFilterChange={() => {}}
      typeFilter="all"
      onTypeFilterChange={() => {}}
      includeOwnerTransfersInTotals={true}
      onIncludeOwnerTransfersInTotalsChange={() => {}}
      searchFilter=""
      onSearchFilterChange={() => {}}
      expenseCategories={["My Purchase", "Amazon"]}
      ownerOptions={["AYAZ UDDIN", "TASNUVA AHMED"]}
      cardSources={["amex", "apple", "chase", "manual", "td"]}
      hasActiveFilters={false}
      onClearFilters={() => {}}
      t={mockT}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "2026-02" }));
  const monthButtons = document.querySelectorAll("div.grid.grid-cols-3 button");
  fireEvent.click(monthButtons[0] as HTMLButtonElement);

  expect(onMonthFilterChange).toHaveBeenCalledWith("2026-01");
});
