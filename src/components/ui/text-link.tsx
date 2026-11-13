import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import NextLink from "next/link";
import type { ComponentProps } from "react";

type TextLinkProps = ComponentProps<typeof NextLink> & {
  /** Opens in a new tab with `rel="noopener noreferrer"` and says so to screen readers. */
  external?: boolean;
  tone?: "primary" | "muted";
};

/** Inline navigation link. Underlined so it isn't identified by colour alone. */
function TextLink({ className, external, tone = "primary", children, ...props }: TextLinkProps) {
  return (
    <NextLink
      className={cn(
        "inline-flex items-center gap-1 rounded-sm font-medium underline decoration-1 underline-offset-4 transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        tone === "primary"
          ? "text-primary-text decoration-primary/40 hover:decoration-primary-text"
          : "text-foreground-secondary decoration-border-strong hover:text-foreground hover:decoration-foreground",
        className,
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
      {external && (
        <>
          <ExternalLink aria-hidden="true" className="size-3.5" />
          <span className="sr-only">(opens in a new tab)</span>
        </>
      )}
    </NextLink>
  );
}

export { TextLink };
export type { TextLinkProps };
