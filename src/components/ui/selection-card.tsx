"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { createContext, useContext, useId, type ReactNode } from "react";
import { checkboxStyles } from "./checkbox";
import { FormFieldset } from "./form-field";
import { radioStyles } from "./radio-group";

/**
 * Selection cards (docs/07 §36): a real radio or checkbox under a styled card.
 * Selection shows through the control's own mark, a 2px Indigo outline and a
 * tinted surface, so it survives greyscale (no colour-only state). The outline
 * is a ring, not a thicker border, so nothing shifts when selected.
 *
 * Single choice uses the WAI-ARIA radio group (one tab stop, arrow keys);
 * multiple choice uses a checkbox group (each card is a tab stop).
 */
type GroupType = "single" | "multiple";
const GroupTypeContext = createContext<GroupType>("single");

type BaseGroupProps = {
  legend: ReactNode;
  description?: ReactNode;
  error?: string | null;
  optional?: boolean;
  hideLegend?: boolean;
  /** Columns from `md`. Cards stack on phones, except `5`: compact cards, two per row on phones. */
  columns?: 1 | 2 | 3 | 5;
  disabled?: boolean;
  name?: string;
  className?: string;
  children: ReactNode;
};

type SelectionCardGroupProps = BaseGroupProps &
  (
    | {
        type?: "single";
        value?: string | null;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
      }
    | {
        type: "multiple";
        value?: string[];
        defaultValue?: string[];
        onValueChange?: (value: string[]) => void;
      }
  );

// Container queries, not viewport breakpoints: a group inside a narrow panel
// (e.g. beside a sticky summary) keeps cards readable at any screen width.
const columnClasses = {
  1: "",
  2: "@lg:grid-cols-2",
  3: "@lg:grid-cols-2 @3xl:grid-cols-3",
  5: "grid-cols-2 @lg:grid-cols-3 @3xl:grid-cols-5",
};

function SelectionCardGroup(props: SelectionCardGroupProps) {
  const {
    legend,
    description,
    error,
    optional,
    hideLegend,
    columns = 1,
    disabled,
    name,
    className,
    children,
  } = props;
  const grid = cn("grid gap-3", columnClasses[columns]);

  return (
    <FormFieldset
      legend={legend}
      description={description}
      error={error}
      optional={optional}
      hideLegend={hideLegend}
      className={className}
    >
      <GroupTypeContext.Provider value={props.type ?? "single"}>
        <div className="@container">
          {props.type === "multiple" ? (
            <CheckboxGroup
              value={props.value}
              defaultValue={props.defaultValue}
              onValueChange={(v) => props.onValueChange?.(v as string[])}
              disabled={disabled}
              className={grid}
            >
              {children}
            </CheckboxGroup>
          ) : (
            <RadioGroup
              value={props.value}
              defaultValue={props.defaultValue}
              onValueChange={(v) => props.onValueChange?.(v as string)}
              disabled={disabled}
              name={name}
              aria-invalid={error ? true : undefined}
              className={grid}
            >
              {children}
            </RadioGroup>
          )}
        </div>
      </GroupTypeContext.Provider>
    </FormFieldset>
  );
}

type SelectionCardProps = {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned detail shown before selection, such as a price modifier (CLAUDE.md §13). */
  meta?: ReactNode;
  /** Image or preview above the text, for visual Brief options. */
  media?: ReactNode;
  /** Extra content under the description, such as a deliverables list. */
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
};

function SelectionCard({
  value,
  title,
  description,
  meta,
  media,
  children,
  disabled,
  className,
}: SelectionCardProps) {
  const type = useContext(GroupTypeContext);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = description ? `${id}-description` : undefined;
  const metaId = meta ? `${id}-meta` : undefined;
  const describedBy = [descriptionId, metaId].filter(Boolean).join(" ") || undefined;
  const controlProps = {
    value,
    disabled,
    "aria-labelledby": titleId,
    "aria-describedby": describedBy,
  };

  return (
    <label
      className={cn(
        "group/card relative flex cursor-pointer flex-col overflow-hidden rounded-md border border-border bg-surface",
        "transition-[border-color,box-shadow,background-color] duration-150",
        "hover:border-border-strong",
        "has-data-checked:border-primary has-data-checked:bg-primary-subtle/50 has-data-checked:ring-1 has-data-checked:ring-primary",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
        "has-data-disabled:cursor-not-allowed has-data-disabled:bg-surface-subtle has-data-disabled:hover:border-border",
        className,
      )}
    >
      {media && <div className="border-b border-border bg-surface-subtle">{media}</div>}
      <div className="flex items-start gap-3 p-4">
        <span className="flex h-6 items-center">
          {type === "multiple" ? (
            <CheckboxPrimitive.Root
              {...controlProps}
              className={cn(checkboxStyles, "after:hidden focus-visible:outline-none")}
            >
              <CheckboxPrimitive.Indicator className="flex data-unchecked:hidden">
                <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
              </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
          ) : (
            <RadioPrimitive.Root
              {...controlProps}
              className={cn(radioStyles, "after:hidden focus-visible:outline-none")}
            >
              <RadioPrimitive.Indicator className="size-2 rounded-full bg-primary-foreground data-unchecked:hidden" />
            </RadioPrimitive.Root>
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span
              id={titleId}
              className="text-body-sm font-semibold text-foreground group-has-data-disabled/card:text-foreground-disabled"
            >
              {title}
            </span>
            {meta && (
              <span
                id={metaId}
                className="text-body-sm font-medium text-foreground-secondary tabular-nums"
              >
                {meta}
              </span>
            )}
          </span>
          {description && (
            <span id={descriptionId} className="text-body-sm text-foreground-muted">
              {description}
            </span>
          )}
          {children && <span className="mt-2 flex flex-col gap-2 text-body-sm">{children}</span>}
        </span>
      </div>
    </label>
  );
}

export { SelectionCard, SelectionCardGroup };
export type { SelectionCardGroupProps, SelectionCardProps };
