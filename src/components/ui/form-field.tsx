"use client";

import { Field } from "@base-ui/react/field";
import { cn } from "@/lib/utils";
import { CircleAlert } from "lucide-react";
import { createContext, useContext, useId, type ReactNode } from "react";

/**
 * FormField contract (docs/07 §22): label, description, required, error and
 * disabled. Base UI Field wires the label, description and error IDs to the
 * control and sets `aria-invalid`; this context adds `aria-required`.
 *
 * Required fields are the default in Modgeto forms, so only optional fields are
 * marked visibly ("Optional"), and required ones carry `aria-required`.
 */
const FieldRequiredContext = createContext(false);

/** Controls call this to pick up the surrounding field's required state. */
function useFieldRequired() {
  return useContext(FieldRequiredContext);
}

type FormFieldProps = {
  label: ReactNode;
  description?: ReactNode;
  error?: string | null;
  required?: boolean;
  /** Shows "Optional" beside the label. */
  optional?: boolean;
  disabled?: boolean;
  name?: string;
  /** Hide the label visually but keep it for assistive technology. */
  hideLabel?: boolean;
  /** `horizontal` puts a checkbox or switch before its label. */
  orientation?: "vertical" | "horizontal";
  className?: string;
  children: ReactNode;
};

function FormField({
  label,
  description,
  error,
  required = false,
  optional = false,
  disabled,
  name,
  hideLabel,
  orientation = "vertical",
  className,
  children,
}: FormFieldProps) {
  const invalid = Boolean(error);
  const labelNode = (
    <Field.Label
      className={cn(
        "text-label text-foreground data-disabled:text-foreground-disabled",
        hideLabel && "sr-only",
        orientation === "horizontal" && "cursor-pointer",
      )}
    >
      {label}
      {optional && (
        <span className="ml-1.5 font-normal text-foreground-muted">
          <span aria-hidden="true">·</span> Optional
        </span>
      )}
    </Field.Label>
  );
  const descriptionNode = description ? (
    <Field.Description className="text-body-sm text-foreground-muted">
      {description}
    </Field.Description>
  ) : null;
  const errorNode = (
    <Field.Error
      match={invalid}
      className="flex items-start gap-1.5 text-body-sm font-medium text-danger"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{error}</span>
    </Field.Error>
  );

  return (
    <FieldRequiredContext.Provider value={required}>
      <Field.Root
        name={name}
        disabled={disabled}
        invalid={invalid}
        className={cn(
          "group/field flex",
          orientation === "vertical" ? "flex-col gap-2" : "flex-row items-start gap-3",
          className,
        )}
      >
        {orientation === "vertical" ? (
          <>
            {labelNode}
            {descriptionNode}
            {children}
            {errorNode}
          </>
        ) : (
          <>
            <div className="flex min-h-6 items-center">{children}</div>
            <div className="flex min-w-0 flex-col gap-1 pt-0.5">
              {labelNode}
              {descriptionNode}
              {errorNode}
            </div>
          </>
        )}
      </Field.Root>
    </FieldRequiredContext.Provider>
  );
}

type FormFieldsetProps = {
  legend: ReactNode;
  description?: ReactNode;
  error?: string | null;
  optional?: boolean;
  hideLegend?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Groups related controls (radio groups, checkbox groups, selection cards)
 * under a `<legend>`. The description and error are linked to the group.
 */
function FormFieldset({
  legend,
  description,
  error,
  optional,
  hideLegend,
  className,
  children,
}: FormFieldsetProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset
      aria-describedby={describedBy}
      data-invalid={error ? "" : undefined}
      className={cn("flex min-w-0 flex-col gap-3", className)}
    >
      <legend className={cn("mb-2 text-label text-foreground", hideLegend && "sr-only")}>
        {legend}
        {optional && (
          <span className="ml-1.5 font-normal text-foreground-muted">
            <span aria-hidden="true">·</span> Optional
          </span>
        )}
      </legend>
      {description && (
        <p id={descriptionId} className="-mt-2 text-body-sm text-foreground-muted">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-body-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}

export { FormField, FormFieldset, useFieldRequired };
export type { FormFieldProps, FormFieldsetProps };
