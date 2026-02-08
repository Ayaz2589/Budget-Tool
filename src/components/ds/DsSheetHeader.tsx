import type * as React from "react";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DsSheetHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

export function DsSheetHeader({
  title,
  description,
  className,
}: DsSheetHeaderProps) {
  return (
    <SheetHeader className={cn("px-4 pt-5 pb-4 border-b border-[var(--border-subtle)]", className)}>
      <SheetTitle className={cn("text-left pr-10 break-words text-xl leading-snug ds-heading-3", !description && "pb-1")}>
        {title}
      </SheetTitle>
      {description ? (
        <SheetDescription className="text-left ds-body-sm">{description}</SheetDescription>
      ) : null}
    </SheetHeader>
  );
}
