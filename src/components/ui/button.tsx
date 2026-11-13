import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import NextLink from "next/link";
import type { ComponentProps } from "react";
import { Spinner } from "./spinner";

/**
 * Button styles (docs/08 §7). Heights reach 44px on touch layouts (docs/07 §15)
 * and settle to 40px from `md`. Radius is 8px (D-032); icon-only buttons are
 * round.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow] duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "disabled:pointer-events-none data-disabled:pointer-events-none",
    "aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed disabled:bg-surface-subtle disabled:text-foreground-disabled data-disabled:bg-surface-subtle data-disabled:text-foreground-disabled",
        secondary:
          "border-border-strong bg-surface text-foreground hover:bg-background active:bg-surface-subtle aria-expanded:bg-surface-subtle disabled:text-foreground-disabled data-disabled:text-foreground-disabled",
        ghost:
          "text-foreground-secondary hover:bg-surface-subtle hover:text-foreground active:bg-border aria-expanded:bg-surface-subtle disabled:text-foreground-disabled data-disabled:text-foreground-disabled",
        destructive:
          "bg-danger text-primary-foreground hover:bg-danger-text active:bg-danger-text disabled:bg-surface-subtle disabled:text-foreground-disabled data-disabled:bg-surface-subtle data-disabled:text-foreground-disabled",
        "destructive-outline":
          "border-danger-border bg-surface text-danger-text hover:bg-danger-subtle active:bg-danger-subtle disabled:border-border disabled:text-foreground-disabled data-disabled:border-border data-disabled:text-foreground-disabled",
        link: "h-auto! px-0! text-primary-text underline-offset-4 hover:underline disabled:text-foreground-disabled",
      },
      size: {
        sm: "h-9 px-3 text-sm md:h-8",
        md: "h-11 px-4 text-sm md:h-10",
        lg: "h-12 px-5 text-base",
        "icon-sm": "size-9 rounded-full md:size-8",
        icon: "size-11 rounded-full md:size-10",
        "icon-lg": "size-12 rounded-full",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

type ButtonProps = ButtonPrimitive.Props &
  ButtonVariantProps & {
    /** Shows a spinner, keeps the label for screen readers and blocks repeat presses. */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      // Keep focus on the button while it is busy so keyboard users don't lose their place.
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-flex items-center gap-2 opacity-0">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
}

type ButtonLinkProps = ComponentProps<typeof NextLink> & ButtonVariantProps;

/** Navigation styled as a button. Renders a real link (CLAUDE.md §14). */
function ButtonLink({ className, variant, size, fullWidth, ...props }: ButtonLinkProps) {
  return (
    <NextLink
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

export { Button, ButtonLink, buttonVariants };
export type { ButtonProps, ButtonLinkProps };
