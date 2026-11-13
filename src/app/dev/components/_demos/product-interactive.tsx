"use client";

import { useMemo, useState } from "react";
import { BriefProgress, BriefSection } from "@/components/brief/brief-layout";
import { ConditionalQuestion, QuestionRenderer } from "@/components/brief/questions";
import type { UploadFn } from "@/components/brief/file-uploader";
import { PaymentConfirmationForm, PaymentDeclarationForm } from "@/components/payment/payment";
import { ClarificationPanel, TermsPanel } from "@/components/request/negotiation";
import {
  AddOnSelector,
  DeliveryOptionSelector,
  OptionGroup,
  PackageSelector,
  QuantityControl,
} from "@/components/service/configuration";
import { PriceBreakdown } from "@/components/service/price";
import { CapacitySelector, ServiceAllocation } from "@/components/subscription/subscription";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  type Answers,
  type AnswerValue,
  type Selection,
  calculatePrice,
  formatMoney,
  isQuestionVisible,
  validateBriefAnswers,
} from "@/lib/domain";
import { toPricingConfig } from "@/features/services/model";
import type {
  PaymentDeclaration,
  PaymentMethod,
  RequestResponse,
  Service,
  TermsSnapshot,
} from "@/types";
import { Specimen } from "./section";

// ------------------------------------------------------------------ Configuration

export function ConfigurationDemo({
  service,
  quantityService,
  commitmentBps,
}: {
  service: Service;
  quantityService: Service;
  commitmentBps: number | null;
}) {
  const [selection, setSelection] = useState<Selection>({
    packageId: service.packages.find((p) => p.recommended)?.id ?? service.packages[0]?.id,
    options: Object.fromEntries(
      service.optionGroups.filter((g) => g.required).map((g) => [g.id, [g.options[0].id]]),
    ),
  });
  const result = calculatePrice(toPricingConfig(service), selection, commitmentBps);
  const rule = quantityService.quantityRules[0];
  const [qty, setQty] = useState(rule?.defaultQuantity ?? 1);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <Specimen label="Package, options, add-ons and delivery" className="flex flex-col gap-8">
        <PackageSelector
          packages={service.packages}
          deliverables={service.deliverables}
          currency={service.currency}
          value={selection.packageId ?? null}
          onValueChange={(packageId) => setSelection((s) => ({ ...s, packageId }))}
        />
        {service.optionGroups.map((g) => (
          <OptionGroup
            key={g.id}
            group={g}
            currency={service.currency}
            value={selection.options?.[g.id] ?? []}
            onValueChange={(ids) =>
              setSelection((s) => ({ ...s, options: { ...s.options, [g.id]: ids } }))
            }
          />
        ))}
        <AddOnSelector
          addOns={service.addOns}
          currency={service.currency}
          value={(selection.addOns as Record<string, number>) ?? {}}
          onValueChange={(addOns) => setSelection((s) => ({ ...s, addOns }))}
        />
        {service.deliveryOptions.length > 1 && (
          <DeliveryOptionSelector
            options={service.deliveryOptions}
            currency={service.currency}
            value={selection.deliveryOptionId ?? null}
            onValueChange={(deliveryOptionId) => setSelection((s) => ({ ...s, deliveryOptionId }))}
          />
        )}
        {rule && (
          <QuantityControl
            rule={rule}
            currency={quantityService.currency}
            value={qty}
            onValueChange={setQty}
          />
        )}
      </Specimen>
      <Specimen label="Live price summary" className="lg:sticky lg:top-6 lg:self-start">
        {result.ok ? (
          <PriceBreakdown breakdown={result.value} />
        ) : (
          <p role="alert" className="text-body-sm text-danger">
            {result.error.message}
          </p>
        )}
      </Specimen>
    </div>
  );
}

// ------------------------------------------------------------------ Brief

/** Simulated upload: progresses, and fails for files with "fail" in the name. */
const fakeUpload: UploadFn = (file, onProgress) =>
  new Promise((resolve, reject) => {
    let p = 0;
    const timer = setInterval(() => {
      p += 20;
      onProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(timer);
        if (file.name.toLowerCase().includes("fail")) reject(new Error("network"));
        else
          resolve({
            assetId: `asset-${crypto.randomUUID()}`,
            name: file.name,
            sizeBytes: file.size,
          });
      }
    }, 250);
  });

