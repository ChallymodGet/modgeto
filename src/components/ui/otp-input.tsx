"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { cn } from "@/lib/utils";

type OtpInputProps = Omit<OTPField.Root.Props, "children" | "length"> & {
  length?: number;
};

/**
 * One-time code entry (AUTH-004). Digits only, one slot per digit, paste and
 * SMS autofill (`autocomplete="one-time-code"`) supported. Use inside
 * `FormField` so the label, description and error are wired up.
 */
function OtpInput({ length = 6, className, ...props }: OtpInputProps) {
  return (
    <OTPField.Root
      length={length}
      inputMode="numeric"
      autoComplete="one-time-code"
      className={cn("flex w-full max-w-sm gap-2", className)}
      {...props}
    >
      {Array.from({ length }, (_, i) => (
        <OTPField.Input
          key={i}
          aria-label={i === 0 ? undefined : `Digit ${i + 1} of ${length}`}
          className={cn(
            "h-12 w-full min-w-0 rounded-md border border-border-control bg-surface text-center text-h4 text-foreground tabular-nums",
            "transition-[border-color,box-shadow] duration-150 outline-none",
            "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20",
            "aria-invalid:border-danger data-disabled:bg-surface-subtle data-disabled:text-foreground-disabled",
          )}
        />
      ))}
    </OTPField.Root>
  );
}

export { OtpInput };
