"use client";

/**
 * Creative Request Detail (docs/04 §10, docs/06 §59–63, D-002, D-008,
 * D-027–D-030). Overview, Scope, Client Brief, Agreement, Payment and
 * History, with only the actions the domain allows right now. Commands are
 * real (request-actions.ts); storage is SIMULATED until Phase 8.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Check,
  CircleCheck,
  FileText,
  MessageSquare,
  PlayCircle,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BriefAnswers } from "@/components/brief/brief-answers";
import { PageContainer, PageHeader, Panel } from "@/components/layout/page";
import {
  CommitmentProgress,
  ExternalPaymentNote,
  PaymentConfirmationForm,
  PaymentRecord,
} from "@/components/payment/payment";
import { ClarificationPanel, TermsPanel } from "@/components/request/negotiation";
import { ProposalCard } from "@/components/request/proposals";
import { RequestStatus, requestLabel } from "@/components/request/request-status";
import { RequestPrice, RequestSummary, ScopeSummary } from "@/components/request/request-summaries";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  type ChargeConfig,
  availableRequestActions,
  formatMoney,
  isClosed,
  money,
} from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { closureReasonSchema, paymentAdjustmentSchema } from "@/lib/schemas";
import type { RequestDetail } from "@/types";
import { requestHistory, requestView } from "./model";
import { ProposalEditor } from "./proposal-editor";
import { HistoryList, PaymentFacts } from "./request-detail-parts";
import {
  type CreativeCommand,
  applyCreativeCommand,
  currentTerms,
  openProposal,
  requestState,
} from "./request-actions";
import { saveResult, useMergedRequest } from "./simulated-requests";

type Dialogs = "accept" | "decline" | "start" | null;

export function CreativeRequestDetail({
  detail: base,
  clientName,
  creativeName,
  charges,
}: {
  detail: RequestDetail;
  clientName: string;
  creativeName: string;
  /** The Service's current charges (e.g. VAT), offered in proposals. */
  charges: ChargeConfig[];
}) {
  const detail = useMergedRequest(base);
  const router = useRouter();
  const { request: r } = detail;
  const currency = r.snapshot.service.currency;
  const view = requestView(detail);
  const actions = availableRequestActions(requestState(detail), "CREATIVE");
  const can = (a: (typeof actions)[number]) => actions.includes(a);
  const open = openProposal(detail);
  const terms = currentTerms(detail);
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [editor, setEditor] = useState<"CHANGES" | "QUOTE" | null>(null);
  const history = useMemo(
    () => requestHistory(detail, { CREATIVE: creativeName, CLIENT: clientName }, "CREATIVE"),
    [detail, creativeName, clientName],
  );

  /** Runs a command and saves it. Returns false and explains if it was refused. */
  const run = (command: CreativeCommand, message: string): boolean => {
    const result = applyCreativeCommand(detail, command, {
      now: new Date().toISOString(),
      userId: r.creativeId,
      newId: (p) => `${p}-${crypto.randomUUID().slice(0, 8)}`,
    });
    if (!result.ok) {
      toast.error(result.error.message);
      return false;
    }
    if (!saveResult(result.value)) {
      toast.error("Couldn't save. Check your connection and try again.");
      return false;
    }
    toast.success(message);
    if (result.value.project) router.push("/app/creative/projects");
    return true;
  };

  const quoteNeeded = !r.agreed && r.submittedPriceState !== "CALCULATED";
  const pending = detail.declarations.filter((d) => d.resolution === "PENDING");
  const closed = isClosed(r.status);
  const showPayment = r.agreed || detail.declarations.length > 0 || detail.confirmations.length > 0;
  const finalAcceptance = [...detail.termsAcceptances].reverse().find((t) => t.kind === "FINAL");
  const submissionAck = detail.termsAcceptances.find((t) => t.kind === "SUBMISSION");

  // The one main action for this state (docs/06 §63, docs/04 §42).
  const primary: ReactNode = can("START_PROJECT") ? (
    <Button onClick={() => setDialog("start")}>
      <PlayCircle aria-hidden="true" />
      Start Project
    </Button>
  ) : pending.length > 0 ? (
    <ButtonLink href="#payment">
      Confirm Amount Received
      <ArrowRight aria-hidden="true" />
    </ButtonLink>
  ) : can("ACCEPT_REQUEST") ? (
    <Button onClick={() => setDialog("accept")}>
      <Check aria-hidden="true" />
      Accept Request
    </Button>
  ) : can("SEND_PROPOSAL") && quoteNeeded && r.status === "SUBMITTED" ? (
    <Button onClick={() => setEditor("QUOTE")}>
      <FileText aria-hidden="true" />
      Send Quote
    </Button>
  ) : null;

  const secondary = (
    <>
      {can("SEND_PROPOSAL") && !(quoteNeeded && r.status === "SUBMITTED" && !open) && (
        <Button variant="secondary" onClick={() => setEditor(quoteNeeded ? "QUOTE" : "CHANGES")}>
          <FileText aria-hidden="true" />
          {open ? "Revise proposal" : quoteNeeded ? "Send Quote" : "Request Changes"}
        </Button>
      )}
      {can("REQUEST_CLARIFICATION") && (
        <ButtonLink href="#clarification" variant="secondary">
          <MessageSquare aria-hidden="true" />
          Ask a question
        </ButtonLink>
      )}
      {can("DECLINE") && (
        <Button variant="ghost" onClick={() => setDialog("decline")}>
          <X aria-hidden="true" />
          Decline Request
        </Button>
      )}
    </>
  );

  const checklist = [
    { label: "Scope agreed", done: r.agreed },
    { label: "Price agreed", done: r.agreed },
    { label: "Brief complete", done: true },
    { label: "Terms accepted", done: r.finalTermsAccepted },
    {
      label: r.requiredCommitmentMinor ? "Commitment confirmed" : "No commitment required",
      done: !r.requiredCommitmentMinor || r.confirmedMinor >= r.requiredCommitmentMinor,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={r.title}
        back={{ href: "/app/creative/requests", label: "Requests" }}
        status={<StatusBadge status={requestLabel(view, "CREATIVE")} />}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        {/* Summary and actions: first on phones, a sticky side panel on desktop */}
        <aside
          aria-label="Request summary"
          className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1"
        >
          <div className="flex flex-col gap-4 rounded-xl bg-surface p-5 lg:sticky lg:top-24">
            <RequestStatus view={view} actor="CREATIVE" counterpart={clientName} variant="banner" />
            <RequestPrice
              price={r.snapshot.price}
              agreedMinor={detail.agreement?.agreedPriceMinor ?? null}
            />
            {r.requiredCommitmentMinor !== null && r.requiredCommitmentMinor > 0n && !closed && (
              <CommitmentProgress
                requiredMinor={r.requiredCommitmentMinor}
                confirmedMinor={r.confirmedMinor}
                currency={currency}
              />
            )}
            {r.projectId && (
              <ButtonLink href={`/app/creative/projects/${r.projectId}`}>
                View Project
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
            )}
            {(primary || actions.length > 0) && !closed && (
              <div className="flex flex-col gap-2 [&>*]:w-full">
                {primary}
                {secondary}
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <Panel id="overview" headingLevel="h2" title="Overview">
            <RequestSummary request={r} actor="CREATIVE" counterpart={clientName} />
            {r.closureReason && (
              <p className="text-body-sm text-foreground-secondary">
                <span className="font-medium text-foreground">Reason given:</span> {r.closureReason}
              </p>
            )}
          </Panel>

          <Panel
            id="scope"
            headingLevel="h2"
            title={detail.agreement ? "Agreed scope" : "Scope requested"}
            description={
              detail.agreement
                ? `Agreed on ${formatDate(detail.agreement.agreedAt)}.`
                : "What the Client chose when they submitted. It doesn't change if you edit the Service."
            }
          >
            <ScopeSummary
              scope={terms.scope}
              currency={currency}
              lines={detail.agreement ? [] : r.snapshot.price.lines}
            />
          </Panel>

          <Panel id="brief" headingLevel="h2" title="Client Brief">
            <BriefAnswers snapshot={r.snapshot.brief} />
          </Panel>

          <Panel id="agreement" headingLevel="h2" title="Agreement">
            {open && (
              <div className="flex flex-col gap-3">
                <h3 className="text-label text-foreground">Waiting for {clientName}</h3>
                <ProposalCard proposal={open} />
              </div>
            )}
            <div id="clarification" className="scroll-mt-24">
              <ClarificationPanel
                responses={detail.responses}
                names={{ CREATIVE: creativeName, CLIENT: clientName }}
                viewerRole="CREATIVE"
                composerLabel={
                  can("REQUEST_CLARIFICATION") ? "Ask the Client a question" : "Reply to the Client"
                }
                onSend={
                  can("REQUEST_CLARIFICATION")
                    ? (message) => {
                        run({ type: "ASK", message }, `Question sent to ${clientName}.`);
                      }
                    : open
                      ? (message) => {
                          // A note about the open proposal; the status doesn't change (D-027).
                          run({ type: "NOTE", message }, `Reply sent to ${clientName}.`);
                        }
                      : undefined
                }
              />
            </div>
            {detail.proposals.filter((p) => p.id !== open?.id).length > 0 && (
              <details className="group rounded-lg border border-border">
                <summary className="flex min-h-11 cursor-pointer items-center px-4 text-label text-foreground focus-visible:outline-2 focus-visible:outline-focus">
                  Earlier proposals ({detail.proposals.filter((p) => p.id !== open?.id).length})
                </summary>
                <div className="flex flex-col gap-3 p-4 pt-0">
                  {[...detail.proposals]
                    .filter((p) => p.id !== open?.id)
                    .sort((a, b) => b.version - a.version)
                    .map((p) => (
                      <ProposalCard key={p.id} proposal={p} headingLevel="h4" />
                    ))}
                </div>
              </details>
            )}
            <TermsPanel
              acceptedBy={clientName}
              terms={r.snapshot.terms}
              acceptedAt={
                finalAcceptance?.acceptedAt ??
                (r.finalTermsAccepted ? submissionAck?.acceptedAt : null)
              }
            />
          </Panel>

          {showPayment && (
            <Panel
              id="payment"
              headingLevel="h2"
              title="Payment"
              description="Check your account before confirming what arrived: only the amount you confirm counts."
            >
              <ExternalPaymentNote audience="CREATIVE" />
              <PaymentFacts detail={detail} />
              {pending.map((d) => (
                <PaymentConfirmationForm
                  key={d.id}
                  declaration={d}
                  onConfirm={(amount) => {
                    run(
                      { type: "CONFIRM_PAYMENT", declarationId: d.id, amountMinor: amount },
                      `${formatMoney(money(amount, currency))} confirmed.`,
                    );
                  }}
                  onNotReceived={(note) => {
                    run(
                      { type: "NOT_RECEIVED", declarationId: d.id, note },
                      `${clientName} has been told the payment hasn't arrived.`,
                    );
                  }}
                />
              ))}
              <PaymentRecord
                declarations={detail.declarations}
                confirmations={detail.confirmations}
                adjustments={detail.adjustments}
              />
              {r.confirmedMinor > 0n && !closed && (
                <AdjustmentForm
                  currency={currency}
                  confirmedMinor={r.confirmedMinor}
                  onSubmit={(amountMinor, reason) =>
                    run(
                      { type: "ADJUST", amountMinor: -amountMinor, reason },
                      "Correction recorded.",
                    )
                  }
                />
              )}
            </Panel>
          )}

          <Panel id="history" headingLevel="h2" title="History">
            <HistoryList entries={history} />
          </Panel>
        </div>
      </div>

      {editor && (
        <ProposalEditor
          detail={detail}
          kind={editor}
          charges={charges}
          onClose={() => setEditor(null)}
          onSubmit={(proposal) => {
            const ok = run(
              { type: "PROPOSE", proposal },
              proposal.kind === "QUOTE"
                ? `Quote sent to ${clientName}.`
                : `Changes sent to ${clientName}.`,
            );
            if (ok) setEditor(null);
            return ok;
          }}
        />
      )}

      {/* Accept */}
      <Dialog open={dialog === "accept"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Accept {r.title}?</DialogTitle>
            <DialogDescription>
              You agree to the scope and price {clientName} submitted.
              {r.snapshot.commitment.amountMinor
                ? ` ${clientName} then pays the ${formatMoney(money(r.snapshot.commitment.amountMinor, currency))} commitment to you directly.`
                : " No commitment is required, so it's Ready to Start straight away."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Not yet</Button>} />
            <Button
              onClick={() => {
                if (run({ type: "ACCEPT" }, `You accepted ${r.title}.`)) setDialog(null);
              }}
            >
              Accept Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline */}
      <DeclineDialog
        open={dialog === "decline"}
        title={r.title}
        clientName={clientName}
        onClose={() => setDialog(null)}
        onDecline={(reason) => {
          if (run({ type: "DECLINE", reason }, `${r.title} declined.`)) setDialog(null);
        }}
      />

      {/* Start Project (docs/06 §63) */}
      <Dialog open={dialog === "start"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Start the Project?</DialogTitle>
            <DialogDescription>
              {r.title} becomes an active Project. The Request closes and its agreement is kept with
              the Project.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ul className="flex flex-col gap-2">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-body-sm text-foreground">
                  <CircleCheck aria-hidden="true" className="size-4 text-success" />
                  {c.label}
                </li>
              ))}
            </ul>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Not yet</Button>} />
            <Button
              onClick={() => {
                if (run({ type: "START" }, `${r.title} has started. Good luck with the Project.`))
                  setDialog(null);
              }}
            >
              <PlayCircle aria-hidden="true" />
              Start Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function DeclineDialog({
  open,
  title,
  clientName,
  onClose,
  onDecline,
}: {
  open: boolean;
  title: string;
  clientName: string;
  onClose: () => void;
  onDecline: (reason: string | null) => void;
}) {
  const form = useForm({
    resolver: zodResolver(closureReasonSchema),
    defaultValues: { reason: "" },
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <form noValidate onSubmit={form.handleSubmit((v) => onDecline(v.reason))}>
          <DialogHeader>
            <DialogTitle>Decline {title}?</DialogTitle>
            <DialogDescription>
              {clientName} is told the Request is declined. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Controller
              control={form.control}
              name="reason"
              render={({ field, fieldState }) => (
                <FormField label="Reason for the Client" optional error={fieldState.error?.message}>
                  <Textarea {...field} value={field.value ?? ""} rows={3} maxLength={500} />
                </FormField>
              )}
            />
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Keep Request</Button>} />
            <Button type="submit" variant="destructive">
              Decline Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Reversing correction for a confirmed payment (D-030). Confirmations are never edited. */
function AdjustmentForm({
  currency,
  confirmedMinor,
  onSubmit,
}: {
  currency: RequestDetail["request"]["snapshot"]["service"]["currency"];
  confirmedMinor: bigint;
  onSubmit: (amountMinor: bigint, reason: string) => boolean;
}) {
  const [openForm, setOpenForm] = useState(false);
  const form = useForm({
    resolver: zodResolver(paymentAdjustmentSchema(currency)),
    defaultValues: { amount: "", reason: "" } as never,
  });
  if (!openForm) {
    return (
      <Button variant="ghost" size="sm" className="self-start" onClick={() => setOpenForm(true)}>
        Correct a confirmed amount
      </Button>
    );
  }
  return (
    <form
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-border p-4"
      onSubmit={form.handleSubmit((v) => {
        const { amount, reason } = v as unknown as { amount: bigint; reason: string };
        if (amount > confirmedMinor) {
          form.setError("amount" as never, {
            message: `You can correct up to ${formatMoney(money(confirmedMinor, currency))}.`,
          });
          return;
        }
        if (onSubmit(amount, reason)) setOpenForm(false);
      })}
    >
      <p className="text-label text-foreground">Correct a confirmed amount</p>
      <p className="text-body-sm text-foreground-secondary">
        Use this if money you confirmed didn&apos;t stay in your account, for example a reversed
        transfer. The correction is recorded with your reason.
      </p>
      <Controller
        control={form.control}
        name={"amount" as never}
        render={({ field, fieldState }) => (
          <FormField
            label="Amount to take off"
            required
            error={fieldState.error?.message}
            className="sm:max-w-xs"
          >
            <Input
              {...(field as object)}
              value={String((field as { value?: unknown }).value ?? "")}
              inputMode="decimal"
            />
          </FormField>
        )}
      />
      <Controller
        control={form.control}
        name={"reason" as never}
        render={({ field, fieldState }) => (
          <FormField label="Reason" required error={fieldState.error?.message}>
            <Textarea
              {...(field as object)}
              value={String((field as { value?: unknown }).value ?? "")}
              rows={2}
              maxLength={500}
            />
          </FormField>
        )}
      />
      <div className="flex gap-2">
        <Button type="submit" variant="secondary">
          Record correction
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpenForm(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
