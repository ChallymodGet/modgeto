"use client";

import { Field } from "@base-ui/react/field";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { useFieldRequired } from "./form-field";
import { controlStyles } from "./input";

type TextareaProps = ComponentProps<"textarea"> & {
  /** Shows a live "n of max characters" count when `maxLength` is set. */
  showCount?: boolean;
};

/** Multi-line text. Grows with its content (`field-sizing`), starting at 3 lines. */
function Textarea({
  className,
  showCount,
  maxLength,
  value,
  defaultValue,
  ...props
}: TextareaProps) {
  const required = useFieldRequired();
  const length = String(value ?? defaultValue ?? "").length;
  return (
    <div className="flex flex-col gap-1.5">
      <Field.Control
        render={<textarea />}
        data-slot="textarea"
        aria-required={required || undefined}
        maxLength={maxLength}
        value={value as string | undefined}
        defaultValue={defaultValue as string | undefined}
        className={cn(
          controlStyles,
          "field-sizing-content min-h-24 resize-y px-3 py-2.5 leading-relaxed",
          "read-only:bg-surface-subtle read-only:focus-visible:ring-0",
          className,
        )}
        {...(props as object)}
      />
      {showCount && maxLength ? (
        <p className="self-end text-caption text-foreground-muted tabular-nums">
          {length} of {maxLength} characters
        </p>
      ) : null}
    </div>
  );
}

export { Textarea };
