import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export type TourStepInput = {
  target?: string;
  titleKey: string;
  contentKey: string;
};

/**
 * Runs a multi-step page tour using driver.js.
 * Steps without `target` show a centered popover (intro/outro).
 */
export function runPageTour(
  steps: TourStepInput[],
  t: (key: string) => string,
): void {
  const driveSteps = steps.map((s) => ({
    element: s.target,
    popover: {
      title: t(s.titleKey),
      description: t(s.contentKey),
    },
  }));

  const driverObj = driver({
    showProgress: true,
    steps: driveSteps,
  });

  driverObj.drive();
}
