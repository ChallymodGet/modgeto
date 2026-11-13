"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Arrow keys move between options; the group is a single tab stop (WAI-ARIA radio group). */
function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

const radioStyles = cn(
  "relative flex size-5 shrink-0 items-center justify-center rounded-full border border-foreground-muted bg-surface",
  "transition-colors duration-150 outline-none after:absolute after:-inset-3",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  "data-checked:border-primary data-checked:bg-primary",
  "aria-invalid:border-danger",
  "data-disabled:cursor-not-allowed data-disabled:border-border-strong data-disabled:bg-surface-subtle data-disabled:data-checked:bg-foreground-disabled",
);

function Radio({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root data-slot="radio" className={cn(radioStyles, className)} {...props}>
      <RadioPrimitive.Indicator className="size-2 rounded-full bg-primary-foreground data-unchecked:hidden" />
    </RadioPrimitive.Root>
  );
}

type RadioItemProps = RadioPrimitive.Root.Props & {
  label: ReactNode;
  description?: ReactNode;
};

/** A radio with its label and optional description. The whole row is clickable. */
function RadioItem({ label, description, className, ...props }: RadioItemProps) {
  return (
    <label
      className={cn(
        "group/radio flex cursor-pointer items-start gap-3 has-data-disabled:cursor-not-allowed",
        className,
      )}
    >
      <span className="flex h-6 items-center">
        <Radio {...props} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-body-sm font-medium text-foreground group-has-data-disabled/radio:text-foreground-disabled">
          {label}
        </span>
        {description && <span className="text-body-sm text-foreground-muted">{description}</span>}
      </span>
    </label>
  );
}

export { Radio, RadioGroup, RadioItem, radioStyles };
