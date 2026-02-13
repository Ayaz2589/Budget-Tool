import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppTourStep } from "@/components/AppGuidedTour";

interface MobileGuidedTourProps {
  open: boolean;
  stepIndex: number;
  steps: AppTourStep[];
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  onSkip: () => void;
  nextLabel: string;
  backLabel: string;
  skipLabel: string;
  finishLabel: string;
  titleLabel: string;
}

export function MobileGuidedTour({
  open,
  stepIndex,
  steps,
  onBack,
  onNext,
  onFinish,
  onSkip,
  nextLabel,
  backLabel,
  skipLabel,
  finishLabel,
  titleLabel,
}: MobileGuidedTourProps) {
  const currentStep = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!open || !currentStep) return;

    const target =
      (document.querySelector(currentStep.selector) as HTMLElement | null) ??
      (currentStep.fallbackSelector
        ? (document.querySelector(currentStep.fallbackSelector) as HTMLElement | null)
        : null);

    if (target) {
      target.scrollIntoView({ block: "start", behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [open, currentStep]);

  if (!open || !currentStep) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="mobile-tour-root"
        className="fixed inset-0 z-[80] md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-black/65 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 px-3 pb-[max(12px,calc(env(safe-area-inset-bottom)+10px))]">
          <motion.div
            key={`mobile-tour-card-${stepIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Card
              className="mx-auto w-full max-w-md overflow-hidden border-[var(--border-strong)] bg-[var(--surface-0)]/99 shadow-2xl backdrop-blur"
              style={{ maxHeight: "min(58dvh, 460px)" }}
            >
              <CardHeader className="pb-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {titleLabel} {stepIndex + 1}/{steps.length}
                </div>
                <CardTitle className="text-xl leading-tight break-words">
                  {currentStep.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-col gap-3">
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <p className="text-base leading-relaxed text-muted-foreground break-words">
                    {currentStep.description}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant="ghost" className="col-span-1" onClick={onSkip}>
                    {skipLabel}
                  </Button>
                  <Button type="button" variant="outline" className="col-span-1" onClick={onBack} disabled={isFirst}>
                    {backLabel}
                  </Button>
                  {isLast ? (
                    <Button type="button" className="col-span-1" onClick={onFinish}>
                      {finishLabel}
                    </Button>
                  ) : (
                    <Button type="button" className="col-span-1" onClick={onNext}>
                      {nextLabel}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

