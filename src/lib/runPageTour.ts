import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import type { TourStepInput } from "@/types/tour";

export type { TourStepInput };

/**
 * Runs a multi-step page tour using driver.js.
 * Steps without `target` show a centered popover (intro/outro).
 */
export function runPageTour(
  steps: TourStepInput[],
  t: (key: string) => string,
): void {
  const isVisible = (el: Element | null): el is HTMLElement => {
    if (!(el instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      el.getClientRects().length > 0
    );
  };

  const findVisible = (selector: string): HTMLElement | null => {
    const nodes = Array.from(document.querySelectorAll(selector));
    for (const node of nodes) {
      if (isVisible(node)) return node;
    }
    return null;
  };

  const waitForElement = (selector: string, timeoutMs: number): Promise<void> =>
    new Promise((resolve) => {
      const startedAt = Date.now();
      const tick = () => {
        if (findVisible(selector)) {
          resolve();
          return;
        }
        if (Date.now() - startedAt >= timeoutMs) {
          resolve();
          return;
        }
        window.setTimeout(tick, 50);
      };
      tick();
    });

  let driverObj: ReturnType<typeof driver>;

  const driveSteps = steps.map((s, index) => {
    const popover: Record<string, unknown> = {
      title: s.title ?? (s.titleKey ? t(s.titleKey) : ""),
      description: s.content ?? (s.contentKey ? t(s.contentKey) : ""),
    };

    if (s.onNextAction) {
      popover.onNextClick = () => {
        if (s.onNextAction?.navigateTo) {
          const targetPath = s.onNextAction.navigateTo;
          if (window.location.pathname !== targetPath) {
            window.history.pushState({}, "", targetPath);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
        }
        if (s.onNextAction?.clickSelector) {
          findVisible(s.onNextAction.clickSelector)?.click();
        }

        const moveNext = () => driverObj.moveNext();
        const next = steps[index + 1];
        if (next?.target) {
          void waitForElement(next.target, next.waitMs ?? 2500).then(() => {
            window.setTimeout(moveNext, s.onNextAction?.delayMs ?? 100);
          });
          return;
        }
        window.setTimeout(moveNext, s.onNextAction?.delayMs ?? 100);
      };
    }

    return {
      element: s.target,
      popover,
    };
  });

  driverObj = driver({
    showProgress: true,
    steps: driveSteps,
  });

  driverObj.drive();
}
