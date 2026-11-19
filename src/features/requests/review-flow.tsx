"use client";

/**
 * Review and Submit (docs/06 §38–42, docs/05 §19, CFG-004–007, D-002).
 * The Client checks everything, acknowledges the Service terms, and submits
 * once: repeated taps reuse one idempotency key (CFG-006).
 */
import {
  ArrowLeft,
  CircleAlert,
  Pencil,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ConfigurationShell } from "@/components/layout/flow-shells";
import { ScopeSummary } from "@/components/request/request-summaries";
import { TermsPanel } from "@/components/request/negotiation";
import { CommitmentSummary, PriceBreakdown } from "@/components/service/price";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { withNext } from "@/features/auth/policy";
import { currentIdentity, subscribeIdentity } from "@/features/auth/simulated-auth";
import { toPricingConfig } from "@/features/services/model";
import {
  type AnswerValue,
  type BriefQuestion,
  calculatePrice,
  isQuestionVisible,
  validateBriefAnswers,
  validateSelection,
} from "@/lib/domain";
import { cn } from "@/lib/utils";
import type { CreativeProfile, Service } from "@/types";
import { configurationSteps, initialSelection } from "./configuration-steps";
import { clearDraft, saveDraft, useDraft } from "./draft-store";
import { MobilePriceBar, PriceSummary } from "./price-summary";
import { submitRequest } from "./simulated-submit";
import { buildScope } from "./snapshot";

type Props = {
  service: Service;
  creative: Pick<CreativeProfile, "displayName" | "username" | "avatarUrl" | "professionalTitle">;
  commitmentBps: number | null;
  serviceHref: string;
  configureHref: string;
  briefHref: string;
  reviewHref: string;
  submittedHref: string;
};

function answerText(
  q: BriefQuestion,
  value: AnswerValue | undefined,
  files: Record<string, { name: string }> = {},
): string | null {
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0))
    return null;
  const label = (id: string) =>
    [...(q.choices ?? []), ...(q.visualExamples ?? [])].find((c) => c.id === id)?.label ?? id;
  switch (q.type) {
    case "SINGLE_CHOICE":
    case "DROPDOWN":
      return label(String(value));
    case "MULTIPLE_CHOICE":
    case "VISUAL_SELECTION":
      return (value as string[]).map(label).join(", ");
    case "FILE":
    case "MULTIPLE_FILE":
      return (value as string[]).map((id) => files[id]?.name ?? "Uploaded file").join(", ");
    default:
      return String(value);
  }
}

function Card({
  title,
  edit,
  children,
  id,
}: {
  title: string;
  edit?: { href: string; label: string };
  children: ReactNode;
  id: string;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4 rounded-xl bg-surface p-5 md:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="text-h4 text-foreground">
          {title}
        </h2>
        {edit && (
          <NextLink
            href={edit.href}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-label text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-focus"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            {edit.label}
          </NextLink>
        )}
      </div>
      {children}
    </section>
  );
}

const noopSubscribe = () => () => {};

