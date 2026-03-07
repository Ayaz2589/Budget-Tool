import { test, expect } from "bun:test";
import { withTimeout, TimeoutError } from "@/lib/platform/withTimeout";

test("resolves when promise completes within timeout", async () => {
  const result = await withTimeout(Promise.resolve(42), 1000);
  expect(result).toBe(42);
});

test("rejects with TimeoutError when promise exceeds timeout", async () => {
  const slow = new Promise<number>((resolve) => setTimeout(() => resolve(42), 500));
  try {
    await withTimeout(slow, 10);
    expect(true).toBe(false); // should not reach
  } catch (err) {
    expect(err).toBeInstanceOf(TimeoutError);
    expect((err as TimeoutError).message).toContain("timed out");
  }
});

test("TimeoutError has the correct name", () => {
  const err = new TimeoutError("test");
  expect(err.name).toBe("TimeoutError");
  expect(err instanceof Error).toBe(true);
});
