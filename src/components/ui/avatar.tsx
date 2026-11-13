"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex shrink-0 overflow-hidden rounded-full bg-primary-subtle align-middle select-none after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-foreground/5",
  {
    variants: {
      size: {
        xs: "size-6 text-[0.625rem]",
        sm: "size-8 text-caption",
        md: "size-10 text-body-sm",
        lg: "size-14 text-body-lg",
        xl: "size-24 text-h3",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/** "Ada Okafor" → "AO". Falls back to the first letter for single names. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

type AvatarProps = VariantProps<typeof avatarVariants> & {
  name: string;
  src?: string | null;
  className?: string;
  /** Set when a visible name sits beside the avatar, so it isn't announced twice. */
  decorative?: boolean;
};

/** Person image with initials fallback. */
function Avatar({ name, src, size, className, decorative = false }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(avatarVariants({ size }), className)}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}
    >
      {src && <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" />}
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center font-semibold text-primary-text">
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { Avatar, initials };
