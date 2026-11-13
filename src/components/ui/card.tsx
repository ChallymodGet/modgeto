import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * Card surfaces (D-031, D-032). `feature` cards are the mostly borderless 16px
 * dashboard and storefront cards; `panel` cards are bordered 12px operational
 * containers. Shadows are reserved for overlays (docs/08 §14).
 */
const cardVariants = cva("flex flex-col bg-surface text-foreground", {
  variants: {
    variant: {
      feature: "rounded-xl",
      panel: "rounded-lg border border-border",
      // Muted text is 4.34:1 on Subtle Surface, so descriptions step up to Secondary.
      subtle:
        "rounded-lg bg-surface-subtle [&_[data-slot=card-description]]:text-foreground-secondary",
    },
    padding: {
      none: "",
      sm: "gap-3 p-4",
      md: "gap-4 p-5 md:p-6",
      lg: "gap-6 p-6 md:p-8",
    },
  },
  defaultVariants: { variant: "panel", padding: "md" },
});

type CardProps = ComponentProps<"div"> & VariantProps<typeof cardVariants>;

function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-2", className)}
      {...props}
    />
  );
}

type CardTitleProps = ComponentProps<"h3"> & { as?: "h2" | "h3" | "h4" };

/** Headings default to h3; pass `as` to keep the page outline correct. */
function CardTitle({ className, as: Tag = "h3", ...props }: CardTitleProps) {
  return <Tag className={cn("text-h4 text-foreground", className)} {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-body-sm text-foreground-muted", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("flex flex-col gap-3", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex flex-wrap items-center gap-3 border-t border-border pt-4", className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };
