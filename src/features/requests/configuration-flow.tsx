"use client";

/**
 * Client Service Configuration (docs/06 §24–30, docs/05 §16, CFG-001–003,
 * CFG-007). Adaptive steps; the price updates as selections change; every
 * paid choice shows its effect first; Back keeps answers.
 */
import { ArrowLeft, ArrowRight, ChevronUp, Info, Plus, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ConfigurationShell } from "@/components/layout/flow-shells";
import {
  AddOnSelector,
  DeliveryOptionSelector,
  OptionGroup,
  PackageSelector,
  QuantityControl,
} from "@/components/service/configuration";
import { PriceBreakdown, ServicePrice } from "@/components/service/price";
import { DeliverableList } from "@/components/service/scope";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { toast } from "@/components/ui/toast";
import { toPricingConfig } from "@/features/services/model";
import {
  type DomainError,
  type Selection,
  calculatePrice,
  formatMoney,
  validateSelection,
} from "@/lib/domain";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";
import {
  type ConfigStepId,
  configurationSteps,
  initialSelection,
  stepForIssue,
} from "./configuration-steps";
import { saveDraft, useDraft } from "./draft-store";

type Props = {
  service: Service;
  creativeName: string;
  commitmentBps: number | null;
  serviceHref: string;
  configureHref: string;
  briefHref: string;
  reviewHref: string;
};

const STEP_TITLES: Record<ConfigStepId, (s: Service) => string> = {
  scope: (s) =>
    s.pricingMode === "PACKAGE"
      ? "Choose a package"
      : s.pricingMode === "QUANTITY"
        ? "How many do you need?"
        : s.pricingMode === "CUSTOM_QUOTE"
          ? "What you're asking for"
          : "What's included",
  customise: () => "Customise your Project",
  delivery: () => "Choose your delivery",
};

