import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { runPageTour } from "@/lib/runPageTour";
import type { PageTourTriggerProps } from "@/types/tour";

const TOUR_SEEN_KEY = "budget-tool-tour-seen";

function getTourSeenKey(pageId: string): string {
  return `${TOUR_SEEN_KEY}-${pageId}`;
}

export type { PageTourTriggerProps };

export function PageTourTrigger({ pageId, steps }: PageTourTriggerProps) {
  const { t } = useTranslation();
  const [seen, setSeen] = useState(() =>
    Boolean(
      typeof window !== "undefined" &&
        localStorage.getItem(getTourSeenKey(pageId))
    )
  );

  const handleClick = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(getTourSeenKey(pageId), "1");
      setSeen(true);
    }
    runPageTour(steps, t);
  }, [pageId, steps, t]);

  return (
    <div className="inline-flex shrink-0 overflow-visible p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "size-9",
          !seen &&
            "animate-help-pulse-scale text-yellow-500 dark:text-yellow-400"
        )}
        onClick={handleClick}
        aria-label={t("tour.ariaLabel")}
      >
        <HelpCircle className="size-5" />
      </Button>
    </div>
  );
}
