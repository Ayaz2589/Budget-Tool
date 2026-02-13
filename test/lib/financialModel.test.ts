import { expect, test } from "bun:test";
import {
  collectFinancialOwners,
  getOwnerAllocatedExpenseAmount,
  getSignedOwnerTransferAmount,
  scopeFinancialData,
} from "@/lib/financialModel";

test("collectFinancialOwners builds normalized owner union across domains", () => {
  const owners = collectFinancialOwners({
    owners: ["Ayaz"],
    expenses: [
      {
        id: "e1",
        date: "2026-02-01",
        amount: 200,
        description: "Shared",
        category: "50/50",
        source: "manual",
        paidByOwner: " Tasnuva ",
        allocation: [{ owner: "Ayaz", percent: 50 }, { owner: "Tasnuva", percent: 50 }],
      },
    ],
    income: [
      {
        id: "i1",
        date: "2026-02-01",
        amount: 5000,
        description: "Paycheck",
        category: "Paycheck",
        owner: "Ayaz",
      },
    ],
    debts: [{ id: "d1", name: "Card", initialAmount: 1000, owner: "Nova" }],
    ownerTransfers: [{ id: "t1", date: "2026-02-02", fromOwner: "Ayaz", toOwner: "Nova", amount: 10 }],
  });

  expect(owners).toEqual(["Ayaz", "Nova", "Tasnuva"]);
});

test("owner transfer signed amount is positive for sent and negative for received", () => {
  const sent = getSignedOwnerTransferAmount({
    transfer: { id: "t1", date: "2026-02-02", fromOwner: "Tasnuva", toOwner: "Ayaz", amount: 50 },
    selectedOwner: "Tasnuva",
  });
  const received = getSignedOwnerTransferAmount({
    transfer: { id: "t2", date: "2026-02-02", fromOwner: "Tasnuva", toOwner: "Ayaz", amount: 50 },
    selectedOwner: "Ayaz",
  });
  const unrelated = getSignedOwnerTransferAmount({
    transfer: { id: "t3", date: "2026-02-02", fromOwner: "Tasnuva", toOwner: "Ayaz", amount: 50 },
    selectedOwner: "Nova",
  });

  expect(sent).toBe(50);
  expect(received).toBe(-50);
  expect(unrelated).toBeNull();
});

test("owner allocated expense amount is allocation aware", () => {
  const amount = getOwnerAllocatedExpenseAmount({
    expense: {
      id: "e1",
      date: "2026-02-01",
      amount: 300,
      description: "Mixed",
      category: "50/50",
      source: "manual",
      allocationMode: "custom",
      allocation: [{ owner: "Ayaz", amount: 100 }, { owner: "Tasnuva", amount: 200 }],
    },
    selectedOwner: "Tasnuva",
    owners: ["Ayaz", "Tasnuva"],
  });

  expect(amount).toBe(200);
});

test("scopeFinancialData returns owner-scoped datasets for individual mode", () => {
  const scoped = scopeFinancialData({
    viewMode: "individual",
    selectedOwner: "Tasnuva",
    owners: ["Ayaz", "Tasnuva"],
    expenses: [
      {
        id: "e1",
        date: "2026-02-01",
        amount: 200,
        description: "Shared",
        category: "50/50",
        source: "manual",
      },
      {
        id: "e2",
        date: "2026-02-01",
        amount: 500,
        description: "Personal",
        category: "Food",
        source: "manual",
        paidByOwner: "Ayaz",
      },
    ],
    income: [
      {
        id: "i1",
        date: "2026-02-01",
        amount: 1000,
        description: "Tasnuva income",
        category: "Paycheck",
        owner: "Tasnuva",
      },
      {
        id: "i2",
        date: "2026-02-01",
        amount: 1000,
        description: "Ayaz income",
        category: "Paycheck",
        owner: "Ayaz",
      },
    ],
    debts: [
      { id: "d1", name: "Tasnuva card", initialAmount: 1000, owner: "Tasnuva" },
      { id: "d2", name: "Ayaz card", initialAmount: 1000, owner: "Ayaz" },
    ],
    debtPayments: [
      { id: "p1", debtId: "d1", date: "2026-02-02", amount: 100 },
      { id: "p2", debtId: "d2", date: "2026-02-02", amount: 100 },
    ],
    ownerTransfers: [
      { id: "t1", date: "2026-02-02", fromOwner: "Tasnuva", toOwner: "Ayaz", amount: 50 },
      { id: "t2", date: "2026-02-02", fromOwner: "Nova", toOwner: "Ayaz", amount: 30 },
    ],
  });

  expect(scoped.expenses).toHaveLength(1);
  expect(scoped.expenses[0]?.amount).toBe(100);
  expect(scoped.income).toHaveLength(1);
  expect(scoped.income[0]?.owner).toBe("Tasnuva");
  expect(scoped.debts.map((debt) => debt.id)).toEqual(["d1"]);
  expect(scoped.debtPayments.map((payment) => payment.id)).toEqual(["p1"]);
  expect(scoped.ownerTransfers.map((transfer) => transfer.id)).toEqual(["t1"]);
});

