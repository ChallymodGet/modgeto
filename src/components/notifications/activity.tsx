/** Shared product components: attention, notifications and timelines (docs/07 §30). */
import { Check, ChevronRight } from "lucide-react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import type { StatusIntent } from "@/lib/domain";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const toneIcon: Record<StatusIntent, string> = {
  neutral: "bg-surface-subtle text-foreground-secondary",
  info: "bg-info-subtle text-info-text",
  success: "bg-success-subtle text-success-text",
  warning: "bg-warning-subtle text-warning-text",
  danger: "bg-danger-subtle text-danger-text",
};

/**
 * Something that needs the viewer's action, for the Dashboard and Client
 * Home (docs/04 §8). The link label says what to do.
 */
export function AttentionItem({
  icon,
  title,
  description,
  action,
  tone = "info",
  count,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action: { href: string; label: string };
  tone?: StatusIntent;
  /** Large light numeral for counts (D-031). */
  count?: number;
}) {
  return (
    <article className="group/card relative flex items-start gap-4 rounded-xl bg-surface p-5 transition-shadow hover:shadow-md has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5",
          toneIcon[tone],
        )}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-h4 text-foreground">{title}</h3>
        {description && <p className="text-body-sm text-foreground-secondary">{description}</p>}
        <NextLink
          href={action.href}
          className="mt-1 inline-flex w-fit items-center gap-1 text-label text-primary-text outline-none after:absolute after:inset-0 after:content-['']"
        >
          {action.label}
          <ChevronRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover/card:translate-x-0.5"
          />
        </NextLink>
      </div>
      {count !== undefined && (
        <span className="text-[2.25rem] leading-none text-numeral text-foreground tabular-nums">
          {count}
        </span>
      )}
    </article>
  );
}

/** One in-app notification (NOT-001). Unread state is a dot plus words for screen readers. */
export function NotificationItem({
  notification,
  now,
}: {
  notification: Notification;
  now?: Date;
}) {
  const unread = notification.readAt === null;
  return (
    <article className="group/item relative flex gap-3 px-4 py-4 transition-colors hover:bg-surface-subtle has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-focus md:px-5">
      <span aria-hidden="true" className="flex h-6 w-2.5 shrink-0 items-center">
        {unread && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3
          className={cn("text-body-sm text-foreground", unread ? "font-semibold" : "font-medium")}
        >
          <NextLink
            href={notification.href}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {unread && <span className="sr-only">Unread: </span>}
            {notification.title}
          </NextLink>
        </h3>
        <p className="text-body-sm text-foreground-secondary">{notification.body}</p>
        <time
          dateTime={notification.createdAt}
          title={formatDateTime(notification.createdAt)}
          className="text-caption text-foreground-muted"
        >
          {formatRelative(notification.createdAt, now)}
        </time>
      </div>
    </article>
  );
}

export type TimelineEvent = {
  id: string;
  label: string;
  description?: ReactNode;
  at?: string | null;
  state: "done" | "current" | "upcoming";
};

/**
 * What has happened and what's next on a Request (docs/04 §43). An ordered
 * list; the current step is marked with `aria-current="step"` and weight.
 */
export function StatusTimeline({
  events,
  label = "Request progress",
}: {
  events: TimelineEvent[];
  label?: string;
}) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {events.map((e, i) => (
        <li
          key={e.id}
          aria-current={e.state === "current" ? "step" : undefined}
          className="relative flex gap-3 pb-5 last:pb-0"
        >
          {i < events.length - 1 && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-6 bottom-0 left-[11px] w-0.5",
                e.state === "done" ? "bg-primary" : "bg-border",
              )}
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
              e.state === "done" && "border-primary bg-primary text-primary-foreground",
              e.state === "current" && "border-primary bg-surface",
              e.state === "upcoming" && "border-border-control bg-surface",
            )}
          >
            {e.state === "done" && <Check className="size-3.5" strokeWidth={3} />}
            {e.state === "current" && <span className="size-2 rounded-full bg-primary" />}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
            <p
              className={cn(
                "text-body-sm",
                e.state === "current"
                  ? "font-semibold text-foreground"
                  : e.state === "done"
                    ? "text-foreground"
                    : "text-foreground-muted",
              )}
            >
              {e.label}
              {e.state === "done" && <span className="sr-only"> (done)</span>}
              {e.state === "upcoming" && <span className="sr-only"> (not yet)</span>}
            </p>
            {e.at && (
              <time dateTime={e.at} className="text-caption text-foreground-muted">
                {formatDateTime(e.at)}
              </time>
            )}
            {e.description && (
              <p className="text-body-sm text-foreground-secondary">{e.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
