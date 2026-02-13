import type * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {children}
    </Popover>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof PopoverTrigger>) {
  return <PopoverTrigger {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  return (
    <PopoverContent
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-[280px] rounded-md border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 text-xs text-[var(--text-primary)] shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider };
