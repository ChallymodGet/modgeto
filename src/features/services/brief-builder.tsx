"use client";

/**
 * Brief Builder (BRF-001–009, docs/06 §57, docs/04 §38). Sections and
 * questions can be added, edited, reordered with Move up / Move down, moved to
 * another section, and previewed. Questions are edited in a side panel on
 * desktop and a full-screen sheet on phones.
 */
import { ArrowDown, ArrowUp, CornerDownRight, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConditionalQuestion, QuestionRenderer } from "@/components/brief/questions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormFieldset } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  type Answers,
  type AnswerValue,
  type Brief,
  type BriefQuestion,
  type BriefSection,
  type Choice,
  type QuestionType,
  isQuestionVisible,
} from "@/lib/domain";
import { simulatedUpload } from "@/features/requests/simulated-upload";
import { moveItem } from "./builder-model";
import { BuilderBlock, ListItem, errorFor, keepFocusIn, newItemId } from "./builder-fields";
import type { SectionProps } from "./builder-sections";

const TYPE_LABEL: Record<QuestionType, string> = {
  SHORT_TEXT: "Short answer",
  LONG_TEXT: "Long answer",
  SINGLE_CHOICE: "One choice",
  MULTIPLE_CHOICE: "Several choices",
  DROPDOWN: "Dropdown",
  NUMBER: "Number",
  URL: "Link",
  FILE: "File upload",
  MULTIPLE_FILE: "Several files",
  VISUAL_SELECTION: "Visual examples",
};
const TYPES = Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }));
const HAS_CHOICES: QuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];

const allQuestions = (brief: Brief) => brief.sections.flatMap((s) => s.questions);

