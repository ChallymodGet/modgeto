"use client";

/**
 * Clarification and terms during negotiation (docs/03 §43, D-002, D-027).
 * Clarification exists only before agreement; it is never Project chat.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, FileText, Send } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime } from "@/lib/format";
import { clarificationSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { RequestResponse, TermsSnapshot } from "@/types";

const RESPONSE_LABELS: Record<RequestResponse["type"], string> = {
  CHANGE_REQUEST_NOTE: "Note on proposed changes",
  CLIENT_CLARIFICATION: "Client reply",
  CREATIVE_CLARIFICATION: "Question",
  PROPOSAL_NOTE: "Note on the proposal",
  PROPOSAL_RESPONSE: "Response to the proposal",
};

type ClarificationPanelProps = {
  responses: RequestResponse[];
  /** Display names by role, e.g. { CREATIVE: "Ada Okafor", CLIENT: "Kemi Adeyemi" }. */
  names: Record<RequestResponse["authorRole"], string>;
  viewerRole: RequestResponse["authorRole"];
  /** Omit to hide the composer, e.g. once terms are agreed or the Request is closed. */
  onSend?: (message: string) => Promise<void> | void;
  composerLabel?: string;
};

/** A structured question-and-answer record attached to the Request. */
export function ClarificationPanel({
  responses,
  names,
  viewerRole,
  onSend,
  composerLabel = viewerRole === "CREATIVE" ? "Ask the Client a question" : "Reply to the Creative",
}: ClarificationPanelProps) {
  const form = useForm({
    resolver: zodResolver(clarificationSchema),
    defaultValues: { message: "" },
  });
  const [sending, setSending] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body-sm text-foreground-secondary">
        Use this to agree the details before the Project starts. Everything here stays on the
        Request record.
      </p>

      {responses.length === 0 ? (
        <p className="rounded-md bg-surface-subtle px-4 py-3 text-body-sm text-foreground-secondary">
          No questions yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {responses.map((r) => {
            const mine = r.authorRole === viewerRole;
            const name = mine ? "You" : names[r.authorRole];
            return (
              <li key={r.id} className={cn("flex gap-3", mine && "flex-row-reverse text-right")}>
                <Avatar name={names[r.authorRole]} size="sm" decorative />
                <div className={cn("flex max-w-[85%] flex-col gap-1", mine && "items-end")}>
                  <p className="text-caption text-foreground-muted">
                    <span className="font-medium text-foreground">{name}</span> ·{" "}
                    {RESPONSE_LABELS[r.type]} ·{" "}
                    <time dateTime={r.createdAt}>{formatDateTime(r.createdAt)}</time>
                  </p>
                  <p
                    className={cn(
                      "rounded-lg px-4 py-3 text-left text-body-sm whitespace-pre-line text-foreground",
                      mine ? "bg-primary-subtle" : "border border-border bg-surface",
                    )}
                  >
                    {r.message}
                  </p>
                  {r.attachmentIds.length > 0 && (
                    <p className="flex items-center gap-1 text-caption text-foreground-muted">
                      <FileText aria-hidden="true" className="size-3.5" />
                      {r.attachmentIds.length} attachment{r.attachmentIds.length === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {onSend && (
        <form
          noValidate
          onSubmit={form.handleSubmit(async ({ message }) => {
            setSending(true);
            try {
              await onSend(message);
              form.reset();
            } finally {
              setSending(false);
            }
          })}
          className="flex flex-col gap-3 border-t border-border pt-4"
        >
          <Controller
            control={form.control}
            name="message"
            render={({ field, fieldState }) => (
              <FormField label={composerLabel} error={fieldState.error?.message} required>
                <Textarea {...field} maxLength={2_000} rows={3} />
              </FormField>
            )}
          />
          <Button type="submit" loading={sending} className="self-end">
            <Send aria-hidden="true" />
            Send
          </Button>
        </form>
      )}
    </div>
  );
}

type TermsPanelProps = {
  terms: TermsSnapshot;
  /** When the viewer already accepted this version. */
  acceptedAt?: string | null;
  /** Omit for read-only display (e.g. the Creative's view). */
  onAccept?: () => Promise<void> | void;
  /** `final` is the explicit acceptance before Ready to Start (D-002). */
  mode?: "acknowledge" | "final";
};

/**
 * The Service terms snapshot. Long terms scroll inside a focusable region;
 * acceptance needs a real checkbox and an explicit button press.
 */
export function TermsPanel({ terms, acceptedAt, onAccept, mode = "final" }: TermsPanelProps) {
  const regionId = useId();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={`${regionId}-title`} className="text-h4 text-foreground">
          Terms
        </h3>
        <span className="text-caption text-foreground-muted">Version {terms.version}</span>
      </div>
      <div
        role="region"
        aria-labelledby={`${regionId}-title`}
        tabIndex={0}
        className="max-h-72 overflow-y-auto rounded-md border border-border bg-surface-subtle px-4 py-3 text-body-sm whitespace-pre-line text-foreground focus-visible:outline-2 focus-visible:outline-focus"
      >
        {terms.content}
      </div>
      {acceptedAt ? (
        <p className="flex items-center gap-2 text-body-sm text-success-text">
          <CircleCheck aria-hidden="true" className="size-4" />
          You accepted version {terms.version} on {formatDate(acceptedAt)}.
        </p>
      ) : (
        onAccept && (
          <div className="flex flex-col gap-3">
            <FormField
              orientation="horizontal"
              label={
                mode === "final"
                  ? "I've read and accept these terms for this Project"
                  : "I've read these terms"
              }
              error={error}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => {
                  setChecked(v);
                  if (v) setError(null);
                }}
              />
            </FormField>
            <Button
              className="self-start"
              loading={busy}
              onClick={async () => {
                if (!checked) {
                  setError("Tick the box to confirm you accept the terms.");
                  return;
                }
                setBusy(true);
                try {
                  await onAccept();
                } finally {
                  setBusy(false);
                }
              }}
            >
              Accept terms
            </Button>
          </div>
        )
      )}
    </div>
  );
}
