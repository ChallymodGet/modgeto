import { describe, expect, it } from "vitest";
import {
  type Brief,
  isBriefComplete,
  validateBriefAnswers,
  validateBriefDefinition,
  visibleQuestions,
} from "./brief";

const brief: Brief = {
  sections: [
    {
      id: "business",
      title: "Your business",
      questions: [
        { id: "about", type: "LONG_TEXT", label: "What does your business do?", required: true },
        { id: "site", type: "URL", label: "Current website", required: false },
        {
          id: "hasLogo",
          type: "SINGLE_CHOICE",
          label: "Do you have a logo?",
          required: true,
          choices: [
            { id: "yes", label: "Yes" },
            { id: "no", label: "No" },
          ],
        },
        // Shown only when hasLogo = yes (BRF-005)
        {
          id: "logoFile",
          type: "FILE",
          label: "Upload your logo",
          required: true,
          condition: { sourceQuestionId: "hasLogo", equals: "yes" },
        },
      ],
    },
    {
      id: "style",
      title: "Style",
      questions: [
        {
          id: "directions",
          type: "VISUAL_SELECTION",
          label: "Which logo directions resonate with you?",
          required: true,
          allowMultiple: true,
          visualExamples: [
            { id: "minimal", label: "Minimal" },
            { id: "bold", label: "Bold" },
          ],
        },
        { id: "budget", type: "NUMBER", label: "Number of pages", required: false },
        { id: "assets", type: "MULTIPLE_FILE", label: "Brand assets", required: false },
      ],
    },
  ],
};

describe("conditional visibility (BRF-005)", () => {
  it("hides a conditional question until its trigger is answered", () => {
    expect(visibleQuestions(brief, {}).map((q) => q.id)).not.toContain("logoFile");
    expect(visibleQuestions(brief, { hasLogo: "no" }).map((q) => q.id)).not.toContain("logoFile");
    expect(visibleQuestions(brief, { hasLogo: "yes" }).map((q) => q.id)).toContain("logoFile");
  });
});

describe("answer validation (BRF-006)", () => {
  const complete = { about: "We sell plants.", hasLogo: "no", directions: ["minimal", "bold"] };

  it("a hidden required question never blocks", () => {
    expect(isBriefComplete(brief, complete)).toBe(true);
  });

  it("a visible required question must be answered", () => {
    const codes = validateBriefAnswers(brief, { ...complete, hasLogo: "yes" }).map((e) => [
      e.code,
      e.target,
    ]);
    expect(codes).toEqual([["ANSWER_REQUIRED", "logoFile"]]);
  });

  it("validates one section at a time for Continue (docs/06 §36)", () => {
    expect(validateBriefAnswers(brief, {}, "style").map((e) => e.target)).toEqual(["directions"]);
    expect(validateBriefAnswers(brief, {}, "business").map((e) => e.target)).toEqual([
      "about",
      "hasLogo",
    ]);
  });

  it("checks answer formats", () => {
    const errors = validateBriefAnswers(brief, {
      ...complete,
      site: "plants.example",
      hasLogo: "maybe",
      budget: Number.NaN,
      assets: Array.from({ length: 11 }, (_, i) => `asset-${i}`),
    }).map((e) => e.code);
    expect(errors).toEqual(["INVALID_URL", "INVALID_CHOICE", "TOO_MANY_FILES"]);
  });

  it("accepts valid optional answers", () => {
    expect(
      isBriefComplete(brief, {
        ...complete,
        site: "https://plants.example",
        budget: 4,
        assets: ["a1", "a2"],
      }),
    ).toBe(true);
  });

  it("enforces single visual selection when multiple is not allowed", () => {
    const single: Brief = {
      sections: [
        {
          id: "s",
          title: "Style",
          questions: [
            {
              id: "v",
              type: "VISUAL_SELECTION",
              label: "Pick one",
              required: true,
              visualExamples: [
                { id: "a", label: "A" },
                { id: "b", label: "B" },
              ],
            },
          ],
        },
      ],
    };
    expect(validateBriefAnswers(single, { v: ["a", "b"] }).map((e) => e.code)).toEqual([
      "TOO_MANY_CHOICES",
    ]);
  });
});

describe("Brief definition validation (publish)", () => {
  it("accepts a well-formed Brief, including an empty one (BRF-001: a Brief is optional)", () => {
    expect(validateBriefDefinition(brief)).toEqual([]);
    expect(validateBriefDefinition({ sections: [] })).toEqual([]);
  });

  it("rejects nested, misordered and broken conditions", () => {
    const bad: Brief = {
      sections: [
        {
          id: "s",
          title: "Section",
          questions: [
            {
              id: "later",
              type: "SHORT_TEXT",
              label: "Later",
              required: false,
              condition: { sourceQuestionId: "q1", equals: "a" },
            },
            {
              id: "q1",
              type: "DROPDOWN",
              label: "Q1",
              required: false,
              choices: [{ id: "a", label: "A" }],
            },
            {
              id: "q2",
              type: "SINGLE_CHOICE",
              label: "Q2",
              required: false,
              choices: [{ id: "x", label: "X" }],
              condition: { sourceQuestionId: "q1", equals: "a" },
            },
            {
              id: "nested",
              type: "SHORT_TEXT",
              label: "Nested",
              required: false,
              condition: { sourceQuestionId: "q2", equals: "x" },
            },
            {
              id: "gone",
              type: "SHORT_TEXT",
              label: "Gone",
              required: false,
              condition: { sourceQuestionId: "q1", equals: "zzz" },
            },
            {
              id: "text",
              type: "SHORT_TEXT",
              label: "Text",
              required: false,
              condition: { sourceQuestionId: "later", equals: "a" },
            },
          ],
        },
      ],
    };
    expect(validateBriefDefinition(bad).map((e) => [e.code, e.target])).toEqual([
      ["CONDITION_ORDER", "later"],
      ["NESTED_CONDITION", "nested"],
      ["INVALID_CONDITION", "gone"],
      ["INVALID_CONDITION", "text"],
    ]);
  });

  it("requires titles, questions, choices and examples", () => {
    const bad: Brief = {
      sections: [
        { id: "empty", title: " ", questions: [] },
        {
          id: "s",
          title: "S",
          questions: [
            { id: "c", type: "MULTIPLE_CHOICE", label: "Pick", required: false, choices: [] },
            { id: "v", type: "VISUAL_SELECTION", label: "", required: false },
          ],
        },
      ],
    };
    expect(validateBriefDefinition(bad).map((e) => e.code)).toEqual([
      "SECTION_TITLE_REQUIRED",
      "EMPTY_SECTION",
      "CHOICES_REQUIRED",
      "QUESTION_LABEL_REQUIRED",
      "EXAMPLES_REQUIRED",
    ]);
  });
});
