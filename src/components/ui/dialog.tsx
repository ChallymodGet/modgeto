"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { IconButton } from "./icon-button";

/**
 * Overlay accessibility (docs/07 §23) comes from Base UI Dialog: dialog role,
 * focus trap, Escape to close, focus returned to the trigger, and the title and
 * description wired to `aria-labelledby` and `aria-describedby`.
 *
 * Layout (docs/07 §35): a centred modal from `sm`, a bottom sheet on phones.
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-overlay transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function CloseButton() {
  return (
    <DialogPrimitive.Close
      render={
        <IconButton label="Close" icon={<X />} size="sm" className="absolute top-3 right-3" />
      }
    />
  );
}

type DialogContentProps = DialogPrimitive.Popup.Props & {
  size?: "sm" | "md" | "lg";
  showCloseButton?: boolean;
};

const widths = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };

function DialogContent({
  className,
  children,
  size = "md",
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 flex max-h-[92dvh] w-full flex-col bg-surface-elevated text-foreground shadow-md outline-none",
          // Phone: bottom sheet.
          "inset-x-0 bottom-0 rounded-t-xl pb-[env(safe-area-inset-bottom)]",
          "transition-[transform,opacity] duration-250 ease-out-soft",
          "data-ending-style:translate-y-full data-starting-style:translate-y-full",
          // From sm: centred modal.
          "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[85dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:pb-0",
          "sm:data-ending-style:-translate-y-[48%] sm:data-ending-style:scale-[0.98] sm:data-ending-style:opacity-0",
          "sm:data-starting-style:-translate-y-[48%] sm:data-starting-style:scale-[0.98] sm:data-starting-style:opacity-0",
          "motion-reduce:transition-opacity",
          widths[size],
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && <CloseButton />}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 px-5 pt-5 pr-14 sm:px-6 sm:pt-6", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title className={cn("text-h3 text-foreground", className)} {...props} />;
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-body-sm text-foreground-secondary", className)}
      {...props}
    />
  );
}

/** Scrolls when content is taller than the viewport; header and footer stay put. */
function DialogBody({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

/** Actions stack full-width on phones (primary on top) and sit right-aligned from sm. */
function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6 [&>*]:w-full sm:[&>*]:w-auto",
        className,
      )}
      {...props}
    />
  );
}

export {
  CloseButton as DialogCloseButton,
  Dialog,
  DialogBackdrop,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
