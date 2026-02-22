import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  threshold?: number;
  moveThreshold?: number;
  haptic?: boolean;
}

interface UseLongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useLongPress(
  callback: () => void,
  options: UseLongPressOptions = {},
): UseLongPressHandlers {
  const { threshold = 500, moveThreshold = 10, haptic = true } = options;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPos.current = null;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (haptic) navigator.vibrate?.(50);
        callback();
      }, threshold);
    },
    [callback, threshold, haptic],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPos.current || !timerRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startPos.current.x;
      const dy = touch.clientY - startPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
        clear();
      }
    },
    [moveThreshold, clear],
  );

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
