import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { XIcon } from "lucide-react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetPortal = SheetPrimitive.Portal;
const SheetClose = SheetPrimitive.Close;

type DesktopVariant = "sheet" | "modal";

const modalVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalTransition = { duration: 0.25, ease: "easeOut" as const };

const SheetOverlay = ({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
);

const sheetVariants = {
  top: "inset-x-0 top-0 border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
  bottom:
    "inset-x-0 bottom-0 border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
  left:
    "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  right:
    "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
};

const SheetContent = ({
  side = "right",
  desktopVariant = "sheet",
  className,
  children,
  showCloseButton = true,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: keyof typeof sheetVariants;
  desktopVariant?: DesktopVariant;
  showCloseButton?: boolean;
}) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const useDesktopModal = !isMobile && desktopVariant === "modal";
  const useMobileTopSheet = isMobile && side === "right";
  const effectiveSide = useMobileTopSheet ? "top" : side;

  if (useDesktopModal) {
    return (
      <SheetPortal>
        <SheetPrimitive.Overlay asChild forceMount>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalTransition}
          />
        </SheetPrimitive.Overlay>
        <SheetPrimitive.Content
          asChild
          forceMount
          onOpenAutoFocus={(event) => {
            onOpenAutoFocus?.(event);
          }}
          {...props}
        >
          <motion.div
            className={cn(
              "fixed inset-0 z-50 m-auto h-fit max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-[var(--surface-0)] shadow-lg",
              className
            )}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalTransition}
          >
            {children}
            {showCloseButton && (
              <SheetPrimitive.Close
                className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-[var(--surface-2)] hover:text-foreground focus:ring-2 focus:ring-[var(--focus-ring)]/45 focus:ring-offset-2 focus:outline-none"
                aria-label="Close"
              >
                <XIcon className="size-6" />
              </SheetPrimitive.Close>
            )}
          </motion.div>
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        className={cn(
          "fixed z-50 bg-[var(--surface-0)] shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out duration-200",
          sheetVariants[effectiveSide],
          className,
          useMobileTopSheet &&
            "!inset-0 !h-[100dvh] !w-screen !max-w-none !border-0 !rounded-none data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top"
        )}
        onOpenAutoFocus={(event) => {
          if (useMobileTopSheet) event.preventDefault();
          onOpenAutoFocus?.(event);
        }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-[var(--surface-2)] hover:text-foreground focus:ring-2 focus:ring-[var(--focus-ring)]/45 focus:ring-offset-2 focus:outline-none"
            aria-label="Close"
          >
            <XIcon className="size-6" />
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
};

const SheetHeader = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    className={cn("flex flex-col gap-2 text-left pr-12", className)}
    {...props}
  />
);

const SheetFooter = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
);

const SheetTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) => (
  <SheetPrimitive.Title
    className={cn("text-left text-lg leading-none font-semibold", className)}
    {...props}
  />
);

const SheetDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) => (
  <SheetPrimitive.Description
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
);

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
};
