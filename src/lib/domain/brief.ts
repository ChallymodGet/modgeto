/**
 * Brief structure and answer validation (docs/03 §30–35, PRD BRF-001–009, D-018).
 * Pricing-affecting choices never live in the Brief (BRF-007).
 */
import type { DomainError } from "./result";

export const QUESTION_TYPES = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
  "NUMBER",
  "URL",
  "FILE",
  "MULTIPLE_FILE",
  "VISUAL_SELECTION",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Max files per multiple-file question (D-018). */
export const MAX_FILES_PER_QUESTION = 10;

export type Choice = { id: string; label: string };

/** One-level logic: "If Question A = X, show Question B" (BRF-005). */
export type QuestionCondition = { sourceQuestionId: string; equals: string };

export type BriefQuestion = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  /** Choices for SINGLE_CHOICE, MULTIPLE_CHOICE, DROPDOWN. */
  choices?: readonly Choice[];
  /** Creative-uploaded examples for VISUAL_SELECTION; ids are the selectable values. */
  visualExamples?: readonly Choice[];
  /** VISUAL_SELECTION may allow one or several picks (BRF-004). */
  allowMultiple?: boolean;
  condition?: QuestionCondition;
};

export type BriefSection = { id: string; title: string; questions: readonly BriefQuestion[] };
export type Brief = { sections: readonly BriefSection[] };

/**
 * Answer values by question type:
 * text, URL → string · NUMBER → number · SINGLE_CHOICE, DROPDOWN → choice id ·
 * MULTIPLE_CHOICE, VISUAL_SELECTION → choice ids · FILE, MULTIPLE_FILE → asset ids
 */
export type AnswerValue = string | number | readonly string[];
export type Answers = Readonly<Record<string, AnswerValue | undefined>>;

const CHOICE_TYPES: readonly QuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];

function allQuestions(brief: Brief): BriefQuestion[] {
  return brief.sections.flatMap((s) => s.questions);
}

function isEmpty(value: AnswerValue | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (typeof value === "number") return Number.isNaN(value);
  return value.length === 0;
}

/** A conditional question shows when its source answer equals (or, for multi-select, includes) the value. */
export function isQuestionVisible(question: BriefQuestion, answers: Answers): boolean {
  if (!question.condition) return true;
  const source = answers[question.condition.sourceQuestionId];
  if (source === undefined) return false;
  if (Array.isArray(source)) return source.includes(question.condition.equals);
  return String(source) === question.condition.equals;
}

