/**
 * Trigger a short haptic tap via the Web Vibration API.
 * No-op on browsers/devices that don't support it.
 */
export function triggerHaptic(durationMs = 10): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(durationMs);
  }
}
