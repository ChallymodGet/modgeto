"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

/**
 * Side panel on desktop and tablet, full-screen sheet on phones (docs/07 §35).
 * Built on the same Base UI Dialog as `Dialog`, so it inherits the focus trap,
 * Escape handling and focus return.
 */
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

type SheetContentProps = SheetPrimitive.Popup.Props & {
  side?: "right" | "left";
  size?: "md" | "lg";
  showCloseButton?: boolean;
};

function SheetContent({
  className,
  children,
  side = "right",
  size = "md",
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <DialogBackdrop />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-surface-elevated text-foreground shadow-md outline-none",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          "transition-[transform,opacity] duration-250 ease-out-soft motion-reduce:transition-opacity",
          // Phone: full screen, slides up.
          "data-ending-style:translate-y-8 data-ending-style:opacity-0 data-starting-style:translate-y-8 data-starting-style:opacity-0",
          // From md: side panel.
          "md:inset-y-0 md:w-full md:border-border md:data-ending-style:translate-y-0 md:data-starting-style:translate-y-0",
          side === "right"
            ? "md:right-0 md:left-auto md:border-l md:data-ending-style:translate-x-8 md:data-starting-style:translate-x-8"
            : "md:right-auto md:left-0 md:border-r md:data-ending-style:-translate-x-8 md:data-starting-style:-translate-x-8",
          size === "md" ? "md:max-w-md" : "md:max-w-2xl",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && <DialogCloseButton />}
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  );
}

export {
  Sheet,
  DialogBody as SheetBody,
  SheetClose,
  SheetContent,
  DialogDescription as SheetDescription,
  DialogFooter as SheetFooter,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle,
  SheetTrigger,
};