export function visibleQuestions(brief: Brief, answers: Answers): BriefQuestion[] {
  return allQuestions(brief).filter((q) => isQuestionVisible(q, answers));
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateAnswer(
  question: BriefQuestion,
  value: AnswerValue | undefined,
): DomainError | null {
  const fail = (code: string, message: string) => ({ code, message, target: question.id });

  if (isEmpty(value)) {
    return question.required ? fail("ANSWER_REQUIRED", `Answer "${question.label}".`) : null;
  }

  switch (question.type) {
    case "SHORT_TEXT":
    case "LONG_TEXT":
      return typeof value === "string" ? null : fail("INVALID_ANSWER", "Enter text.");
    case "URL":
      return typeof value === "string" && isHttpUrl(value.trim())
        ? null
        : fail("INVALID_URL", "Enter a full link starting with https://.");
    case "NUMBER":
      return typeof value === "number" && Number.isFinite(value)
        ? null
        : fail("INVALID_NUMBER", "Enter a number.");
    case "SINGLE_CHOICE":
    case "DROPDOWN":
      return typeof value === "string" && (question.choices ?? []).some((c) => c.id === value)
        ? null
        : fail("INVALID_CHOICE", "Choose one of the options.");
    case "MULTIPLE_CHOICE":
    case "VISUAL_SELECTION": {
      const options =
        question.type === "MULTIPLE_CHOICE" ? question.choices : question.visualExamples;
      if (!Array.isArray(value) || !value.every((id) => (options ?? []).some((c) => c.id === id))) {
        return fail("INVALID_CHOICE", "Choose from the options shown.");
      }
      if (question.type === "VISUAL_SELECTION" && !question.allowMultiple && value.length > 1) {
        return fail("TOO_MANY_CHOICES", "Choose one example.");
      }
      return null;
    }
    case "FILE":
      return Array.isArray(value) && value.length === 1
        ? null
        : fail("INVALID_FILES", "Upload one file.");
    case "MULTIPLE_FILE":
      return Array.isArray(value) && value.length <= MAX_FILES_PER_QUESTION
        ? null
        : fail("TOO_MANY_FILES", `Upload up to ${MAX_FILES_PER_QUESTION} files.`);
  }
}

/**
 * Problems with the visible questions. Hidden conditional questions never block
 * (BRF-006). Pass a section id to validate just that section on Continue (docs/06 §36).
 */
export function validateBriefAnswers(
  brief: Brief,
  answers: Answers,
  sectionId?: string,
): DomainError[] {
  const sections = sectionId ? brief.sections.filter((s) => s.id === sectionId) : brief.sections;
  return sections
    .flatMap((s) => s.questions)
    .filter((q) => isQuestionVisible(q, answers))
    .map((q) => validateAnswer(q, answers[q.id]))
    .filter((e): e is DomainError => e !== null);
}

export function isBriefComplete(brief: Brief, answers: Answers): boolean {
  return validateBriefAnswers(brief, answers).length === 0;
}

/** Problems that block publishing a Brief (part of SRV-004 "Valid Brief"). */
export function validateBriefDefinition(brief: Brief): DomainError[] {
  const issues: DomainError[] = [];
  const questions = allQuestions(brief);
  const position = new Map(questions.map((q, i) => [q.id, i]));

  for (const section of brief.sections) {
    if (!section.title.trim()) {
      issues.push({
        code: "SECTION_TITLE_REQUIRED",
        message: "Give every section a title.",
        target: section.id,
      });
    }
    if (section.questions.length === 0) {
      issues.push({
        code: "EMPTY_SECTION",
        message: `${section.title || "A section"} has no questions.`,
        target: section.id,
      });
    }
  }

  for (const q of questions) {
    if (!q.label.trim()) {
      issues.push({
        code: "QUESTION_LABEL_REQUIRED",
        message: "Every question needs a label.",
        target: q.id,
      });
    }
    if (CHOICE_TYPES.includes(q.type) && (q.choices?.length ?? 0) === 0) {
      issues.push({
        code: "CHOICES_REQUIRED",
        message: `"${q.label}" needs choices.`,
        target: q.id,
      });
    }
    if (q.type === "VISUAL_SELECTION" && (q.visualExamples?.length ?? 0) === 0) {
      issues.push({
        code: "EXAMPLES_REQUIRED",
        message: `"${q.label}" needs at least one example.`,
        target: q.id,
      });
    }

    if (q.condition) {
      const source = questions.find((s) => s.id === q.condition!.sourceQuestionId);
      const sourceOptions =
        source?.type === "VISUAL_SELECTION" ? source.visualExamples : source?.choices;
      if (!source || (!CHOICE_TYPES.includes(source.type) && source.type !== "VISUAL_SELECTION")) {
        issues.push({
          code: "INVALID_CONDITION",
          message: `"${q.label}" depends on a question without choices.`,
          target: q.id,
        });
      } else if (source.condition) {
        // One level only (BRF-005).
        issues.push({
          code: "NESTED_CONDITION",
          message: `"${q.label}" depends on a conditional question.`,
          target: q.id,
        });
      } else if ((position.get(source.id) ?? 0) >= (position.get(q.id) ?? 0)) {
        issues.push({
          code: "CONDITION_ORDER",
          message: `"${q.label}" must come after the question it depends on.`,
          target: q.id,
        });
      } else if (!(sourceOptions ?? []).some((c) => c.id === q.condition!.equals)) {
        issues.push({
          code: "INVALID_CONDITION",
          message: `"${q.label}" depends on a choice that no longer exists.`,
          target: q.id,
        });
      }
    }
  }

  return issues;
}