export function BriefDemo({ service }: { service: Service }) {
  const sections = service.brief.sections;
  const [current, setCurrent] = useState(sections[0].id);
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const section = sections.find((s) => s.id === current)!;
  const index = sections.indexOf(section);
  const allQuestions = useMemo(() => sections.flatMap((s) => s.questions), [sections]);

  const set = (id: string, value: AnswerValue) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    setErrors((e) => {
      const rest = { ...e };
      delete rest[id];
      return rest;
    });
  };

  const validateSection = () => {
    const issues = validateBriefAnswers({ sections: [section] }, answers);
    const next: Record<string, string> = {};
    for (const issue of issues) if (issue.target) next[issue.target] = issue.message;
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first)
      document
        .getElementById(`q-${first}`)
        ?.querySelector<HTMLElement>("input, textarea, button, [tabindex='0']")
        ?.focus();
    return issues.length === 0;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <BriefProgress
        sections={sections.map((s, i) => ({ id: s.id, title: s.title, complete: i < index }))}
        currentId={current}
        onSelect={setCurrent}
      />
      <Specimen label={`Brief: ${section.title}`}>
        <BriefSection title={section.title}>
          {section.questions.map((q) => {
            if (!isQuestionVisible(q, answers)) return null;
            const node = (
              <QuestionRenderer
                question={q}
                value={answers[q.id]}
                onChange={(v) => set(q.id, v)}
                error={errors[q.id]}
                upload={fakeUpload}
              />
            );
            const source =
              q.condition && allQuestions.find((x) => x.id === q.condition!.sourceQuestionId);
            return (
              <div key={q.id} id={`q-${q.id}`}>
                {source ? (
                  <ConditionalQuestion reason={`Because you answered "${source.label}"`}>
                    {node}
                  </ConditionalQuestion>
                ) : (
                  node
                )}
              </div>
            );
          })}
        </BriefSection>
        <div className="mt-8 flex justify-between gap-3 border-t border-border pt-6">
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => setCurrent(sections[index - 1].id)}
          >
            Back
          </Button>
          <Button
            onClick={() => {
              if (!validateSection()) return;
              if (index < sections.length - 1) setCurrent(sections[index + 1].id);
              else toast.success("Brief complete", { description: "Next, review your Request." });
            }}
          >
            {index < sections.length - 1 ? "Continue" : "Review Request"}
          </Button>
        </div>
      </Specimen>
    </div>
  );
}

// ------------------------------------------------------------------ Negotiation

export function NegotiationDemo({
  responses,
  names,
  terms,
}: {
  responses: RequestResponse[];
  names: Record<"CREATIVE" | "CLIENT", string>;
  terms: TermsSnapshot;
}) {
  const [thread, setThread] = useState(responses);
  const [accepted, setAccepted] = useState<string | null>(null);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Specimen label="Clarification (Client view)">
        <ClarificationPanel
          responses={thread}
          names={names}
          viewerRole="CLIENT"
          onSend={async (message) => {
            await new Promise((r) => setTimeout(r, 400));
            setThread((t) => [
              ...t,
              {
                id: crypto.randomUUID(),
                requestId: "demo",
                proposalId: null,
                authorUserId: "u-kemi",
                authorRole: "CLIENT",
                type: "CLIENT_CLARIFICATION",
                message,
                attachmentIds: [],
                createdAt: new Date().toISOString(),
              },
            ]);
            toast.success("Reply sent", {
              description: `${names.CREATIVE} will see it on the Request.`,
            });
          }}
        />
      </Specimen>
      <Specimen label="Terms (final acceptance)">
        <TermsPanel
          terms={terms}
          acceptedAt={accepted}
          onAccept={async () => {
            await new Promise((r) => setTimeout(r, 400));
            setAccepted(new Date().toISOString());
          }}
        />
      </Specimen>
    </div>
  );
}

// ------------------------------------------------------------------ Payment forms

export function PaymentFormsDemo({
  methods,
  declaration,
  today,
}: {
  methods: PaymentMethod[];
  declaration: PaymentDeclaration;
  today: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Specimen label="Payment declaration (Client)">
        <PaymentDeclarationForm
          methods={methods}
          currency={declaration.currency}
          defaultAmount="190000"
          today={today}
          onSubmit={async (v) => {
            await new Promise((r) => setTimeout(r, 400));
            toast.success("Payment declared", {
              description: `We've told the Creative you paid ${formatMoney({ amountMinor: v.amount, currency: declaration.currency })}. They'll confirm once it arrives.`,
            });
          }}
        />
      </Specimen>
      <Specimen label="Payment confirmation (Creative)">
        <PaymentConfirmationForm
          declaration={declaration}
          onConfirm={async (amount) => {
            await new Promise((r) => setTimeout(r, 400));
            toast.success("Payment confirmed", {
              description: `${formatMoney({ amountMinor: amount, currency: declaration.currency })} recorded as received.`,
            });
          }}
          onNotReceived={async () => {
            await new Promise((r) => setTimeout(r, 400));
            toast("Marked as not received", { description: "We've let the Client know." });
          }}
        />
      </Specimen>
    </div>
  );
}

// ------------------------------------------------------------------ Subscription

export function SubscriptionDemo({
  services,
  freeServiceId,
}: {
  services: { id: string; name: string; publishedAt: string | null }[];
  freeServiceId: string | null;
}) {
  const [limit, setLimit] = useState(4);
  const [keep, setKeep] = useState<string[]>(freeServiceId ? [freeServiceId] : []);
  return (
    <div className="flex flex-col gap-6">
      <Specimen label="Capacity selector (NGN): try 4 or 9">
        <CapacitySelector market="NG" value={limit} current={3} onValueChange={setLimit} />
      </Specimen>
      <Specimen label="Capacity selector (USD)">
        <CapacitySelector market="INTL" value={9} current={1} onValueChange={() => {}} />
      </Specimen>
      <Specimen label="Service allocation on downgrade to 2">
        <ServiceAllocation
          services={services}
          limit={2}
          freeServiceId={freeServiceId}
          value={keep}
          onValueChange={setKeep}
        />
      </Specimen>
    </div>
  );
}
