"use client";

/**
 * Client Request Detail (docs/04 §22, docs/06 §64–68, D-002, D-017, D-027,
 * D-028). Overview, Your selection, Your Brief, Agreement, Payment and
 * History. The Client can review and accept or turn down proposals, ask
 * about them, accept final terms, see payment instructions, declare a
 * payment and withdraw. There is never a Start Project action for the Client.
 * Commands are real (request-actions.ts); storage is SIMULATED until Phase 8.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, CircleAlert, MessageSquare, Wallet, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BriefAnswers } from "@/components/brief/brief-answers";
import { PageContainer, PageHeader, Panel } from "@/components/layout/page";
import {
  CommitmentProgress,
  PaymentDeclarationForm,
  PaymentInstructions,
  PaymentRecord,
} from "@/components/payment/payment";
import { ClarificationPanel, TermsPanel } from "@/components/request/negotiation";
import { ProposalCard, ProposalComparison } from "@/components/request/proposals";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { availableRequestActions, formatMoney, isClosed, money } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { closureReasonSchema } from "@/lib/schemas";
import type { PaymentMethod, RequestDetail } from "@/types";
import { requestHistory, requestView, clientAwaitingReply } from "./model";
import {
  type ClientCommand,
  applyClientCommand,
  currentTerms,
  openProposal,
  requestState,
} from "./request-actions";
import { HistoryList, PaymentFacts } from "./request-detail-parts";
import { saveResult, useMergedRequest } from "./simulated-requests";

type Dialogs = "accept" | "reject" | "withdraw" | null;

export function ClientRequestDetail({
  detail: base,
  clientName,
  creativeName,
  paymentMethods,
  today,
}: {
  detail: RequestDetail;
  clientName: string;
  creativeName: string;
  /** Only passed at the payment stage (PAY-003). */
  paymentMethods: PaymentMethod[];
  /** YYYY-MM-DD, for quote validity and the payment date. */
  today: string;
}) {
  const detail = useMergedRequest(base);
  const { request: r } = detail;
  const currency = r.snapshot.service.currency;
  const view = requestView(detail);
  const actions = availableRequestActions(requestState(detail), "CLIENT");
  const can = (a: (typeof actions)[number]) => actions.includes(a);
  const open = openProposal(detail);
  const expired = open?.validUntil != null && open.validUntil < today;
  const terms = currentTerms(detail);
  const firstName = creativeName.split(" ")[0];
  const closed = isClosed(r.status);
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [declaring, setDeclaring] = useState(false);
  const history = useMemo(
    () => requestHistory(detail, { CREATIVE: creativeName, CLIENT: clientName }, "CLIENT"),
    [detail, creativeName, clientName],
  );

  const run = (command: ClientCommand, message: string): boolean => {
    const result = applyClientCommand(detail, command, {
      now: new Date().toISOString(),
      userId: r.clientId,
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
    return true;
  };

  const due =
    r.requiredCommitmentMinor && r.requiredCommitmentMinor > r.confirmedMinor
      ? r.requiredCommitmentMinor - r.confirmedMinor
      : 0n;
  const atPaymentStage = can("DECLARE_PAYMENT");
  const finalAcceptance = [...detail.termsAcceptances].reverse().find((t) => t.kind === "FINAL");
  const submissionAck = detail.termsAcceptances.find((t) => t.kind === "SUBMISSION");
  // While the Client waits for a reply, the proposal can still be accepted (D-027).
  const waitingOnReply = open && clientAwaitingReply(detail);

  // The one main action for this state.
  const primary: ReactNode =
    can("ACCEPT_PROPOSAL") && !expired ? (
      <Button onClick={() => setDialog("accept")}>
        <Check aria-hidden="true" />
        {open?.kind === "QUOTE" ? "Accept Quote" : "Accept Changes"}
      </Button>
    ) : can("RESPOND_TO_CLARIFICATION") ? (
      <ButtonLink href="#clarification">
        <MessageSquare aria-hidden="true" />
        Reply to {firstName}
      </ButtonLink>
    ) : can("ACCEPT_TERMS") ? (
      <ButtonLink href="#terms">
        Review and accept terms
        <ArrowRight aria-hidden="true" />
      </ButtonLink>
    ) : atPaymentStage && r.status !== "AWAITING_PAYMENT_CONFIRMATION" ? (
      <ButtonLink href="#payment">
        <Wallet aria-hidden="true" />
        See payment details
      </ButtonLink>
    ) : null;

  const secondary = (
    <>
      {open && can("REJECT_PROPOSAL") && (
        <Button variant="secondary" onClick={() => setDialog("reject")}>
          {open.kind === "QUOTE" ? "Decline quote" : "Decline changes"}
        </Button>
      )}
      {open && !waitingOnReply && (
        <ButtonLink href="#clarification" variant="secondary">
          <MessageSquare aria-hidden="true" />
          Ask {firstName} a question
        </ButtonLink>
      )}
      {can("WITHDRAW") && (
        <Button variant="ghost" onClick={() => setDialog("withdraw")}>
          <X aria-hidden="true" />
          Withdraw Request
        </Button>
      )}
    </>
  );

  return (
    <PageContainer>
      <PageHeader
        title={r.title}
        back={{ href: "/app/client/requests", label: "Requests" }}
        status={<StatusBadge status={requestLabel(view, "CLIENT")} />}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <aside
          aria-label="Request summary"
          className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1"
        >
          <div className="flex flex-col gap-4 rounded-xl bg-surface p-5 lg:sticky lg:top-24">
            <RequestStatus view={view} actor="CLIENT" counterpart={creativeName} variant="banner" />
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
              <ButtonLink href={`/app/client/projects/${r.projectId}`}>
                View Project
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
            )}
            {!closed && (primary || actions.length > 0) && (
              <div className="flex flex-col gap-2 [&>*]:w-full">
                {primary}
                {secondary}
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <Panel id="overview" headingLevel="h2" title="Overview">
            <RequestSummary request={r} actor="CLIENT" counterpart={creativeName} />
            {r.closureReason && (
              <p className="text-body-sm text-foreground-secondary">
                <span className="font-medium text-foreground">Reason given:</span> {r.closureReason}
              </p>
            )}
          </Panel>

          <Panel
            id="selection"
            headingLevel="h2"
            title={detail.agreement ? "Agreed scope" : "Your selection"}
            description={
              detail.agreement
                ? `Agreed on ${formatDate(detail.agreement.agreedAt)}.`
                : "What you chose when you submitted. It stays the same even if the Service changes."
            }
          >
            <ScopeSummary
              scope={terms.scope}
              currency={currency}
              lines={detail.agreement ? [] : r.snapshot.price.lines}
            />
          </Panel>

          <Panel
            id="brief"
            headingLevel="h2"
            title="Your Brief"
            description="You can't edit a submitted Brief. Use a question below if something needs adding."
          >
            <BriefAnswers snapshot={r.snapshot.brief} />
          </Panel>

          <Panel id="agreement" headingLevel="h2" title="Agreement">
            {open && (
              <div className="flex flex-col gap-4">
                <h3 className="text-label text-foreground">
                  {open.kind === "QUOTE"
                    ? `Quote from ${firstName}`
                    : `Changes suggested by ${firstName}`}
                </h3>
                {expired && (
                  <p className="flex items-start gap-2 rounded-lg border border-warning-border bg-warning-subtle p-3 text-body-sm text-foreground">
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-warning-text"
                    />
                    This quote expired on {formatDate(open.validUntil!)}. Ask {firstName} to renew
                    it before you accept.
                  </p>
                )}
                {terms.totalMinor !== null && (
                  <ProposalComparison
                    currency={currency}
                    previous={{
                      totalMinor: terms.totalMinor,
                      turnaround: terms.turnaround,
                      commitmentBps: terms.commitmentBps,
                      commitmentAmountMinor: terms.commitmentAmountMinor,
                      deliverables: terms.scope.deliverables.map((d) => d.name),
                    }}
                    proposed={{
                      totalMinor: open.totalMinor,
                      turnaround: open.turnaround,
                      commitmentBps: open.commitmentBps,
                      commitmentAmountMinor: open.commitmentAmountMinor,
                      deliverables: open.scope.deliverables.map((d) => d.name),
                    }}
                    previousLabel={detail.agreement ? "Agreed" : "You requested"}
                    proposedLabel="Proposed"
                  />
                )}
                <ProposalCard proposal={open} />
              </div>
            )}
            <div id="clarification" className="scroll-mt-24">
              <ClarificationPanel
                responses={detail.responses}
                names={{ CREATIVE: creativeName, CLIENT: clientName }}
                viewerRole="CLIENT"
                composerLabel={
                  can("RESPOND_TO_CLARIFICATION")
                    ? `Reply to ${firstName}`
                    : `Ask ${firstName} about this proposal`
                }
                onSend={
                  can("RESPOND_TO_CLARIFICATION")
                    ? (message) => {
                        run({ type: "REPLY", message }, `Reply sent to ${firstName}.`);
                      }
                    : open
                      ? (message) => {
                          // A question about the proposal; it stays open to accept (D-027).
                          run(
                            { type: "ASK_ABOUT_PROPOSAL", message },
                            `Question sent to ${firstName}.`,
                          );
                        }
                      : undefined
                }
              />
            </div>
            {detail.proposals.filter((p) => p.id !== open?.id).length > 0 && (
              <details className="rounded-lg border border-border">
                <summary className="flex min-h-11 cursor-pointer items-center px-4 text-label text-foreground focus-visible:outline-2 focus-visible:outline-focus">
                  Previous proposals ({detail.proposals.filter((p) => p.id !== open?.id).length})
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
            <div id="terms" className="scroll-mt-24">
              <TermsPanel
                terms={r.snapshot.terms}
                mode="final"
                acceptedAt={
                  finalAcceptance?.acceptedAt ??
                  (r.finalTermsAccepted ? submissionAck?.acceptedAt : null)
                }
                onAccept={
                  can("ACCEPT_TERMS")
                    ? () => {
                        run({ type: "ACCEPT_TERMS" }, "Terms accepted.");
                      }
                    : undefined
                }
              />
            </div>
          </Panel>

          {(r.agreed || detail.declarations.length > 0) && (
            <Panel
              id="payment"
              headingLevel="h2"
              title="Payment"
              description={`You pay ${firstName} directly. ${firstName} confirms what arrives, and only confirmed amounts count.`}
            >
              <PaymentFacts detail={detail} />
              {atPaymentStage && paymentMethods.length > 0 && due > 0n && (
                <PaymentInstructions
                  methods={paymentMethods}
                  amountDueMinor={due}
                  currency={currency}
                  reference={r.reference}
                  creativeName={creativeName}
                />
              )}
              {atPaymentStage &&
                (declaring ? (
                  <PaymentDeclarationForm
                    methods={paymentMethods}
                    currency={currency}
                    // The real date: payments happen now, not on the fixture clock.
                    today={new Date().toISOString().slice(0, 10)}
                    onSubmit={(v) => {
                      const method = paymentMethods.find((m) => m.id === v.paymentMethodId)!;
                      const ok = run(
                        {
                          type: "DECLARE_PAYMENT",
                          method: { id: method.id, type: method.type, label: method.label },
                          amountMinor: v.amount,
                          paidOn: v.paidOn,
                          reference: v.reference,
                        },
                        `Payment declared. ${firstName} will check their account and confirm it.`,
                      );
                      if (ok) setDeclaring(false);
                    }}
                  />
                ) : (
                  <Button className="self-start" onClick={() => setDeclaring(true)}>
                    <Wallet aria-hidden="true" />
                    {r.status === "AWAITING_PAYMENT_CONFIRMATION"
                      ? "I've made another payment"
                      : "I've made the payment"}
                  </Button>
                ))}
              <PaymentRecord
                declarations={detail.declarations}
                confirmations={detail.confirmations}
                adjustments={detail.adjustments}
              />
            </Panel>
          )}

          <Panel id="history" headingLevel="h2" title="History">
            <HistoryList entries={history} />
          </Panel>
        </div>
      </div>

      {/* Accept proposal: terms are accepted as a separate step (D-002) */}
      <Dialog open={dialog === "accept"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {open?.kind === "QUOTE" ? "Accept this quote?" : "Accept these changes?"}
            </DialogTitle>
            <DialogDescription>
              {open
                ? `You agree to ${formatMoney(money(open.totalMinor, open.currency))} for the scope shown. Next you'll review and accept the final terms${open.commitmentAmountMinor ? `, then pay the ${formatMoney(money(open.commitmentAmountMinor, open.currency))} commitment directly to ${firstName}` : ""}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Not yet</Button>} />
            <Button
              onClick={() => {
                if (run({ type: "ACCEPT_PROPOSAL" }, "Accepted. Next, review the final terms."))
                  setDialog(null);
              }}
            >
              <Check aria-hidden="true" />
              {open?.kind === "QUOTE" ? "Accept Quote" : "Accept Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={dialog === "reject"}
        title={open?.kind === "QUOTE" ? "Decline this quote?" : "Decline these changes?"}
        description={`${firstName} is told and can send a new proposal. Your Request stays open.`}
        label={`Note for ${firstName}`}
        confirm={open?.kind === "QUOTE" ? "Decline quote" : "Decline changes"}
        cancel="Keep it open"
        destructive={false}
        onClose={() => setDialog(null)}
        onConfirm={(note) => {
          if (run({ type: "REJECT_PROPOSAL", note }, `${firstName} has been told.`))
            setDialog(null);
        }}
      />

      <ReasonDialog
        open={dialog === "withdraw"}
        title={`Withdraw ${r.title}?`}
        description={`${firstName} is told the Request is withdrawn. This can't be undone. Any payment you've already made is between you and ${firstName}.`}
        label={`Reason for ${firstName}`}
        confirm="Withdraw Request"
        cancel="Keep Request"
        destructive
        onClose={() => setDialog(null)}
        onConfirm={(reason) => {
          if (run({ type: "WITHDRAW", reason }, `${r.title} withdrawn.`)) setDialog(null);
        }}
      />
    </PageContainer>
  );
}

function ReasonDialog({
  open,
  title,
  description,
  label,
  confirm,
  cancel,
  destructive,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  label: string;
  confirm: string;
  cancel: string;
  destructive: boolean;
  onClose: () => void;
  onConfirm: (reason: string | null) => void;
}) {
  const form = useForm({
    resolver: zodResolver(closureReasonSchema),
    defaultValues: { reason: "" },
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <form noValidate onSubmit={form.handleSubmit((v) => onConfirm(v.reason))}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Controller
              control={form.control}
              name="reason"
              render={({ field, fieldState }) => (
                <FormField label={label} optional error={fieldState.error?.message}>
                  <Textarea {...field} value={field.value ?? ""} rows={3} maxLength={500} />
                </FormField>
              )}
            />
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">{cancel}</Button>} />
            <Button type="submit" variant={destructive ? "destructive" : "primary"}>
              {confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
