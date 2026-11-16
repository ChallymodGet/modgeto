"use client";

/**
 * Client Brief (docs/06 §31–37, BRF-001–008). One section at a time with
 * section progress; Continue validates the current section and focuses the
 * first problem; hidden conditional questions never block (BRF-006).
 */
import { ArrowLeft, ArrowRight, Check, Settings2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { BriefProgress, BriefSection } from "@/components/brief/brief-layout";
import { ConditionalQuestion, QuestionRenderer } from "@/components/brief/questions";
import { ConfigurationShell } from "@/components/layout/flow-shells";
import { Button, ButtonLink } from "@/components/ui/button";
import { toPricingConfig } from "@/features/services/model";
import {
  type AnswerValue,
  isQuestionVisible,
  validateBriefAnswers,
  validateSelection,
} from "@/lib/domain";
import type { Service } from "@/types";
import { configurationSteps, initialSelection } from "./configuration-steps";
import { saveDraft, useDraft } from "./draft-store";
import { MobilePriceBar, PriceSummary } from "./price-summary";
import { simulatedUpload } from "./simulated-upload";

type Props = {
  service: Service;
  creativeName: string;
  commitmentBps: number | null;
  serviceHref: string;
  configureHref: string;
  briefHref: string;
  reviewHref: string;
};

export function BriefFlow({
  service,
  creativeName,
  commitmentBps,
  configureHref,
  briefHref,
  reviewHref,
  serviceHref,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const steps = useMemo(() => configurationSteps(service), [service]);
  const sections = service.brief.sections;
  const sectionIndex = Math.max(
    0,
    sections.findIndex((s) => s.id === params.get("section")),
  );
  const section = sections[sectionIndex];
  const firstName = creativeName.split(" ")[0];

  const draft = useDraft(service.id);
  const selection = draft?.selection ?? initialSelection(service);
  const answers = useMemo(() => draft?.answers ?? {}, [draft]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const configIncomplete = validateSelection(toPricingConfig(service), selection).length > 0;
  const allQuestions = useMemo(() => sections.flatMap((s) => s.questions), [sections]);

  const save = (patch: {
    answers?: typeof answers;
    files?: Record<string, { name: string; sizeBytes: number }>;
  }) => {
    saveDraft(service.id, {
      selection,
      answers: patch.answers ?? answers,
      files: patch.files ?? draft?.files,
      validatedAgainstServiceAt: draft?.validatedAgainstServiceAt ?? service.updatedAt,
    });
    setSaved(true);
  };

  const setAnswer = (questionId: string, value: AnswerValue) => {
    save({ answers: { ...answers, [questionId]: value } });
    if (errors[questionId]) {
      setErrors((e) => {
        const rest = { ...e };
        delete rest[questionId];
        return rest;
      });
    }
  };

  // ---------------------------------------------------------------- navigation
  const shellSteps = [
    ...steps.map((s) => ({ label: s.label, href: `${configureHref}?step=${s.id}` })),
    { label: "Brief", href: briefHref },
    { label: "Review", href: reviewHref },
  ];
  const sectionHref = (i: number) => `${briefHref}?section=${sections[i].id}`;
  const goToSection = (i: number) => {
    setErrors({});
    router.push(sectionHref(i), { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onContinue = () => {
    if (section) {
      const issues = validateBriefAnswers(service.brief, answers, section.id);
      if (issues.length > 0) {
        setErrors(Object.fromEntries(issues.map((i) => [i.target ?? "", i.message])));
        // Move focus to the first invalid question (docs/06 §36).
        requestAnimationFrame(() => {
          const first = contentRef.current?.querySelector<HTMLElement>(
            `#q-${CSS.escape(issues[0].target ?? "")}`,
          );
          first?.scrollIntoView({ block: "center", behavior: "smooth" });
          first
            ?.querySelector<HTMLElement>(
              "input:not([type=hidden]):not([tabindex='-1']), textarea, [role=radio], [role=checkbox], button",
            )
            ?.focus({ preventScroll: true });
        });
        return;
      }
    }
    if (sectionIndex < sections.length - 1) goToSection(sectionIndex + 1);
    else router.push(reviewHref);
  };
  const onBack = () => {
    if (sectionIndex > 0) goToSection(sectionIndex - 1);
    else router.push(`${configureHref}?step=${steps[steps.length - 1].id}`);
  };

  const fileNames = (ids: string[]) =>
    ids.map((id) => ({
      assetId: id,
      name: draft?.files?.[id]?.name ?? "Uploaded file",
      sizeBytes: draft?.files?.[id]?.sizeBytes ?? 0,
    }));

  const sectionComplete = (id: string) =>
    validateBriefAnswers(service.brief, answers, id).length === 0;
  const progress = sections.map((s, i) => ({
    id: s.id,
    title: s.title,
    complete: i < sectionIndex && sectionComplete(s.id),
  }));
  const summaryInput = { service, selection, commitmentBps };
  const isLast = sectionIndex >= sections.length - 1;

  return (
    <ConfigurationShell
      back={{ href: serviceHref, label: "Back to Service" }}
      steps={shellSteps}
      currentStep={steps.length}
      summary={
        <div className="flex flex-col gap-4">
          {sections.length > 1 && (
            <div className="rounded-xl bg-surface p-4 shadow-sm">
              <BriefProgress
                sections={progress}
                currentId={section?.id ?? ""}
                onSelect={(id) => goToSection(sections.findIndex((s) => s.id === id))}
              />
            </div>
          )}
          <div className="rounded-xl bg-surface p-6 shadow-sm">
            <PriceSummary creativeName={creativeName} {...summaryInput} />
          </div>
        </div>
      }
      mobileBar={
        <MobilePriceBar
          creativeName={creativeName}
          {...summaryInput}
          onContinue={onContinue}
          continueLabel={isLast ? "Review" : "Continue"}
        />
      }
    >
      <div ref={contentRef} className="flex flex-col gap-8">
        <header className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-label text-foreground-secondary">{service.name} · Project Brief</p>
            <p
              aria-live="polite"
              className="flex items-center gap-1 text-caption text-foreground-secondary"
            >
              {saved && (
                <>
                  <Check aria-hidden="true" className="size-3.5 text-success" />
                  Saved on this device
                </>
              )}
            </p>
          </div>
          <h1 className="text-h2 text-foreground">Tell {firstName} about your Project</h1>
        </header>

        {configIncomplete && (
          <div className="flex flex-col gap-3 rounded-lg border border-warning-border bg-warning-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-sm text-foreground">
              Some choices for this Service still need finishing before you can submit.
            </p>
            <ButtonLink href={configureHref} variant="secondary" size="sm">
              <Settings2 aria-hidden="true" />
              Finish configuring
            </ButtonLink>
          </div>
        )}

        {sections.length > 1 && (
          <div className="lg:hidden">
            <BriefProgress sections={progress} currentId={section?.id ?? ""} />
          </div>
        )}

        {sectionIndex === 0 && service.brief.intro && (
          <p className="rounded-xl bg-surface p-5 text-body text-foreground-secondary">
            {service.brief.intro}
          </p>
        )}

        {section ? (
          <BriefSection title={section.title} intro={section.intro} headingLevel="h2">
            {section.questions.map((q) => {
              if (!isQuestionVisible(q, answers)) return null;
              const node = (
                <QuestionRenderer
                  question={q}
                  value={answers[q.id]}
                  onChange={(v) => setAnswer(q.id, v)}
                  error={errors[q.id]}
                  upload={simulatedUpload}
                  filesFor={fileNames}
                  onFilesChange={(files) => {
                    save({
                      answers: { ...answers, [q.id]: files.map((f) => f.assetId) },
                      files: {
                        ...draft?.files,
                        ...Object.fromEntries(
                          files.map((f) => [f.assetId, { name: f.name, sizeBytes: f.sizeBytes }]),
                        ),
                      },
                    });
                    setErrors((e) => {
                      const rest = { ...e };
                      delete rest[q.id];
                      return rest;
                    });
                  }}
                />
              );
              const source =
                q.condition && allQuestions.find((x) => x.id === q.condition!.sourceQuestionId);
              return (
                <div key={q.id} id={`q-${q.id}`} className="scroll-mt-28">
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
        ) : (
          <p className="rounded-xl bg-surface p-5 text-body text-foreground-secondary">
            {firstName} hasn&apos;t added any Brief questions for this Service. Continue to review
            your Request.
          </p>
        )}

        <div className="hidden items-center justify-between gap-3 border-t border-border pt-6 lg:flex">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          <Button onClick={onContinue}>
            {isLast ? "Review Request" : "Continue"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-label text-foreground-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:hidden"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {sectionIndex > 0
            ? `Back to ${sections[sectionIndex - 1].title}`
            : "Back to configuration"}
        </button>
      </div>
    </ConfigurationShell>
  );
}