export function ConfigurationFlow(props: Props) {
  const {
    service,
    creativeName,
    commitmentBps,
    serviceHref,
    configureHref,
    briefHref,
    reviewHref,
  } = props;
  const router = useRouter();
  const params = useSearchParams();
  const config = useMemo(() => toPricingConfig(service), [service]);
  const steps = useMemo(() => configurationSteps(service), [service]);
  const stepId = (steps.find((s) => s.id === params.get("step"))?.id ??
    steps[0].id) as ConfigStepId;
  const stepIndex = steps.findIndex((s) => s.id === stepId);

  const draft = useDraft(service.id);
  const selection: Selection = draft?.selection ?? initialSelection(service);
  const changedSinceReview =
    draft !== null && draft.validatedAgainstServiceAt !== service.updatedAt;
  const [attempted, setAttempted] = useState<Partial<Record<ConfigStepId, boolean>>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  const update = (next: Selection) =>
    saveDraft(service.id, {
      selection: next,
      answers: draft?.answers ?? {},
      validatedAgainstServiceAt: draft?.validatedAgainstServiceAt ?? service.updatedAt,
    });

  const issues = validateSelection(config, selection);
  const stepIssues = (id: ConfigStepId) => issues.filter((i) => stepForIssue(i, service) === id);
  const visibleIssues = attempted[stepId] ? stepIssues(stepId) : [];
  const issueFor = (target: string, codes?: string[]) =>
    visibleIssues.find((i) => i.target === target && (!codes || codes.includes(i.code)))?.message ??
    null;
  // The summary prices what's chosen so far: choices still to make (required
  // options, prerequisites) are listed rather than blocking the running total.
  const provisionalConfig = useMemo(
    () => ({
      ...config,
      optionGroups: config.optionGroups.map((g) => ({ ...g, required: false })),
      dependencies: [],
    }),
    [config],
  );
  const price = calculatePrice(provisionalConfig, selection, commitmentBps);
  const stillToChoose = issues.filter(
    (i) => i.code === "OPTION_REQUIRED" || i.code === "MISSING_PREREQUISITE",
  );

  // ---------------------------------------------------------------- navigation
  const shellSteps = [
    ...steps.map((s) => ({ label: s.label, href: `${configureHref}?step=${s.id}` })),
    { label: "Brief", href: briefHref },
    { label: "Review", href: reviewHref },
  ];
  const goTo = (id: ConfigStepId) => {
    router.push(`${configureHref}?step=${id}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const onContinue = () => {
    setAttempted((a) => ({ ...a, [stepId]: true }));
    if (stepIssues(stepId).length > 0) {
      // Focus the first problem so keyboard and screen-reader users land on it (docs/06 §36).
      requestAnimationFrame(() =>
        contentRef.current
          ?.querySelector<HTMLElement>(
            "[data-invalid] [role=radio], [data-invalid] [role=checkbox], [data-invalid] input:not([type=hidden]), [role=alert] button",
          )
          ?.focus(),
      );
      return;
    }
    const next = steps[stepIndex + 1];
    if (next) goTo(next.id);
    else router.push(briefHref);
  };
  const onBack = () => {
    const prev = steps[stepIndex - 1];
    if (prev) goTo(prev.id);
    else router.push(serviceHref);
  };

  // ---------------------------------------------------------------- package eligibility
  const selectedPackage = service.packages.find((p) => p.id === selection.packageId);
  const ineligible: Record<string, string> = {};
  if (selectedPackage?.eligibleAddOnIds) {
    for (const a of service.addOns) {
      if (!selectedPackage.eligibleAddOnIds.includes(a.id))
        ineligible[a.id] = `Not available with ${selectedPackage.name}.`;
    }
  }
  const choosePackage = (packageId: string) => {
    const pkg = service.packages.find((p) => p.id === packageId);
    const addOns = { ...(selection.addOns ?? {}) };
    const removed: string[] = [];
    if (pkg?.eligibleAddOnIds) {
      for (const id of Object.keys(addOns)) {
        if (!pkg.eligibleAddOnIds.includes(id)) {
          delete addOns[id];
          removed.push(service.addOns.find((a) => a.id === id)?.name ?? id);
        }
      }
    }
    update({ ...selection, packageId, addOns });
    if (removed.length)
      toast(`Removed ${removed.join(", ")}`, { description: `Not available with ${pkg?.name}.` });
  };

  const prerequisiteIssues = issues.filter((i) => i.code === "MISSING_PREREQUISITE");
  const prerequisiteName = (issue: DomainError) => {
    const [type, id] = (issue.target ?? "").split(":");
    return type === "ADDON" ? (service.addOns.find((a) => a.id === id)?.name ?? null) : null;
  };
  const addPrerequisite = (issue: DomainError) => {
    const [type, id] = (issue.target ?? "").split(":");
    if (type === "ADDON")
      update({ ...selection, addOns: { ...(selection.addOns ?? {}), [id]: 1 } });
    if (type === "PACKAGE") update({ ...selection, packageId: id });
  };

  // ---------------------------------------------------------------- summary
  const totalText = price.ok
    ? price.value.total
      ? `${price.value.priceState === "ESTIMATED" ? "Estimated " : ""}${formatMoney(price.value.total)}`
      : "Quote required"
    : service.pricingMode === "CUSTOM_QUOTE"
      ? "Quote required"
      : "—";
  const summaryBody = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-label text-foreground">{service.name}</p>
        <p className="text-caption text-foreground-secondary">with {creativeName}</p>
      </div>
      {price.ok ? (
        <>
          <PriceBreakdown breakdown={price.value} />
          {stillToChoose.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-md bg-surface-subtle px-4 py-3">
              <p className="text-label text-foreground">Still to choose</p>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-body-sm text-foreground-secondary">
                {stillToChoose.map((i) => (
                  <li key={`${i.code}-${i.target}`}>{i.message}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="flex items-start gap-2 rounded-md bg-surface-subtle px-4 py-3 text-body-sm text-foreground-secondary">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
          {issues.some((i) => i.code === "PACKAGE_REQUIRED")
            ? "Choose a package to see your price."
            : "Your price appears once you've made the required choices."}
        </p>
      )}
    </div>
  );

  const stepTitle = STEP_TITLES[stepId](service);

  return (
    <ConfigurationShell
      back={{ href: serviceHref, label: "Back to Service" }}
      steps={shellSteps}
      currentStep={stepIndex}
      summary={<div className="rounded-xl bg-surface p-6 shadow-sm">{summaryBody}</div>}
      mobileBar={
        <div className="flex items-center justify-between gap-3">
          <Drawer>
            <DrawerTrigger className="flex min-h-11 min-w-0 flex-col items-start rounded-md px-1 text-left focus-visible:outline-2 focus-visible:outline-focus">
              <span className="flex items-center gap-1 text-caption text-foreground-secondary">
                Price summary <ChevronUp aria-hidden="true" className="size-3.5" />
              </span>
              <span
                aria-live="polite"
                className="truncate text-body font-semibold text-foreground tabular-nums"
              >
                {totalText}
              </span>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Price summary</DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-auto px-5 pt-2 pb-6">{summaryBody}</div>
            </DrawerContent>
          </Drawer>
          <Button onClick={onContinue} className="shrink-0">
            Continue
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      }
    >
      <div ref={contentRef} className="flex flex-col gap-8">
        <header className="flex flex-col gap-1.5">
          <p className="text-label text-foreground-secondary">
            {service.name} · Step {stepIndex + 1} of {shellSteps.length}
          </p>
          <h1 className="text-h2 text-foreground">{stepTitle}</h1>
        </header>

        {changedSinceReview && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-lg border border-info-border bg-info-subtle p-4 sm:flex-row sm:items-start"
          >
            <RefreshCw aria-hidden="true" className="size-5 shrink-0 text-info" />
            <p className="flex-1 text-body-sm text-foreground">
              {creativeName.split(" ")[0]} updated this Service since you started. Check your
              choices before you continue.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                saveDraft(service.id, {
                  selection,
                  answers: draft?.answers ?? {},
                  validatedAgainstServiceAt: service.updatedAt,
                })
              }
            >
              I&apos;ve checked
            </Button>
          </div>
        )}

        {stepId === "scope" && (
          <>
            {service.pricingMode === "PACKAGE" && (
              <PackageSelector
                packages={service.packages}
                deliverables={service.deliverables}
                currency={service.currency}
                value={selection.packageId ?? null}
                onValueChange={choosePackage}
                error={issueFor("package")}
              />
            )}
            {service.pricingMode === "QUANTITY" &&
              service.quantityRules.map((rule) => (
                <QuantityControl
                  key={rule.id}
                  rule={rule}
                  currency={service.currency}
                  value={selection.quantities?.[rule.id] ?? rule.defaultQuantity}
                  onValueChange={(q) =>
                    update({ ...selection, quantities: { ...selection.quantities, [rule.id]: q } })
                  }
                  error={issueFor(rule.id)}
                />
              ))}
            {(service.pricingMode === "FIXED" ||
              service.pricingMode === "STARTING_FROM" ||
              service.pricingMode === "CUSTOM_QUOTE") && (
              <div className="flex flex-col gap-5 rounded-xl bg-surface p-6">
                <ServicePrice service={service} variant="hero" />
                {service.deliverables.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                    <p className="text-label text-foreground">Included</p>
                    <DeliverableList deliverables={service.deliverables} />
                  </div>
                )}
                {service.pricingMode === "CUSTOM_QUOTE" && (
                  <p className="text-body-sm text-foreground-secondary">
                    Tell {creativeName.split(" ")[0]} about your Project in the Brief. They&apos;ll
                    send a quote, and nothing is agreed until you accept it.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {stepId === "customise" && (
          <>
            {service.optionGroups.map((g) => (
              <OptionGroup
                key={g.id}
                group={g}
                currency={service.currency}
                value={selection.options?.[g.id] ?? []}
                onValueChange={(ids) =>
                  update({ ...selection, options: { ...selection.options, [g.id]: ids } })
                }
                error={issueFor(g.id)}
              />
            ))}
            {service.addOns.some((a) => a.active) && (
              <div className="flex flex-col gap-3">
                <AddOnSelector
                  addOns={service.addOns}
                  currency={service.currency}
                  value={(selection.addOns as Record<string, number>) ?? {}}
                  onValueChange={(addOns) => update({ ...selection, addOns })}
                  unavailable={ineligible}
                />
                {/* Dependencies: explain and offer the prerequisite (docs/06 §29). */}
                {prerequisiteIssues.map((issue) => (
                  <div
                    key={issue.target}
                    role="alert"
                    className={cn(
                      "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
                      attempted.customise
                        ? "border-danger-border bg-danger-subtle"
                        : "border-warning-border bg-warning-subtle",
                    )}
                  >
                    <p className="text-body-sm text-foreground">{issue.message}</p>
                    {prerequisiteName(issue) && (
                      <Button size="sm" variant="secondary" onClick={() => addPrerequisite(issue)}>
                        <Plus aria-hidden="true" />
                        Add {prerequisiteName(issue)}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {stepId === "delivery" && (
          <DeliveryOptionSelector
            options={service.deliveryOptions}
            currency={service.currency}
            value={selection.deliveryOptionId ?? null}
            onValueChange={(deliveryOptionId) => update({ ...selection, deliveryOptionId })}
          />
        )}

        <div className="hidden items-center justify-between gap-3 border-t border-border pt-6 lg:flex">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          <Button onClick={onContinue}>
            {stepIndex < steps.length - 1 ? "Continue" : "Continue to Brief"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-label text-foreground-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:hidden"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {stepIndex > 0 ? `Back to ${steps[stepIndex - 1].label}` : "Back to Service"}
        </button>
      </div>
    </ConfigurationShell>
  );
}
