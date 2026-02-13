import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DsHelpTooltipProps {
  content: string;
  ariaLabel: string;
  className?: string;
  asChildSpan?: boolean;
}

export function DsHelpTooltip({
  content,
  ariaLabel,
  className,
  asChildSpan = false,
}: DsHelpTooltipProps) {
  const triggerClassName = cn(
    "inline-flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]/45",
    className,
  );
  return (
    <Tooltip>
      {asChildSpan ? (
        <TooltipTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            aria-label={ariaLabel}
            className={triggerClassName}
          >
            <CircleHelp className="size-3.5" />
          </span>
        </TooltipTrigger>
      ) : (
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={ariaLabel}
            className={triggerClassName}
          >
            <CircleHelp className="size-3.5" />
          </button>
        </TooltipTrigger>
      )}
      <TooltipContent
        side="top"
        align="center"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
