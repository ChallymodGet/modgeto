"use client";

/**
 * Brief question components (docs/07 §26, docs/06 §33–36, BRF-001–009).
 * Controlled: the parent owns `Answers` and validation. Pricing never lives in
 * the Brief (BRF-007).
 */
import { CornerDownRight, ImageIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormFieldset } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectionCard, SelectionCardGroup } from "@/components/ui/selection-card";
import { Textarea } from "@/components/ui/textarea";
import type { AnswerValue, BriefQuestion } from "@/lib/domain";
import { FileUploader, type UploadFn, type UploadedFile } from "./file-uploader";

type QuestionProps = {
  question: BriefQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  error?: string | null;
  /** Helper text the Creative wrote for this question. */
  description?: ReactNode;
};

const asString = (v: AnswerValue | undefined) => (typeof v === "string" ? v : "");
const asList = (v: AnswerValue | undefined): string[] => (Array.isArray(v) ? [...v] : []);

/** SHORT_TEXT, LONG_TEXT, URL and NUMBER. */
export function TextQuestion({ question, value, onChange, error, description }: QuestionProps) {
  const common = {
    label: question.label,
    description,
    error,
    required: question.required,
    optional: !question.required,
  };
  switch (question.type) {
    case "LONG_TEXT":
      return (
        <FormField {...common}>
          <Textarea
            value={asString(value)}
            onChange={(e) => onChange(e.target.value)}
            maxLength={2_000}
            showCount
          />
        </FormField>
      );
    case "URL":
      return (
        <FormField {...common} description={description ?? "Include https://"}>
          <Input
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://"
            value={asString(value)}
            onChange={(e) => onChange(e.target.value)}
          />
        </FormField>
      );
    case "NUMBER":
      return (
        <FormField {...common}>
          <NumberInput
            value={typeof value === "number" ? value : null}
            onValueChange={(v) => v !== null && onChange(v)}
            steppers={false}
            className="max-w-48"
          />
        </FormField>
      );
    default:
      return (
        <FormField {...common}>
          <Input
            value={asString(value)}
            onChange={(e) => onChange(e.target.value)}
            maxLength={200}
          />
        </FormField>
      );
  }
}

/** SINGLE_CHOICE (radios), MULTIPLE_CHOICE (checkboxes) and DROPDOWN (select). */
export function ChoiceQuestion({ question, value, onChange, error, description }: QuestionProps) {
  const choices = question.choices ?? [];
  if (question.type === "DROPDOWN") {
    return (
      <FormField
        label={question.label}
        description={description}
        error={error}
        required={question.required}
        optional={!question.required}
      >
        <Select
          items={choices.map((c) => ({ value: c.id, label: c.label }))}
          value={asString(value) || null}
          onValueChange={(v) => v && onChange(v as string)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent>
            {choices.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    );
  }
  if (question.type === "MULTIPLE_CHOICE") {
    const selected = asList(value);
    return (
      <FormFieldset
        legend={question.label}
        description={description ?? "Choose all that apply."}
        error={error}
        optional={!question.required}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {choices.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-start gap-3">
              <span className="flex h-6 items-center">
                <Checkbox
                  checked={selected.includes(c.id)}
                  onCheckedChange={(checked) =>
                    onChange(checked ? [...selected, c.id] : selected.filter((id) => id !== c.id))
                  }
                />
              </span>
              <span className="text-body-sm text-foreground">{c.label}</span>
            </label>
          ))}
        </div>
      </FormFieldset>
    );
  }
  return (
    <FormFieldset
      legend={question.label}
      description={description}
      error={error}
      optional={!question.required}
    >
      <RadioGroup
        value={asString(value) || null}
        onValueChange={(v) => onChange(v as string)}
        aria-invalid={error ? true : undefined}
      >
        {choices.map((c) => (
          <RadioItem key={c.id} value={c.id} label={c.label} />
        ))}
      </RadioGroup>
    </FormFieldset>
  );
}

/**
 * VISUAL_SELECTION: the Creative's own reference examples (docs/06 §34).
 * Selection shows through a check, border and tint, not colour alone. Each
 * example's label doubles as its text description.
 */
export function VisualChoiceQuestion({
  question,
  value,
  onChange,
  error,
  description,
  imageFor,
}: QuestionProps & { imageFor?: (exampleId: string) => string | null }) {
  const examples = question.visualExamples ?? [];
  const media = (id: string, label: string) => {
    const src = imageFor?.(id);
    return src ? (
      // eslint-disable-next-line @next/next/no-img-element -- R2 images get next/image in Phase 10
      <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
    ) : (
      <span
        aria-hidden="true"
        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 text-foreground-disabled"
      >
        <ImageIcon className="size-6" />
        <span className="text-caption">{label}</span>
      </span>
    );
  };
  const cards = examples.map((ex) => (
    <SelectionCard key={ex.id} value={ex.id} title={ex.label} media={media(ex.id, ex.label)} />
  ));
  const shared = {
    legend: question.label,
    error,
    optional: !question.required,
    columns: 3 as const,
  };
  return question.allowMultiple ? (
    <SelectionCardGroup
      {...shared}
      type="multiple"
      description={description ?? "Choose all that appeal to you."}
      value={asList(value)}
      onValueChange={onChange}
    >
      {cards}
    </SelectionCardGroup>
  ) : (
    <SelectionCardGroup
      {...shared}
      description={description}
      value={asString(value) || null}
      onValueChange={onChange}
    >
      {cards}
    </SelectionCardGroup>
  );
}

/** FILE and MULTIPLE_FILE. Answers hold asset ids (D-018). */
export function FileQuestion({
  question,
  value,
  onChange,
  error,
  description,
  upload,
  initialFiles,
}: QuestionProps & { upload: UploadFn; initialFiles?: UploadedFile[] }) {
  return (
    <FormFieldset
      legend={question.label}
      description={description}
      error={error}
      optional={!question.required}
    >
      <FileUploader
        multiple={question.type === "MULTIPLE_FILE"}
        upload={upload}
        initialFiles={
          initialFiles ?? asList(value).map((id) => ({ assetId: id, name: id, sizeBytes: 0 }))
        }
        onChange={(files) => onChange(files.map((f) => f.assetId))}
        invalid={Boolean(error)}
      />
    </FormFieldset>
  );
}

/**
 * A question shown because of an earlier answer (BRF-005, one level). It is
 * indented and says why it appeared, so the change in the form isn't a surprise.
 */
export function ConditionalQuestion({ reason, children }: { reason: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-l-2 border-primary/30 pl-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1">
      <p className="flex items-center gap-1.5 text-caption text-foreground-muted">
        <CornerDownRight aria-hidden="true" className="size-3.5" />
        {reason}
      </p>
      {children}
    </div>
  );
}

/** Picks the right component for a question's type. */
export function QuestionRenderer(
  props: QuestionProps & { upload: UploadFn; imageFor?: (exampleId: string) => string | null },
) {
  const { upload, imageFor, ...question } = props;
  switch (props.question.type) {
    case "SINGLE_CHOICE":
    case "MULTIPLE_CHOICE":
    case "DROPDOWN":
      return <ChoiceQuestion {...question} />;
    case "VISUAL_SELECTION":
      return <VisualChoiceQuestion {...question} imageFor={imageFor} />;
    case "FILE":
    case "MULTIPLE_FILE":
      return <FileQuestion {...question} upload={upload} />;
    default:
      return <TextQuestion {...question} />;
  }
}
