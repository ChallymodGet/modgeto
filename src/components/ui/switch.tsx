"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/**
 * On/off control for settings that apply immediately. The "on" state also
 * shows a tick in the thumb, so it doesn't rely on colour alone.
 */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group/switch relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5",
        "bg-foreground-muted transition-colors duration-150 outline-none after:absolute after:-inset-2.5",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "data-checked:bg-primary",
        "data-disabled:cursor-not-allowed data-disabled:bg-border-strong",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "flex size-5 items-center justify-center rounded-full bg-surface text-primary shadow-sm",
          "transition-transform duration-150 ease-out-soft motion-reduce:transition-none",
          "data-checked:translate-x-5",
        )}
      >
        <Check
          aria-hidden="true"
          className="size-3 opacity-0 transition-opacity group-data-checked/switch:opacity-100"
          strokeWidth={3}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
