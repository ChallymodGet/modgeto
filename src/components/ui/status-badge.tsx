import { cn } from "@/lib/utils";
import type { StatusIntent, StatusLabel } from "@/lib/domain";
import { Badge } from "./badge";

type StatusBadgeProps = {
  /** Actor-facing label and intent from `lib/domain/status` (docs/07 §37, docs/08 §15). */
  status: StatusLabel;
  size?: "sm" | "md";
  className?: string;
};

const dot: Record<StatusIntent, string> = {
  neutral: "bg-foreground-muted",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/**
 * One badge for every status. The text carries the meaning; colour and the
 * dot only reinforce it (CLAUDE.md §13). Never pass backend enum names here.
 */
function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  return (
    <Badge tone={status.intent} size={size} className={className}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", dot[status.intent])} />
      {status.label}
    </Badge>
  );
}

export { StatusBadge };
