"use client";

/**
 * Request Submitted (docs/06 §41, §43). Says what happens next, and what
 * submitting did not do. Never "Order confirmed" (CLAUDE.md §13).
 */
import { CircleCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { PageContainer } from "@/components/layout/page";
import { ButtonLink } from "@/components/ui/button";
import { currentIdentity, subscribeIdentity } from "@/features/auth/simulated-auth";
import type { PricingMode } from "@/lib/domain";

export function RequestSubmitted({
  creativeName,
  creativeUsername,
  serviceName,
  pricingMode,
  hasCommitment,
}: {
  creativeName: string;
  creativeUsername: string;
  serviceName: string;
  pricingMode: PricingMode;
  hasCommitment: boolean;
}) {
  const params = useSearchParams();
  const reference = params.get("ref");
  const identity = useSyncExternalStore(subscribeIdentity, currentIdentity, () => null);
  const firstName = creativeName.split(" ")[0];

  const notDone = [
    "start the Project",
    "charge you anything",
    ...(pricingMode === "STARTING_FROM"
      ? ["fix the final price: the estimate is confirmed after review"]
      : []),
    ...(pricingMode === "CUSTOM_QUOTE" ? ["agree a price: you'll review the quote first"] : []),
  ];

  return (
    <PageContainer size="narrow" className="py-10 md:py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-start gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full bg-success-subtle text-success-text"
          >
            <CircleCheck className="size-7" />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-h1 text-foreground">Your Project Request is with {firstName}</h1>
            <p className="text-body-lg text-foreground-secondary">
              {serviceName}
              {reference && (
                <>
                  {" "}
                  · Reference <span className="font-semibold text-foreground">{reference}</span>
                </>
              )}
            </p>
          </div>
          <p className="text-body text-foreground-secondary">
            We&apos;ll email you
            {identity?.email ? (
              <>
                {" "}
                at <span className="font-semibold text-foreground">{identity.email}</span>
              </>
            ) : (
              ""
            )}{" "}
            when {firstName} responds. You can follow it any time from your Requests.
          </p>
        </div>

        <section
          aria-labelledby="next-title"
          className="flex flex-col gap-4 rounded-xl bg-surface p-6"
        >
          <h2 id="next-title" className="text-h4 text-foreground">
            What happens next
          </h2>
          <ol className="flex flex-col gap-3 text-body-sm text-foreground">
            {[
              `${firstName} reviews your Request.`,
              `${firstName} accepts it, or proposes changes or a quote for you to review.`,
              "You agree the scope, price and terms together.",
              hasCommitment
                ? `Payment instructions appear if a commitment is needed. You pay ${firstName} directly.`
                : "No commitment payment is needed for this Service.",
              `${firstName} starts the Project once everything is in place.`,
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-caption font-semibold text-primary-text"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{text}</span>
              </li>
            ))}
          </ol>
          <p className="border-t border-border pt-4 text-body-sm text-foreground-secondary">
            Submitting didn&apos;t {notDone.join(", or ")}. Modgeto does not collect Client Project
            payments.
          </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/app/client/requests" size="lg">
            View your Requests
          </ButtonLink>
          <ButtonLink href={`/${creativeUsername}`} variant="secondary" size="lg">
            Back to {firstName}&apos;s profile
          </ButtonLink>
        </div>
      </div>
    </PageContainer>
  );
}
