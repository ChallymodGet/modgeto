import { Bell } from "lucide-react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

/** Round notifications utility (D-031). The unread count is part of the accessible name. */
export function NotificationsLink({ href, unread }: { href: string; unread: number }) {
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";
  return (
    <NextLink
      href={href}
      aria-label={label}
      title="Notifications"
      className={cn(
        "relative flex size-11 items-center justify-center rounded-full text-foreground-secondary md:size-10",
        "transition-colors hover:bg-surface-subtle hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
      )}
    >
      <Bell aria-hidden="true" className="size-5" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 flex min-w-4.5 items-center justify-center rounded-full bg-tertiary px-1 text-[0.625rem] leading-4.5 font-semibold text-foreground ring-2 ring-background"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </NextLink>
  );
}

/** Round icon link for secondary utilities such as Settings. */
export function UtilityLink({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <NextLink
      href={href}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-11 items-center justify-center rounded-full text-foreground-secondary md:size-10",
        "transition-colors hover:bg-surface-subtle hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "[&_svg]:size-5",
        className,
      )}
    >
      {children}
    </NextLink>
  );
}
