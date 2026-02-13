import type * as React from "react";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { DsHelpTooltip } from "@/components/ds/DsHelpTooltip";

interface DsSheetHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  helpContent?: string;
  helpLabel?: string;
}

export function DsSheetHeader({
  title,
  description,
  className,
  helpContent,
  helpLabel,
}: DsSheetHeaderProps) {
  return (
    <SheetHeader className={cn("px-4 pt-5 pb-4 border-b border-[var(--border-subtle)]", className)}>
      <SheetTitle
        className={cn("text-left pr-10 break-words text-xl leading-snug ds-heading-3", !description && "pb-1")}
      >
        <span className="inline-flex items-center gap-2">
          {title}
          {helpContent ? (
            <DsHelpTooltip
              asChildSpan
              content={helpContent}
              ariaLabel={helpLabel ?? "Help"}
              className="size-6 text-muted-foreground"
            />
          ) : null}
        </span>
      </SheetTitle>
      {description ? (
        <SheetDescription className="text-left ds-body-sm">{description}</SheetDescription>
      ) : null}
    </SheetHeader>
  );
}
