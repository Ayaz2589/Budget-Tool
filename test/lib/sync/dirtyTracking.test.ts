import { describe, it, expect } from "bun:test";
import {
  createDirtyTracker,
  type SyncModelName,
} from "@/lib/sync/dirtyTracking";

describe("dirtyTracking", () => {
  it("isDirty returns true when model was never synced", () => {
    const tracker = createDirtyTracker();
    expect(tracker.isDirty("expenses", [{ id: "1", amount: 100 }])).toBe(true);
  });

  it("isDirty returns false after markSynced with same data", () => {
    const tracker = createDirtyTracker();
    const data = [{ id: "1", amount: 100 }];
    tracker.markSynced("expenses", data);
    expect(tracker.isDirty("expenses", data)).toBe(false);
  });

  it("isDirty returns true after markSynced with different data", () => {
    const tracker = createDirtyTracker();
    const data1 = [{ id: "1", amount: 100 }];
    const data2 = [{ id: "1", amount: 200 }];
    tracker.markSynced("expenses", data1);
    expect(tracker.isDirty("expenses", data2)).toBe(true);
  });

  it("reset clears all tracked hashes", () => {
    const tracker = createDirtyTracker();
    const data = [{ id: "1", amount: 100 }];
    tracker.markSynced("expenses", data);
    tracker.markSynced("income", data);
    expect(tracker.isDirty("expenses", data)).toBe(false);
    expect(tracker.isDirty("income", data)).toBe(false);

    tracker.reset();

    expect(tracker.isDirty("expenses", data)).toBe(true);
    expect(tracker.isDirty("income", data)).toBe(true);
  });

  it("different models are tracked independently", () => {
    const tracker = createDirtyTracker();
    const expenseData = [{ id: "1", amount: 100 }];
    const incomeData = [{ id: "2", amount: 500 }];

    tracker.markSynced("expenses", expenseData);

    expect(tracker.isDirty("expenses", expenseData)).toBe(false);
    expect(tracker.isDirty("income", incomeData)).toBe(true);
  });

  it("isAnyDirty returns true when at least one model is dirty", () => {
    const tracker = createDirtyTracker();
    const data1 = [{ id: "1" }];
    const data2 = [{ id: "2" }];
    tracker.markSynced("expenses", data1);
    tracker.markSynced("income", data2);

    // Same data — not dirty
    expect(
      tracker.isAnyDirty([
        ["expenses", data1],
        ["income", data2],
      ]),
    ).toBe(false);

    // Change income data
    expect(
      tracker.isAnyDirty([
        ["expenses", data1],
        ["income", [{ id: "3" }]],
      ]),
    ).toBe(true);
  });

  it("isAnyDirty returns true when model was never synced", () => {
    const tracker = createDirtyTracker();
    expect(tracker.isAnyDirty([["debts", []]])).toBe(true);
  });

  it("handles empty arrays correctly", () => {
    const tracker = createDirtyTracker();
    tracker.markSynced("debts", []);
    expect(tracker.isDirty("debts", [])).toBe(false);
    expect(tracker.isDirty("debts", [{ id: "1" }])).toBe(true);
  });

  it("tracks all seven model names", () => {
    const tracker = createDirtyTracker();
    const models: SyncModelName[] = [
      "expenses",
      "mortgage",
      "income",
      "debts",
      "debtPayments",
      "ownerTransfers",
      "presetTransactions",
    ];
    const data = [{ test: true }];

    for (const model of models) {
      tracker.markSynced(model, data);
    }
    for (const model of models) {
      expect(tracker.isDirty(model, data)).toBe(false);
    }
  });
});
