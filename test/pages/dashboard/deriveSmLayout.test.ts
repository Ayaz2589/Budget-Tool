import { describe, expect, test } from "bun:test";
import { deriveSmLayout } from "@/pages/dashboard/DashboardGrid";

describe("deriveSmLayout", () => {
  test("returns empty array for empty input", () => {
    expect(deriveSmLayout([])).toEqual([]);
  });

  test("scales w by 0.5 and rounds", () => {
    const input = [{ i: "a", x: 0, y: 0, w: 6, h: 2 }];
    const result = deriveSmLayout(input);
    expect(result[0].w).toBe(3);
  });

  test("scales x by 0.5 and rounds", () => {
    const input = [{ i: "a", x: 6, y: 0, w: 6, h: 2 }];
    const result = deriveSmLayout(input);
    expect(result[0].x).toBe(3);
  });

  test("preserves y and h unchanged", () => {
    const input = [{ i: "a", x: 0, y: 5, w: 12, h: 8 }];
    const result = deriveSmLayout(input);
    expect(result[0].y).toBe(5);
    expect(result[0].h).toBe(8);
  });

  test("preserves i unchanged", () => {
    const input = [{ i: "net-cash-flow", x: 0, y: 0, w: 6, h: 2 }];
    const result = deriveSmLayout(input);
    expect(result[0].i).toBe("net-cash-flow");
  });

  test("clamps w to minimum of 1", () => {
    const input = [{ i: "a", x: 0, y: 0, w: 1, h: 2 }];
    const result = deriveSmLayout(input);
    expect(result[0].w).toBe(1);
  });

  test("clamps x so x + w does not exceed 12", () => {
    // x=18, w=6 → scaled w=3, scaled x=min(9, 12-3)=9 → x+w=12
    const input = [{ i: "a", x: 18, y: 0, w: 6, h: 2 }];
    const result = deriveSmLayout(input);
    expect(result[0].x).toBe(9);
    expect(result[0].w).toBe(3);
    expect(result[0].x + result[0].w).toBeLessThanOrEqual(12);
  });

  test("scales full-width widget (w=24) to w=12", () => {
    const input = [{ i: "a", x: 0, y: 0, w: 24, h: 4 }];
    const result = deriveSmLayout(input);
    expect(result[0].w).toBe(12);
    expect(result[0].x).toBe(0);
  });

  test("scales chart at x=12, w=12 to x=6, w=6", () => {
    const input = [{ i: "a", x: 12, y: 5, w: 12, h: 8 }];
    const result = deriveSmLayout(input);
    expect(result[0].x).toBe(6);
    expect(result[0].w).toBe(6);
  });

  test("scales small KPI (w=3) to w=2", () => {
    const input = [{ i: "a", x: 0, y: 0, w: 3, h: 2 }];
    const result = deriveSmLayout(input);
    expect(result[0].w).toBe(2);
  });

  test("preserves item order", () => {
    const input = [
      { i: "first", x: 0, y: 0, w: 6, h: 2 },
      { i: "second", x: 6, y: 0, w: 6, h: 2 },
      { i: "third", x: 12, y: 0, w: 6, h: 2 },
    ];
    const result = deriveSmLayout(input);
    expect(result.map((r) => r.i)).toEqual(["first", "second", "third"]);
  });

  test("output length equals input length", () => {
    const input = [
      { i: "a", x: 0, y: 0, w: 6, h: 2 },
      { i: "b", x: 6, y: 0, w: 6, h: 2 },
    ];
    const result = deriveSmLayout(input);
    expect(result.length).toBe(input.length);
  });

  test("all items satisfy x + w <= 12 invariant", () => {
    // Use the default layout positions from the real app
    const input = [
      { i: "net-cash-flow", x: 0, y: 0, w: 6, h: 2 },
      { i: "total-spent", x: 6, y: 0, w: 6, h: 2 },
      { i: "total-income", x: 12, y: 0, w: 6, h: 2 },
      { i: "total-debt", x: 18, y: 0, w: 6, h: 2 },
      { i: "cash-flow-chart", x: 0, y: 5, w: 12, h: 8 },
      { i: "net-trend-chart", x: 12, y: 5, w: 9, h: 3 },
      { i: "category-chart", x: 0, y: 13, w: 12, h: 8 },
      { i: "owner-split-chart", x: 12, y: 13, w: 12, h: 8 },
    ];
    const result = deriveSmLayout(input);
    for (const item of result) {
      expect(item.x + item.w).toBeLessThanOrEqual(12);
      expect(item.w).toBeGreaterThanOrEqual(1);
      expect(item.x).toBeGreaterThanOrEqual(0);
    }
  });

  test("scales net-trend-chart w=9 to w=5", () => {
    // round(9 * 0.5) = round(4.5) = 5 (banker's rounding, but Math.round rounds .5 up)
    const input = [{ i: "a", x: 12, y: 5, w: 9, h: 3 }];
    const result = deriveSmLayout(input);
    expect(result[0].w).toBe(5);
    expect(result[0].x + result[0].w).toBeLessThanOrEqual(12);
  });
});
