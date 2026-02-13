import { expect, test } from "bun:test";
import {
  buildAllocationForRow,
  createDefaultTransactionRow,
  sortPresetTransactionsByCategory,
} from "@/components/add-transaction-utils";

test("createDefaultTransactionRow sets required defaults", () => {
  const row = createDefaultTransactionRow({
    defaultSource: "td",
    dateValue: "2026/02/12",
  });

  expect(row.source).toBe("td");
  expect(row.date).toBe("2026/02/12");
  expect(row.entryType).toBe("expense");
  expect(row.category).toBe("");
});

test("buildAllocationForRow handles single mode", () => {
  const row = createDefaultTransactionRow({
    dateValue: "2026/02/12",
  });
  row.allocationMode = "single";
  row.allocationOwners = ["Ayaz"];

  const allocation = buildAllocationForRow({
    row,
    paidByOwner: "",
    ownerOptions: ["Ayaz", "Tasnuva"],
  });

  expect(allocation).toEqual([{ owner: "Ayaz", percent: 100 }]);
});

test("buildAllocationForRow handles equal mode fallback owners", () => {
  const row = createDefaultTransactionRow({
    dateValue: "2026/02/12",
  });
  row.allocationMode = "equal";
  row.allocationOwners = [];

  const allocation = buildAllocationForRow({
    row,
    paidByOwner: "",
    ownerOptions: ["Ayaz", "Tasnuva"],
  });

  expect(allocation).toEqual([
    { owner: "Ayaz", percent: 50 },
    { owner: "Tasnuva", percent: 50 },
  ]);
});

test("buildAllocationForRow handles custom mode with valid percents", () => {
  const row = createDefaultTransactionRow({
    dateValue: "2026/02/12",
  });
  row.allocationMode = "custom";
  row.allocationOwners = ["Ayaz", "Tasnuva"];
  row.allocationPercents = { Ayaz: "70", Tasnuva: "30" };

  const allocation = buildAllocationForRow({
    row,
    paidByOwner: "",
    ownerOptions: [],
  });

  expect(allocation).toEqual([
    { owner: "Ayaz", percent: 70 },
    { owner: "Tasnuva", percent: 30 },
  ]);
});

test("sortPresetTransactionsByCategory sorts by category then description", () => {
  const sorted = sortPresetTransactionsByCategory([
    {
      id: "2",
      source: "amex",
      description: "Zebra",
      category: "Food",
      owner: "Ayaz",
      amount: 20,
    },
    {
      id: "1",
      source: "amex",
      description: "Alpha",
      category: "Bills",
      owner: "Ayaz",
      amount: 10,
    },
    {
      id: "3",
      source: "amex",
      description: "Beta",
      category: "Bills",
      owner: "Ayaz",
      amount: 15,
    },
  ]);

  expect(sorted.map((preset) => preset.id)).toEqual(["1", "3", "2"]);
});
