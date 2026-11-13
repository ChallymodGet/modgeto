import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Small label or metadata chip. Subtle background, 1px border and darker text
 * so every tone passes WCAG AA (D-037). Pills are reserved for badges, filters
 * and chips (docs/07 §16).
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap [&>svg]:size-3.5 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "border-border bg-surface-subtle text-foreground-secondary",
        primary: "border-primary/20 bg-primary-subtle text-primary-text",
        info: "border-info-border bg-info-subtle text-info-text",
        success: "border-success-border bg-success-subtle text-success-text",
        warning: "border-warning-border bg-warning-subtle text-warning-text",
        danger: "border-danger-border bg-danger-subtle text-danger-text",
        outline: "border-border-strong bg-surface text-foreground-secondary",
      },
      size: {
        sm: "h-6 px-2 text-caption",
        md: "h-7 px-2.5 text-body-sm",
      },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

type BadgeProps = useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, tone, size, render, ...props }: BadgeProps) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">({ className: cn(badgeVariants({ tone, size }), className) }, props),
    render,
  });
}

export { Badge, badgeVariants };
export type { BadgeProps };
