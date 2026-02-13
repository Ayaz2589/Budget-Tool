import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export interface AppTourStep {
  route: string;
  selector: string;
  fallbackSelector?: string;
  title: string;
  description: string;
}

interface AppGuidedTourProps {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function AppGuidedTour({
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
}: AppGuidedTourProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardHeight, setCardHeight] = useState(220);

  const currentStep = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!open || !currentStep) return;

    let mounted = true;
    const updateRect = () => {
      const target =
        (document.querySelector(currentStep.selector) as HTMLElement | null) ??
        (currentStep.fallbackSelector
          ? (document.querySelector(currentStep.fallbackSelector) as HTMLElement | null)
          : null);
      if (!target) {
        // Keep last known position while the next route/section mounts to avoid snap-to-bottom flicker.
        return;
      }
      const nextRect = target.getBoundingClientRect();
      if (mounted) setTargetRect(nextRect);
    };

    updateRect();
    const intervalId = window.setInterval(updateRect, 120);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    const target = document.querySelector(currentStep.selector) as HTMLElement | null;
    if (target) {
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open, currentStep]);

  useEffect(() => {
    if (!open || !cardRef.current) return;
    const measure = () => {
      if (cardRef.current) {
        setCardHeight(cardRef.current.offsetHeight);
      }
    };
    measure();
    const id = window.setTimeout(measure, 60);
    return () => window.clearTimeout(id);
  }, [open, stepIndex, currentStep?.title, currentStep?.description]);

  const spotlightStyle = useMemo(() => {
    if (!targetRect) return null;
    const padding = 10;
    return {
      top: `${Math.max(8, targetRect.top - padding)}px`,
      left: `${Math.max(8, targetRect.left - padding)}px`,
      width: `${Math.max(40, targetRect.width + padding * 2)}px`,
      height: `${Math.max(40, targetRect.height + padding * 2)}px`,
    };
  }, [targetRect]);

  const cardStyle = useMemo(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const cardWidth = Math.min(480, vw - 32);
    if (!targetRect) {
      return {
        top: `${Math.max(16, vh - cardHeight - 24)}px`,
        left: `${Math.max(16, (vw - cardWidth) / 2)}px`,
        width: `${cardWidth}px`,
      };
    }

    const gap = 16;
    const belowTop = targetRect.bottom + gap;
    const aboveTop = targetRect.top - gap - cardHeight;
    const top = belowTop + cardHeight < vh - 16 ? belowTop : Math.max(16, aboveTop);
    const centeredLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    const left = clamp(centeredLeft, 16, vw - cardWidth - 16);
    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
    };
  }, [targetRect, cardHeight]);

  if (!open || !currentStep) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="guided-tour"
        className="fixed inset-0 z-[70] hidden md:block"
        aria-live="polite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        <motion.div
          className="absolute inset-0 bg-black/65 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.42 }}
        />
        {spotlightStyle ? (
          <motion.div
            key={currentStep.selector}
            className="absolute rounded-xl border border-white/60 bg-transparent pointer-events-none"
            style={{
              ...spotlightStyle,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.62), 0 0 0 2px rgba(255,255,255,0.22)",
            }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.46, ease: "easeOut" }}
          />
        ) : null}
        <motion.div
          key={`tour-card-${stepIndex}`}
          ref={cardRef}
          className={cn("absolute z-[72] pointer-events-auto")}
          style={cardStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="border-[var(--border-strong)] shadow-2xl bg-[var(--surface-0)]/98 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {titleLabel} {stepIndex + 1}/{steps.length}
              </div>
              <CardTitle className="text-lg">{currentStep.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>
              <div className="flex items-center justify-between gap-2">
                <Button type="button" variant="ghost" onClick={onSkip}>
                  {skipLabel}
                </Button>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={onBack} disabled={isFirst}>
                    {backLabel}
                  </Button>
                  {isLast ? (
                    <Button type="button" onClick={onFinish}>
                      {finishLabel}
                    </Button>
                  ) : (
                    <Button type="button" onClick={onNext}>
                      {nextLabel}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
