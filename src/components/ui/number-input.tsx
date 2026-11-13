"use client";

import { NumberField } from "@base-ui/react/number-field";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { useFieldRequired } from "./form-field";
import { controlStyles } from "./input";

type NumberInputProps = Omit<NumberField.Root.Props, "children"> & {
  /** Show − and + buttons. On by default so touch users never need to type. */
  steppers?: boolean;
  /** Names the thing being counted in the stepper labels, for example "posts". */
  unitLabel?: string;
  className?: string;
};

const stepper = cn(
  "flex w-11 shrink-0 items-center justify-center text-foreground-secondary outline-none md:w-10",
  "hover:bg-surface-subtle hover:text-foreground",
  "focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
  "data-disabled:cursor-not-allowed data-disabled:text-foreground-disabled data-disabled:hover:bg-transparent",
);

/** Whole-number input with optional steppers, used for quantities and turnaround values. */
function NumberInput({
  steppers = true,
  unitLabel,
  className,
  step = 1,
  ...props
}: NumberInputProps) {
  const required = useFieldRequired();
  const suffix = unitLabel ? ` ${unitLabel}` : "";
  return (
    <NumberField.Root step={step} className={cn("w-full", className)} {...props}>
      <NumberField.Group
        className={cn(
          controlStyles,
          "flex h-11 items-stretch overflow-hidden p-0 md:h-10",
          "has-[input:focus-visible]:border-primary has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-primary/20",
          "has-[input[aria-invalid=true]]:border-danger",
        )}
      >
        {steppers && (
          <NumberField.Decrement
            aria-label={`Decrease${suffix}`}
            className={cn(stepper, "border-r border-border")}
          >
            <Minus aria-hidden="true" className="size-4" />
          </NumberField.Decrement>
        )}
        <NumberField.Input
          aria-required={required || undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent px-3 tabular-nums outline-none",
            steppers && "text-center",
          )}
        />
        {steppers && (
          <NumberField.Increment
            aria-label={`Increase${suffix}`}
            className={cn(stepper, "border-l border-border")}
          >
            <Plus aria-hidden="true" className="size-4" />
          </NumberField.Increment>
        )}
      </NumberField.Group>
    </NumberField.Root>
  );
}

export { NumberInput };
