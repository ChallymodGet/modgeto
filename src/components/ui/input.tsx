"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";
import { useFieldRequired } from "./form-field";

/**
 * Shared text-control styles. 16px text on touch layouts prevents iOS zoom;
 * 44px tall on touch, 40px from `md` (docs/07 §15). Invalid state uses the
 * Danger border plus the FormField error message, never colour alone.
 */
const controlStyles = cn(
  "w-full min-w-0 rounded-md border border-border-control bg-surface text-base text-foreground md:text-sm",
  "transition-[border-color,box-shadow] duration-150 outline-none",
  "placeholder:text-foreground-muted",
  "hover:border-foreground-muted",
  "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20",
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/20",
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-subtle disabled:text-foreground-disabled",
);

function Input({ className, type = "text", ...props }: InputPrimitive.Props) {
  const required = useFieldRequired();
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      aria-required={required || undefined}
      className={cn(
        controlStyles,
        "h-11 px-3 md:h-10",
        // `:read-only` also matches buttons and divs, so it lives here, not in controlStyles.
        "read-only:bg-surface-subtle read-only:focus-visible:ring-0",
        "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input, controlStyles };