export function ReviewFlow(props: Props) {
  const {
    service,
    creative,
    commitmentBps,
    serviceHref,
    configureHref,
    briefHref,
    reviewHref,
    submittedHref,
  } = props;
  const router = useRouter();
  const firstName = creative.displayName.split(" ")[0];
  const steps = useMemo(() => configurationSteps(service), [service]);
  const draft = useDraft(service.id);
  const selection = draft?.selection ?? initialSelection(service);
  const answers = draft?.answers ?? {};
  const identity = useSyncExternalStore(subscribeIdentity, currentIdentity, () => null);
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const problemsRef = useRef<HTMLDivElement>(null);
  // CFG-006: one key per draft, fixed before the first tap, plus an in-flight
  // guard, so double taps and retries can only ever create one Request.
  const keyRef = useRef<string | null>(null);
  const inFlight = useRef(false);

  const configIssues = validateSelection(toPricingConfig(service), selection);
  const briefIssues = validateBriefAnswers(service.brief, answers);
  const verified = Boolean(identity?.emailVerified && identity?.phoneVerified);
  const changed = draft !== null && draft.validatedAgainstServiceAt !== service.updatedAt;
  const price = calculatePrice(toPricingConfig(service), selection, commitmentBps);
  const scope = buildScope(service, selection);

  // CFG-005: everything required before submission, each with a way to fix it.
  const problems: { message: string; href?: string }[] = [];
  if (changed)
    problems.push({
      message: `${firstName} updated this Service. Check your choices, then confirm below.`,
    });
  if (configIssues.length) problems.push({ message: configIssues[0].message, href: configureHref });
  if (briefIssues.length) {
    const section = service.brief.sections.find((s) =>
      s.questions.some((q) => q.id === briefIssues[0].target),
    );
    problems.push({
      message: "Some required Brief questions aren't answered yet.",
      href: section ? `${briefHref}?section=${section.id}` : briefHref,
    });
  }
  if (!verified)
    problems.push({
      message: "Verify your email and phone to submit.",
      href: withNext("/auth/sign-up", reviewHref),
    });
  if (!acknowledged) problems.push({ message: "Confirm you've read the terms." });

  const onSubmit = async () => {
    if (inFlight.current) return;
    setAttempted(true);
    if (problems.length > 0) {
      requestAnimationFrame(() => problemsRef.current?.focus());
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    keyRef.current ??= draft?.idempotencyKey ?? crypto.randomUUID();
    const idempotencyKey = keyRef.current;
    if (!draft?.idempotencyKey) {
      saveDraft(service.id, {
        selection,
        answers,
        files: draft?.files,
        idempotencyKey,
        validatedAgainstServiceAt: service.updatedAt,
      });
    }
    const result = await submitRequest({
      idempotencyKey,
      serviceName: service.name,
      creativeName: creative.displayName,
    });
    clearDraft(service.id);
    router.replace(`${submittedHref}?ref=${encodeURIComponent(result.request.reference)}`);
  };

  const shellSteps = [
    ...steps.map((s) => ({ label: s.label, href: `${configureHref}?step=${s.id}` })),
    { label: "Brief", href: briefHref },
    { label: "Review", href: reviewHref },
  ];
  const summaryInput = { service, selection, commitmentBps };
  const estimate = service.pricingMode === "STARTING_FROM";
  const quote = service.pricingMode === "CUSTOM_QUOTE";

  const submitButton = (
    <Button onClick={onSubmit} loading={submitting} size="lg" className="shrink-0">
      <Send aria-hidden="true" />
      Submit Project Request
    </Button>
  );

  return (
    <ConfigurationShell
      back={{ href: serviceHref, label: "Back to Service" }}
      steps={shellSteps}
      currentStep={steps.length + 1}
      summary={
        <div className="flex flex-col gap-4 rounded-xl bg-surface p-6 shadow-sm">
          <PriceSummary creativeName={creative.displayName} {...summaryInput} />
          {submitButton}
        </div>
      }
      mobileBar={
        <MobilePriceBar
          creativeName={creative.displayName}
          {...summaryInput}
          action={
            <Button onClick={onSubmit} loading={submitting} className="shrink-0">
              <Send aria-hidden="true" />
              Submit Request
            </Button>
          }
        />
      }
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1.5">
          <p className="text-label text-foreground-secondary">{service.name} · Review</p>
          <h1 className="text-h2 text-foreground">Review your Project Request</h1>
          <p className="text-body text-foreground-secondary">
            Check everything before it goes to {firstName}. You can edit any part.
          </p>
        </header>

        {attempted && problems.length > 0 && (
          <div
            ref={problemsRef}
            tabIndex={-1}
            role="alert"
            className="flex flex-col gap-2 rounded-lg border border-danger-border bg-danger-subtle p-4 outline-none focus-visible:outline-2 focus-visible:outline-focus"
          >
            <p className="flex items-center gap-2 text-label text-foreground">
              <CircleAlert aria-hidden="true" className="size-4 text-danger" />
              Before you submit
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-10 text-body-sm text-foreground">
              {problems.map((p) => (
                <li key={p.message}>
                  {p.href ? (
                    <NextLink
                      href={p.href}
                      className="underline underline-offset-4 hover:text-primary-text"
                    >
                      {p.message}
                    </NextLink>
                  ) : (
                    p.message
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {changed && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-lg border border-info-border bg-info-subtle p-4 sm:flex-row sm:items-start"
          >
            <RefreshCw aria-hidden="true" className="size-5 shrink-0 text-info" />
            <p className="flex-1 text-body-sm text-foreground">
              {firstName} updated this Service since you started (CFG-007). The price and terms
              below are the current ones. Check them before you submit.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                saveDraft(service.id, {
                  selection,
                  answers,
                  files: draft?.files,
                  validatedAgainstServiceAt: service.updatedAt,
                })
              }
            >
              I&apos;ve checked
            </Button>
          </div>
        )}

        <Card id="who" title="Creative and Service">
          <div className="flex items-center gap-3">
            <Avatar name={creative.displayName} src={creative.avatarUrl} size="md" decorative />
            <div className="flex min-w-0 flex-col">
              <p className="text-label text-foreground">{creative.displayName}</p>
              <p className="text-body-sm text-foreground-secondary">
                {service.name} · {creative.professionalTitle}
              </p>
            </div>
          </div>
        </Card>

        <Card id="scope" title="Scope" edit={{ href: configureHref, label: "Edit choices" }}>
          <ScopeSummary
            scope={scope}
            currency={service.currency}
            lines={price.ok ? price.value.lines : []}
          />
        </Card>

        <Card
          id="brief"
          title="Project Brief"
          edit={
            service.brief.sections.length ? { href: briefHref, label: "Edit Brief" } : undefined
          }
        >
          {service.brief.sections.length === 0 ? (
            <p className="text-body-sm text-foreground-secondary">
              No Brief questions for this Service.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {service.brief.sections.map((section) => (
                <div key={section.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-label text-foreground">{section.title}</h3>
                    <NextLink
                      href={`${briefHref}?section=${section.id}`}
                      className="rounded-sm text-caption text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus"
                    >
                      Edit<span className="sr-only"> {section.title}</span>
                    </NextLink>
                  </div>
                  <dl className="flex flex-col divide-y divide-border rounded-md border border-border">
                    {section.questions
                      .filter((q) => isQuestionVisible(q, answers))
                      .map((q) => {
                        const text = answerText(q, answers[q.id], draft?.files);
                        const missing = !text && q.required;
                        return (
                          <div key={q.id} className="flex flex-col gap-0.5 px-4 py-3">
                            <dt className="text-caption text-foreground-secondary">{q.label}</dt>
                            <dd
                              className={cn(
                                "text-body-sm whitespace-pre-line",
                                missing
                                  ? "font-medium text-danger-text"
                                  : text
                                    ? "text-foreground"
                                    : "text-foreground-muted",
                              )}
                            >
                              {text ?? (q.required ? "Not answered yet" : "Not answered")}
                            </dd>
                          </div>
                        );
                      })}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Phones: the full price here too; desktop shows it beside the content. */}
        <Card id="price" title="Price and commitment">
          <div className="lg:hidden">
            {price.ok && <PriceBreakdown breakdown={price.value} hideCommitment />}
          </div>
          {price.ok ? (
            <CommitmentSummary
              bps={price.value.commitment ? commitmentBps : null}
              amountMinor={price.value.commitment?.amountMinor ?? null}
              currency={service.currency}
            />
          ) : (
            <p className="text-body-sm text-foreground-secondary">
              Your price and any commitment appear once you&apos;ve finished your choices.{" "}
              <NextLink
                href={configureHref}
                className="font-medium text-primary-text underline underline-offset-4"
              >
                Finish configuring
              </NextLink>
            </p>
          )}
          {(estimate || quote) && (
            <p className="rounded-md bg-surface-subtle px-4 py-3 text-body-sm text-foreground-secondary">
              {quote
                ? `${firstName} will send a quote after reading your Brief. Nothing is agreed until you accept it.`
                : `This is an estimate. ${firstName} confirms the final price after reading your Brief, and you accept it before anything is agreed.`}
            </p>
          )}
        </Card>

        <Card id="terms" title="Terms">
          <TermsPanel
            showHeading={false}
            terms={{ content: service.terms.content, version: service.terms.version }}
            acknowledgement={{
              checked: acknowledged,
              onCheckedChange: setAcknowledged,
              error: attempted && !acknowledged ? "Confirm you've read the terms to submit." : null,
            }}
          />
        </Card>

        <Card id="next" title="What happens next">
          <ol className="flex flex-col gap-3 text-body-sm text-foreground">
            {[
              `${firstName} reviews your Request.`,
              `${firstName} accepts it, or proposes changes or a quote for you to review.`,
              "You agree the scope, price and terms together.",
              commitmentBps
                ? `You pay the commitment directly to ${firstName}, using the payment instructions shown then.`
                : "No commitment payment is needed for this Service.",
              `${firstName} starts the Project once everything is in place.`,
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-caption font-semibold text-primary-text"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{text}</span>
              </li>
            ))}
          </ol>
          <p className="flex items-start gap-2 border-t border-border pt-4 text-body-sm text-foreground-secondary">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-foreground-muted"
            />
            Submitting doesn&apos;t start the Project or charge you anything. Modgeto does not
            collect Client Project payments.
          </p>
        </Card>

        {/* Identity (CFG-005): verified email and phone are required to submit. */}
        {hydrated && (
          <Card id="identity" title="Your account">
            {verified ? (
              <p className="flex items-center gap-2 text-body-sm text-foreground">
                <UserRound aria-hidden="true" className="size-4 text-foreground-muted" />
                Submitting as <span className="font-semibold">{identity?.email}</span>
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-body-sm text-foreground-secondary">
                  Create an account or sign in to submit. Your choices and Brief stay saved while
                  you verify your email and phone.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <ButtonLink href={withNext("/auth/sign-up", reviewHref)}>
                    Create account
                  </ButtonLink>
                  <ButtonLink href={withNext("/auth/sign-in", reviewHref)} variant="secondary">
                    Sign in
                  </ButtonLink>
                </div>
              </div>
            )}
          </Card>
        )}

        <div className="hidden items-center justify-between gap-3 pt-2 lg:flex">
          <ButtonLink href={briefHref} variant="secondary">
            <ArrowLeft aria-hidden="true" />
            Back to Brief
          </ButtonLink>
          {submitButton}
        </div>
      </div>
    </ConfigurationShell>
  );
}
