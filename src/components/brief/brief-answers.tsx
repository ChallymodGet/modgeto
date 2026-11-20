/**
 * A submitted Brief, read-only (BRF-008). Shows the questions the Client
 * actually saw, in order, with their answers in words. Used by Review and
 * by both sides of a Request.
 */
import type { AnswerValue, BriefQuestion } from "@/lib/domain";
import type { BriefSnapshot } from "@/types";

/** An answer in words, or null when it was left blank. */
export function answerText(
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

export function BriefAnswers({
  snapshot,
  headingLevel: Heading = "h3",
}: {
  snapshot: BriefSnapshot;
  headingLevel?: "h3" | "h4";
}) {
  const visible = new Set(snapshot.visibleQuestionIds);
  const sections = snapshot.brief.sections
    .map((s) => ({ ...s, questions: s.questions.filter((q) => visible.has(q.id)) }))
    .filter((s) => s.questions.length > 0);
  if (sections.length === 0) {
    return <p className="text-body-sm text-foreground-secondary">This Service has no Brief.</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      {sections.map((s) => (
        <section key={s.id} className="flex flex-col gap-3">
          <Heading className="text-label text-foreground">{s.title}</Heading>
          <dl className="flex flex-col divide-y divide-border">
            {s.questions.map((q) => {
              const text = answerText(q, snapshot.answers[q.id]);
              return (
                <div key={q.id} className="flex flex-col gap-1 py-3">
                  <dt className="text-body-sm text-foreground-secondary">{q.label}</dt>
                  <dd
                    className={
                      text
                        ? "text-body-sm whitespace-pre-line text-foreground"
                        : "text-body-sm text-foreground-muted italic"
                    }
                  >
                    {text ?? "Not answered"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
