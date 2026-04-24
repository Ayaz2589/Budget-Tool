import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

type PopoverContentProps = React.ComponentProps<
  typeof PopoverPrimitive.Content
> & {
  /**
   * When false, the content is rendered in place instead of in a portal.
   * Useful inside a Radix Dialog/Sheet, whose `react-remove-scroll` blocks
   * wheel/touch events on portaled siblings of the dialog content.
   */
  portal?: boolean;
};

const PopoverContent = ({
  className,
  align = "center",
  sideOffset = 8,
  portal = true,
  ...props
}: PopoverContentProps) => {
  const content = (
    <PopoverPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    />
  );
  return portal ? <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal> : content;
};

export { Popover, PopoverTrigger, PopoverContent };
