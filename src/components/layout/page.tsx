/**
 * Supporting layout components (docs/07 §20). Every screen composes these
 * instead of rebuilding containers, headers and responsive structure.
 */
import { ChevronLeft } from "lucide-react";
import NextLink from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { SectionNavigation, type SectionNavItem } from "@/components/ui/section-navigation";
import { cn } from "@/lib/utils";

const containerSizes = {
  narrow: "max-w-3xl",
  default: "max-w-[1280px]",
  wide: "max-w-[1440px]",
};

/** Horizontal gutters and max width. 16px gutters on phones (docs/07 §13). */
export function PageContainer({
  size = "default",
  className,
  ...props
}: ComponentProps<"div"> & { size?: keyof typeof containerSizes }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 md:px-6 md:py-8 lg:px-8",
        containerSizes[size],
        className,
      )}
      {...props}
    />
  );
}

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Small line above the title, such as a reference number. */
  eyebrow?: ReactNode;
  /** Status badge or similar beside the title. */
  status?: ReactNode;
  back?: { href: string; label: string };
  /** Primary and secondary actions. They wrap under the title on phones. */
  actions?: ReactNode;
  className?: string;
};

/** The page's single h1 (docs/07 §12). */
export function PageHeader({
  title,
  description,
  eyebrow,
  status,
  back,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 md:mb-8", className)}>
      {back && (
        <NextLink
          href={back.href}
          className="-ml-1 inline-flex w-fit items-center gap-1 rounded-sm px-1 text-label text-foreground-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          {back.label}
        </NextLink>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow && <p className="text-label text-foreground-muted">{eyebrow}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-h1 text-foreground">{title}</h1>
            {status}
          </div>
          {description && (
            <p className="max-w-2xl text-body text-foreground-secondary">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2 md:shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  id?: string;
  as?: "h2" | "h3";
};

export function SectionHeader({
  title,
  description,
  actions,
  id,
  as: Heading = "h2",
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <Heading
          id={id}
          className={Heading === "h2" ? "text-h3 text-foreground" : "text-h4 text-foreground"}
        >
          {title}
        </Heading>
        {description && <p className="text-body-sm text-foreground-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** A labelled region of a page. Major sections are 32–48px apart (docs/07 §13). */
export function Section({
  title,
  description,
  actions,
  className,
  children,
  id,
}: Omit<SectionHeaderProps, "as"> & { className?: string; children: ReactNode }) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("flex flex-col gap-4", className)}>
      <SectionHeader id={headingId} title={title} description={description} actions={actions} />
      {children}
    </section>
  );
}

/** Readable form width with the 24px form-group rhythm. */
export function FormContainer({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex w-full max-w-2xl flex-col gap-6", className)} {...props} />;
}

/** Dashboard cards: stacked on phones, two columns on tablet, three on desktop. */
export function DashboardGrid({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3", className)}
      {...props}
    />
  );
}

/**
 * Main content beside an aside (summary, details). The aside stacks below the
 * content on phones and tablets, or above it with `asideFirstOnMobile`.
 */
export function SplitLayout({
  aside,
  children,
  asideFirstOnMobile = false,
  className,
}: {
  aside: ReactNode;
  children: ReactNode;
  asideFirstOnMobile?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22.5rem)] lg:gap-8",
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      <aside className={cn("min-w-0", asideFirstOnMobile && "order-first lg:order-none")}>
        {aside}
      </aside>
    </div>
  );
}

/** Sticks below the header on desktop; flows normally on smaller screens. */
export function StickySummary({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4 lg:sticky lg:top-24", className)} {...props} />;
}

/**
 * Sticky action bar for the one dominant action on a phone screen (docs/06
 * §12). Clears the home indicator. Hidden from `lg`, where actions sit inline.
 */
export function BottomActionBar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 -mx-4 mt-6 flex items-center gap-3 border-t border-border bg-surface/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:-mx-6 md:px-6 lg:hidden",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Section sidebar (D-031) for pages with sub-navigation: Requests groupings,
 * Settings, Account. A sidebar from `lg`, a scrolling pill row above.
 */
export function SectionLayout({
  label,
  items,
  currentHref,
  children,
}: {
  label: string;
  items: SectionNavItem[];
  currentHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[13.75rem_minmax(0,1fr)] lg:gap-10">
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <SectionNavigation label={label} items={items} currentHref={currentHref} />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
