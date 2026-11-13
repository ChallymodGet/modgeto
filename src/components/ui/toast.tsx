"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Toaster as Sonner, toast } from "sonner";
import { Spinner } from "./spinner";

/**
 * Toasts confirm what just happened and say what happens next (Brand
 * Guidelines). They are announced politely and never carry the only copy of
 * important information: errors that need action belong inline.
 *
 * Mount `<Toaster />` once per app shell; call `toast.success(...)` etc.
 */
function Toaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      closeButton
      offset={16}
      mobileOffset={{ bottom: "calc(16px + env(safe-area-inset-bottom))" }}
      containerAriaLabel="Notifications"
      icons={{
        success: <CircleCheck aria-hidden="true" className="size-4 text-success" />,
        info: <Info aria-hidden="true" className="size-4 text-info" />,
        warning: <TriangleAlert aria-hidden="true" className="size-4 text-warning" />,
        error: <CircleAlert aria-hidden="true" className="size-4 text-danger" />,
        loading: <Spinner className="text-foreground-muted" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg! border! border-border! bg-surface-elevated! text-foreground! shadow-md! font-sans! gap-3!",
          title: "text-label!",
          description: "text-body-sm! text-foreground-secondary!",
          actionButton: "rounded-md! bg-primary! text-primary-foreground! font-medium!",
          cancelButton: "rounded-md! bg-surface-subtle! text-foreground!",
          closeButton: "size-6! border-border! bg-surface! text-foreground-secondary!",
        },
      }}
    />
  );
}

export { Toaster, toast };
