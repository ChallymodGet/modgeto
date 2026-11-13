"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";

/** Checked state shows a tick, so it never relies on colour alone. */
const checkboxStyles = cn(
  "relative flex size-5 shrink-0 items-center justify-center rounded-sm border border-foreground-muted bg-surface text-primary-foreground",
  "transition-colors duration-150 outline-none",
  // Extends the hit area to 44px without changing the layout.
  "after:absolute after:-inset-3",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  "data-checked:border-primary data-checked:bg-primary data-indeterminate:border-primary data-indeterminate:bg-primary",
  "aria-invalid:border-danger",
  "data-disabled:cursor-not-allowed data-disabled:border-border-strong data-disabled:bg-surface-subtle data-disabled:data-checked:bg-foreground-disabled",
);

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(checkboxStyles, className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        className="flex data-unchecked:hidden"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <Minus aria-hidden="true" className="size-3.5" strokeWidth={3} />
            ) : (
              <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, checkboxStyles };
