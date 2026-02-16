import { expect, test } from "bun:test";
import { buildTransactionRows, filterAndSortTransactionRows } from "@/pages/transactions/transactionsLedger";

test("owner filter uses allocation-aware expense amounts and signed transfer impact", () => {
  const rows = buildTransactionRows({
    expenses: [
      {
        id: "e1",
        date: "2026-02-01",
        amount: 200,
        description: "Shared dinner",
        category: "50/50",
        source: "manual",
        paidByOwner: "Ayaz",
      },
    ],
    ownerTransfers: [
      {
        id: "t1",
        date: "2026-02-02",
        fromOwner: "Tasnuva",
        toOwner: "Ayaz",
        amount: 50,
      },
    ],
    transferCategoryLabel: "Owner Transfer",
  });

  const tasnuvaRows = filterAndSortTransactionRows({
    rows,
    filters: {
      monthFilter: "",
      sourceFilter: "all",
      categoryFilter: [],
      searchFilter: "",
      ownerFilter: "Tasnuva",
      typeFilter: "all",
    },
    sortBy: "date",
    sortDir: "desc",
    ownersForAllocation: ["Ayaz", "Tasnuva"],
  });

  const ayazRows = filterAndSortTransactionRows({
    rows,
    filters: {
      monthFilter: "",
      sourceFilter: "all",
      categoryFilter: [],
      searchFilter: "",
      ownerFilter: "Ayaz",
      typeFilter: "all",
    },
    sortBy: "date",
    sortDir: "desc",
    ownersForAllocation: ["Ayaz", "Tasnuva"],
  });

  const tasnuvaTotal = tasnuvaRows.reduce((sum, row) => sum + row.amount, 0);
  const ayazTotal = ayazRows.reduce((sum, row) => sum + row.amount, 0);

  expect(tasnuvaTotal).toBe(150); // 100 allocated expense + 50 sent
  expect(ayazTotal).toBe(50); // 100 allocated expense - 50 received
});

