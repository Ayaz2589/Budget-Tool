import { describe, expect, it, jest } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useLongPress } from "@/hooks/useLongPress";

function makeTouchEvent(x: number, y: number): React.TouchEvent {
  return {
    touches: [{ clientX: x, clientY: y }],
  } as unknown as React.TouchEvent;
}

/** Wait slightly longer than the threshold for the timer to fire. */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("useLongPress", () => {
  it("fires callback after default 500ms threshold", async () => {
    const cb = jest.fn();
    const { result } = renderHook(() => useLongPress(cb));

    act(() => {
      result.current.onTouchStart(makeTouchEvent(100, 100));
    });

    expect(cb).not.toHaveBeenCalled();

    await act(() => wait(550));

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("fires callback after custom threshold", async () => {
    const cb = jest.fn();
    const { result } = renderHook(() =>
      useLongPress(cb, { threshold: 200 }),
    );

    act(() => {
      result.current.onTouchStart(makeTouchEvent(100, 100));
    });

    // Not yet fired at 100ms
    await act(() => wait(100));
    expect(cb).not.toHaveBeenCalled();

    // Fired by 250ms
    await act(() => wait(150));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("cancels if finger moves beyond moveThreshold", async () => {
    const cb = jest.fn();
    const { result } = renderHook(() =>
      useLongPress(cb, { moveThreshold: 10, threshold: 200 }),
    );

    act(() => {
      result.current.onTouchStart(makeTouchEvent(100, 100));
    });

    // Move 15px (> 10px threshold)
    act(() => {
      result.current.onTouchMove(makeTouchEvent(115, 100));
    });

    await act(() => wait(300));

    expect(cb).not.toHaveBeenCalled();
  });

  it("does not cancel if movement is within threshold", async () => {
    const cb = jest.fn();
    const { result } = renderHook(() =>
      useLongPress(cb, { moveThreshold: 10, threshold: 200 }),
    );

    act(() => {
      result.current.onTouchStart(makeTouchEvent(100, 100));
    });

    // Move 5px (< 10px threshold)
    act(() => {
      result.current.onTouchMove(makeTouchEvent(105, 100));
    });

    await act(() => wait(250));

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("cancels on early touchend", async () => {
    const cb = jest.fn();
    const { result } = renderHook(() =>
      useLongPress(cb, { threshold: 300 }),
    );

    act(() => {
      result.current.onTouchStart(makeTouchEvent(100, 100));
    });

    await act(() => wait(100));

    act(() => {
      result.current.onTouchEnd();
    });

    await act(() => wait(300));

    expect(cb).not.toHaveBeenCalled();
  });

  it("cleans up timer on unmount", async () => {
    const cb = jest.fn();
    const { result, unmount } = renderHook(() =>
      useLongPress(cb, { threshold: 200 }),
    );

    act(() => {
      result.current.onTouchStart(makeTouchEvent(100, 100));
    });

    unmount();

    await wait(300);
    // No error thrown — timer fires but component is unmounted
  });

  it("triggers haptic feedback when enabled", async () => {
    const cb = jest.fn();
    const vibrateMock = jest.fn();
    navigator.vibrate = vibrateMock;

    const { result } = renderHook(() =>
      useLongPress(cb, { haptic: true, threshold: 200 }),
    );

    act(() => {
      result.current.onTouchStart(makeTouchEvent(100, 100));
    });

    await act(() => wait(250));

    expect(vibrateMock).toHaveBeenCalledWith(50);
  });

  it("does not trigger haptic when disabled", async () => {
    const cb = jest.fn();
    const vibrateMock = jest.fn();
    navigator.vibrate = vibrateMock;

    const { result } = renderHook(() =>
      useLongPress(cb, { haptic: false, threshold: 200 }),
    );

    act(() => {
      result.current.onTouchStart(makeTouchEvent(100, 100));
    });

    await act(() => wait(250));

    expect(vibrateMock).not.toHaveBeenCalled();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