/** Choices, or visual examples, with Move up / Move down and Remove. */
function ChoicesEditor({
  legend,
  description,
  items,
  onChange,
  itemLabel,
  error,
}: {
  legend: string;
  description?: string;
  items: readonly Choice[];
  onChange: (items: Choice[]) => void;
  itemLabel: string;
  error?: string | null;
}) {
  return (
    <FormFieldset legend={legend} description={description} error={error}>
      <ol className="flex flex-col gap-2">
        {items.map((c, i) => (
          <li key={c.id} className="flex items-end gap-1">
            <FormField label={`${itemLabel} ${i + 1}`} className="min-w-0 flex-1">
              <Input
                value={c.label}
                maxLength={120}
                onChange={(e) =>
                  onChange(items.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)))
                }
              />
            </FormField>
            <IconButton
              size="sm"
              variant="ghost"
              label={`Move ${itemLabel.toLowerCase()} ${i + 1} up`}
              icon={<ArrowUp />}
              disabled={i === 0}
              data-move="up"
              onClick={(e) => {
                onChange(moveItem(items, i, -1));
                keepFocusIn(e.currentTarget.closest("li"));
              }}
              className="mb-1"
            />
            <IconButton
              size="sm"
              variant="ghost"
              label={`Move ${itemLabel.toLowerCase()} ${i + 1} down`}
              icon={<ArrowDown />}
              disabled={i === items.length - 1}
              data-move="down"
              onClick={(e) => {
                onChange(moveItem(items, i, 1));
                keepFocusIn(e.currentTarget.closest("li"));
              }}
              className="mb-1"
            />
            <IconButton
              size="sm"
              variant="ghost"
              label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`}
              icon={<Trash2 />}
              onClick={() => onChange(items.filter((x) => x.id !== c.id))}
              className="mb-1"
            />
          </li>
        ))}
      </ol>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => onChange([...items, { id: newItemId("c"), label: "" }])}
      >
        <Plus aria-hidden="true" />
        Add {itemLabel.toLowerCase()}
      </Button>
    </FormFieldset>
  );
}

type EditorProps = {
  brief: Brief;
  sectionId: string;
  question: BriefQuestion;
  error: string | null;
  onChange: (q: BriefQuestion) => void;
  onMoveToSection: (sectionId: string) => void;
  onClose: () => void;
};

/** The question editor sheet. Changes apply as they're typed and autosave. */
function QuestionEditor({
  brief,
  sectionId,
  question: q,
  error,
  onChange,
  onMoveToSection,
  onClose,
}: EditorProps) {
  const set = (change: Partial<BriefQuestion>) => onChange({ ...q, ...change });
  const questions = allQuestions(brief);
  const position = questions.findIndex((x) => x.id === q.id);
  // One-level conditions only (BRF-005): earlier, unconditional questions with choices.
  const sources = questions
    .slice(0, Math.max(position, 0))
    .filter(
      (x) =>
        !x.condition &&
        (HAS_CHOICES.includes(x.type) || x.type === "VISUAL_SELECTION") &&
        ((x.type === "VISUAL_SELECTION" ? x.visualExamples : x.choices)?.length ?? 0) > 0,
    );
  const source = sources.find((x) => x.id === q.condition?.sourceQuestionId);
  const sourceChoices =
    (source?.type === "VISUAL_SELECTION" ? source.visualExamples : source?.choices) ?? [];

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="lg">
        <SheetHeader>
          <SheetTitle>{q.label || "New question"}</SheetTitle>
          <SheetDescription>Changes save as you type.</SheetDescription>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-5">
          <FormField label="Question" required error={error}>
            <Input
              value={q.label}
              maxLength={160}
              autoFocus={!q.label}
              onChange={(e) => set({ label: e.target.value })}
            />
          </FormField>
          <FormField label="Answer type">
            <Select
              items={TYPES}
              value={q.type}
              onValueChange={(v) => {
                const type = v as QuestionType;
                set({
                  type,
                  choices: HAS_CHOICES.includes(type)
                    ? q.choices?.length
                      ? q.choices
                      : [
                          { id: newItemId("c"), label: "" },
                          { id: newItemId("c"), label: "" },
                        ]
                    : undefined,
                  visualExamples:
                    type === "VISUAL_SELECTION"
                      ? q.visualExamples?.length
                        ? q.visualExamples
                        : [{ id: newItemId("v"), label: "" }]
                      : undefined,
                  allowMultiple:
                    type === "VISUAL_SELECTION" ? (q.allowMultiple ?? false) : undefined,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Description" optional description="Shown under the question.">
            <Textarea
              rows={2}
              maxLength={300}
              value={q.description ?? ""}
              onChange={(e) => set({ description: e.target.value || undefined })}
            />
          </FormField>
          <FormField label="Example or guidance" optional description="For example: Bloom & Co.">
            <Input
              value={q.guidance ?? ""}
              maxLength={160}
              onChange={(e) => set({ guidance: e.target.value || undefined })}
            />
          </FormField>
          {HAS_CHOICES.includes(q.type) && (
            <ChoicesEditor
              legend="Choices"
              itemLabel="Choice"
              items={q.choices ?? []}
              onChange={(choices) => set({ choices })}
            />
          )}
          {q.type === "VISUAL_SELECTION" && (
            <>
              <ChoicesEditor
                legend="Visual examples"
                description="Describe each example so every Client can choose, including screen reader users. You'll add the images when file storage arrives."
                itemLabel="Example"
                items={q.visualExamples ?? []}
                onChange={(visualExamples) => set({ visualExamples })}
              />
              <FormField label="Clients can choose more than one" orientation="horizontal">
                <Switch
                  checked={q.allowMultiple ?? false}
                  onCheckedChange={(on) => set({ allowMultiple: on })}
                />
              </FormField>
            </>
          )}
          <FormField
            label="Clients must answer"
            description="Optional questions are marked for the Client."
            orientation="horizontal"
          >
            <Switch checked={q.required} onCheckedChange={(on) => set({ required: on })} />
          </FormField>

          <FormFieldset
            legend="Show this question"
            description="Ask it only when the Client gave a particular answer earlier."
          >
            <FormField label="Only show when" orientation="horizontal">
              <Checkbox
                checked={Boolean(q.condition)}
                disabled={sources.length === 0}
                onCheckedChange={(on) =>
                  set({
                    condition:
                      on && sources[0]
                        ? {
                            sourceQuestionId: sources[0].id,
                            equals:
                              ((sources[0].type === "VISUAL_SELECTION"
                                ? sources[0].visualExamples
                                : sources[0].choices) ?? [])[0]?.id ?? "",
                          }
                        : undefined,
                  })
                }
              />
            </FormField>
            {sources.length === 0 && (
              <p className="text-body-sm text-foreground-muted">
                Add a choice question before this one to make it conditional.
              </p>
            )}
            {q.condition && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Earlier question">
                  <Select
                    items={sources.map((x) => ({ value: x.id, label: x.label || "Untitled" }))}
                    value={q.condition.sourceQuestionId}
                    onValueChange={(v) => {
                      const next = sources.find((x) => x.id === v)!;
                      const choices =
                        (next.type === "VISUAL_SELECTION" ? next.visualExamples : next.choices) ??
                        [];
                      set({
                        condition: { sourceQuestionId: next.id, equals: choices[0]?.id ?? "" },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((x) => (
                        <SelectItem key={x.id} value={x.id}>
                          {x.label || "Untitled"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Answer is">
                  <Select
                    items={sourceChoices.map((c) => ({
                      value: c.id,
                      label: c.label || "Untitled",
                    }))}
                    value={q.condition.equals}
                    onValueChange={(v) =>
                      set({ condition: { ...q.condition!, equals: v as string } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceChoices.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label || "Untitled"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            )}
          </FormFieldset>

          {brief.sections.length > 1 && (
            <FormField label="Section" description="Move this question to another section.">
              <Select
                items={brief.sections.map((s) => ({ value: s.id, label: s.title || "Untitled" }))}
                value={sectionId}
                onValueChange={(v) => onMoveToSection(v as string)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brief.sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title || "Untitled section"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </SheetBody>
        <SheetFooter>
          <Button onClick={onClose}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** What the Client will see, answerable, so conditions can be tried out (SRV-006). */
export function BriefPreview({ brief, onClose }: { brief: Brief; onClose: () => void }) {
  const [answers, setAnswers] = useState<Answers>({});
  const questions = allQuestions(brief);
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="lg">
        <SheetHeader>
          <SheetTitle>Brief preview</SheetTitle>
          <SheetDescription>
            What Clients see. Try answering to check your conditional questions. Nothing is saved.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-8">
          {brief.intro && <p className="text-body text-foreground-secondary">{brief.intro}</p>}
          {brief.sections.map((s) => (
            <section key={s.id} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h3 className="text-h4 text-foreground">{s.title || "Untitled section"}</h3>
                {s.intro && <p className="text-body-sm text-foreground-secondary">{s.intro}</p>}
              </div>
              {s.questions.map((q) => {
                if (!isQuestionVisible(q, answers)) return null;
                const node = (
                  <QuestionRenderer
                    question={q}
                    value={answers[q.id]}
                    onChange={(v: AnswerValue) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                    upload={simulatedUpload}
                  />
                );
                const source =
                  q.condition && questions.find((x) => x.id === q.condition!.sourceQuestionId);
                return (
                  <div key={q.id}>
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
            </section>
          ))}
        </SheetBody>
        <SheetFooter>
          <Button variant="secondary" onClick={onClose}>
            Close preview
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function BriefSectionEditor({ service, update, blockers }: SectionProps) {
  const brief = service.brief;
  const [editing, setEditing] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const setBrief = (fn: (b: Brief) => Brief) => update((s) => ({ ...s, brief: fn(s.brief) }));
  const setSections = (fn: (list: BriefSection[]) => BriefSection[]) =>
    setBrief((b) => ({ ...b, sections: fn([...b.sections]) }));
  const patchSection = (id: string, fn: (s: BriefSection) => BriefSection) =>
    setSections((list) => list.map((s) => (s.id === id ? fn(s) : s)));
  const patchQuestion = (id: string, q: BriefQuestion) =>
    setSections((list) =>
      list.map((s) => ({ ...s, questions: s.questions.map((x) => (x.id === id ? q : x)) })),
    );
  // Removing a question also clears conditions that pointed at it.
  const removeQuestion = (id: string) =>
    setSections((list) =>
      list.map((s) => ({
        ...s,
        questions: s.questions
          .filter((x) => x.id !== id)
          .map((x) => (x.condition?.sourceQuestionId === id ? { ...x, condition: undefined } : x)),
      })),
    );
  const addQuestion = (sectionId: string) => {
    const id = newItemId("q");
    patchSection(sectionId, (s) => ({
      ...s,
      questions: [...s.questions, { id, type: "SHORT_TEXT", label: "", required: true }],
    }));
    setEditing(id);
  };

  const editingSection = brief.sections.find((s) => s.questions.some((q) => q.id === editing));
  const editingQuestion = editingSection?.questions.find((q) => q.id === editing);
  const questionCount = allQuestions(brief).length;

  return (
    <>
      <BuilderBlock
        title="Brief"
        description="Ask what you need to start well. Keep it short: Clients can save and come back."
        actions={
          questionCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setPreviewing(true)}>
              <Eye aria-hidden="true" />
              Preview Brief
            </Button>
          )
        }
      >
        <FormField label="Introduction" optional description="Shown before the first question.">
          <Textarea
            rows={2}
            maxLength={400}
            value={brief.intro ?? ""}
            onChange={(e) => setBrief((b) => ({ ...b, intro: e.target.value || undefined }))}
          />
        </FormField>
        {brief.sections.length === 0 && (
          <p className="text-body-sm text-foreground-secondary">
            A Brief is optional. Add a section to start asking questions.
          </p>
        )}
      </BuilderBlock>

      {brief.sections.length > 0 && (
        <ol className="flex flex-col gap-6" aria-label="Brief sections">
          {brief.sections.map((section, si) => (
            <ListItem
              key={section.id}
              title={section.title || `Section ${si + 1}`}
              index={si}
              count={brief.sections.length}
              removeLabel="Remove section"
              onMove={(d) => setSections((list) => moveItem(list, si, d))}
              onRemove={() => {
                const ids = section.questions.map((q) => q.id);
                setSections((list) =>
                  list
                    .filter((s) => s.id !== section.id)
                    .map((s) => ({
                      ...s,
                      questions: s.questions.map((q) =>
                        q.condition && ids.includes(q.condition.sourceQuestionId)
                          ? { ...q, condition: undefined }
                          : q,
                      ),
                    })),
                );
              }}
            >
              <FormField label="Section title" required error={errorFor(blockers, section.id)}>
                <Input
                  value={section.title}
                  maxLength={80}
                  onChange={(e) =>
                    patchSection(section.id, (s) => ({ ...s, title: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Section introduction" optional>
                <Input
                  value={section.intro ?? ""}
                  maxLength={200}
                  onChange={(e) =>
                    patchSection(section.id, (s) => ({ ...s, intro: e.target.value || undefined }))
                  }
                />
              </FormField>
              {section.questions.length > 0 && (
                <ol className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {section.questions.map((q, qi) => {
                    const problem = errorFor(blockers, q.id);
                    return (
                      <li
                        key={q.id}
                        id={`bq-${q.id}`}
                        className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="text-body-sm font-medium text-foreground">
                            {q.label || "Untitled question"}
                          </span>
                          <span className="flex flex-wrap items-center gap-2">
                            <Badge tone="neutral">{TYPE_LABEL[q.type]}</Badge>
                            <span className="text-caption text-foreground-secondary">
                              {q.required ? "Required" : "Optional"}
                            </span>
                            {q.condition && (
                              <span className="flex items-center gap-1 text-caption text-foreground-secondary">
                                <CornerDownRight aria-hidden="true" className="size-3.5" />
                                Conditional
                              </span>
                            )}
                          </span>
                          {problem && (
                            <span className="text-caption font-medium text-danger">{problem}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 self-end sm:self-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(q.id)}
                            aria-label={`Edit ${q.label || "untitled question"}`}
                          >
                            <Pencil aria-hidden="true" />
                            Edit
                          </Button>
                          <IconButton
                            size="sm"
                            variant="ghost"
                            label={`Move ${q.label || "question"} up`}
                            icon={<ArrowUp />}
                            disabled={qi === 0}
                            data-move="up"
                            onClick={(e) => {
                              patchSection(section.id, (s) => ({
                                ...s,
                                questions: moveItem(s.questions, qi, -1),
                              }));
                              keepFocusIn(e.currentTarget.closest("li"));
                            }}
                          />
                          <IconButton
                            size="sm"
                            variant="ghost"
                            label={`Move ${q.label || "question"} down`}
                            icon={<ArrowDown />}
                            disabled={qi === section.questions.length - 1}
                            data-move="down"
                            onClick={(e) => {
                              patchSection(section.id, (s) => ({
                                ...s,
                                questions: moveItem(s.questions, qi, 1),
                              }));
                              keepFocusIn(e.currentTarget.closest("li"));
                            }}
                          />
                          <IconButton
                            size="sm"
                            variant="ghost"
                            label={`Remove ${q.label || "question"}`}
                            icon={<Trash2 />}
                            onClick={() => removeQuestion(q.id)}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() => addQuestion(section.id)}
              >
                <Plus aria-hidden="true" />
                Add question
              </Button>
            </ListItem>
          ))}
        </ol>
      )}

      <Button
        variant="secondary"
        className="self-start"
        onClick={() =>
          setSections((list) => [
            ...list,
            {
              id: newItemId("bs"),
              title: list.length === 0 ? "About your project" : "",
              questions: [],
            },
          ])
        }
      >
        <Plus aria-hidden="true" />
        Add section
      </Button>

      {editingQuestion && editingSection && (
        <QuestionEditor
          brief={brief}
          sectionId={editingSection.id}
          question={editingQuestion}
          error={errorFor(blockers, editingQuestion.id)}
          onChange={(q) => patchQuestion(q.id, q)}
          onMoveToSection={(target) =>
            setSections((list) =>
              list.map((s) =>
                s.id === editingSection.id
                  ? { ...s, questions: s.questions.filter((x) => x.id !== editingQuestion.id) }
                  : s.id === target
                    ? { ...s, questions: [...s.questions, editingQuestion] }
                    : s,
              ),
            )
          }
          onClose={() => {
            const id = editing;
            setEditing(null);
            // Return focus to the question's Edit button once the sheet is gone.
            requestAnimationFrame(() =>
              document.querySelector<HTMLButtonElement>(`#bq-${id} button`)?.focus(),
            );
          }}
        />
      )}
      {previewing && <BriefPreview brief={brief} onClose={() => setPreviewing(false)} />}
    </>
  );
}
