"use client";

/**
 * Preview and Publish (docs/06 §58, SRV-004–006, SRV-009, D-005). A readiness
 * checklist whose blockers link straight to the section that fixes them,
 * three previews, and the lifecycle action that fits the Service's state.
 */
import { Check, CircleAlert, Eye, ListChecks, Settings2, TrendingUp } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";
import {
  AddOnSelector,
  DeliveryOptionSelector,
  OptionGroup,
  PackageSelector,
  QuantityControl,
} from "@/components/service/configuration";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PriceSummary } from "@/features/requests/price-summary";
import { initialSelection } from "@/features/requests/configuration-steps";
import {
  BUILDER_SECTIONS,
  type BuilderSection,
  type PublishBlocker,
  type Selection,
} from "@/lib/domain";
import type { SectionProgress } from "@/components/ui/section-navigation";
import type { CreativeProfile, Service } from "@/types";
import { BriefPreview } from "./brief-builder";
import { BuilderBlock } from "./builder-fields";
import { SECTION_META } from "./builder-model";
import { serviceCommitmentBps } from "./model";
import { ServiceDetail } from "./service-detail";

type Preview = "page" | "configuration" | "brief" | null;

/** Client configuration preview: the real selectors with throwaway state. */
function ConfigurationPreview({
  service,
  creative,
  onClose,
}: {
  service: Service;
  creative: CreativeProfile;
  onClose: () => void;
}) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(service));
  const activeAddOns = service.addOns.filter((a) => a.active);
  const pkg = service.packages.find((p) => p.id === selection.packageId);
  const addOns = pkg?.eligibleAddOnIds
    ? activeAddOns.filter((a) => pkg.eligibleAddOnIds!.includes(a.id))
    : activeAddOns;
  const nothingToChoose =
    service.packages.length === 0 &&
    service.quantityRules.length === 0 &&
    activeAddOns.length === 0 &&
    service.optionGroups.length === 0 &&
    service.deliveryOptions.length < 2;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="lg">
        <SheetHeader>
          <SheetTitle>Configuration preview</SheetTitle>
          <SheetDescription>
            The choices Clients make, with the live price. Nothing is saved.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-8">
          {nothingToChoose && (
            <p className="text-body-sm text-foreground-secondary">
              There&apos;s nothing to choose: Clients go straight to the Brief.
            </p>
          )}
          {service.pricingMode === "PACKAGE" && service.packages.length > 0 && (
            <PackageSelector
              packages={service.packages}
              deliverables={service.deliverables}
              currency={service.currency}
              value={selection.packageId ?? null}
              onValueChange={(packageId) => setSelection((s) => ({ ...s, packageId }))}
            />
          )}
          {service.quantityRules.map((rule) => (
            <QuantityControl
              key={rule.id}
              rule={rule}
              currency={service.currency}
              value={selection.quantities?.[rule.id] ?? rule.defaultQuantity}
              onValueChange={(q) =>
                setSelection((s) => ({ ...s, quantities: { ...s.quantities, [rule.id]: q } }))
              }
            />
          ))}
          {addOns.length > 0 && (
            <AddOnSelector
              addOns={addOns}
              currency={service.currency}
              value={{ ...selection.addOns }}
              onValueChange={(value) => setSelection((s) => ({ ...s, addOns: value }))}
            />
          )}
          {service.optionGroups.map((group) => (
            <OptionGroup
              key={group.id}
              group={group}
              currency={service.currency}
              value={selection.options?.[group.id] ?? []}
              onValueChange={(ids) =>
                setSelection((s) => ({ ...s, options: { ...s.options, [group.id]: ids } }))
              }
            />
          ))}
          {service.deliveryOptions.length > 1 && (
            <DeliveryOptionSelector
              options={service.deliveryOptions}
              currency={service.currency}
              value={selection.deliveryOptionId ?? null}
              onValueChange={(id) => setSelection((s) => ({ ...s, deliveryOptionId: id }))}
            />
          )}
          <div className="rounded-xl border border-border p-5">
            <PriceSummary
              service={service}
              selection={selection}
              commitmentBps={serviceCommitmentBps(service, creative)}
              creativeName={creative.displayName}
            />
          </div>
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

function PagePreview({
  service,
  creative,
  onClose,
}: {
  service: Service;
  creative: CreativeProfile;
  onClose: () => void;
}) {
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="lg" className="md:max-w-none">
        <SheetHeader>
          <SheetTitle>Service page preview</SheetTitle>
          <SheetDescription>How the public page will look. Links are not live.</SheetDescription>
        </SheetHeader>
        <SheetBody className="bg-background p-0">
          <div inert>
            <ServiceDetail
              creative={creative}
              service={service}
              configureHref={null}
              commitmentBps={serviceCommitmentBps(service, creative)}
              preview
            />
          </div>
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

export type PublishActions = {
  publish: () => void;
  publishChanges: () => void;
  discardChanges: () => void;
  unpublish: () => void;
  restore: () => void;
};

export function PublishSection({
  service,
  creative,
  blockers,
  progress,
  hasPendingChanges,
  hasFreeSlot,
  capacity,
  sectionHref,
  publicHref,
  returnHref,
  actions,
}: {
  service: Service;
  creative: CreativeProfile;
  blockers: readonly PublishBlocker[];
  progress: Record<string, SectionProgress | undefined>;
  hasPendingChanges: boolean;
  hasFreeSlot: boolean;
  capacity: { used: number; limit: number };
  sectionHref: (s: BuilderSection) => string;
  publicHref: string;
  /** Where Increase Capacity returns to (this section). */
  returnHref: string;
  actions: PublishActions;
}) {
  const [preview, setPreview] = useState<Preview>(null);
  const [capacityOpen, setCapacityOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [triedPublish, setTriedPublish] = useState(false);
  const ready = blockers.length === 0;
  const lifecycle = service.lifecycle;
  const disabled = service.moderation === "PLATFORM_DISABLED";
  const live = lifecycle === "PUBLISHED" || lifecycle === "UNAVAILABLE";
  const subscriptionHref = `/app/creative/subscription?returnTo=${encodeURIComponent(returnHref)}`;

  const tryPublish = () => {
    setTriedPublish(true);
    if (!ready) {
      document.getElementById("readiness")?.focus();
      return;
    }
    if (!hasFreeSlot) {
      setCapacityOpen(true);
      return;
    }
    actions.publish();
  };

  const tryPublishChanges = () => {
    setTriedPublish(true);
    if (!ready) {
      document.getElementById("readiness")?.focus();
      return;
    }
    actions.publishChanges();
  };

  return (
    <>
      {/* The action that fits the Service's state */}
      <BuilderBlock title={live ? "Changes" : "Publish"}>
        {disabled ? (
          <p className="text-body-sm text-foreground-secondary">
            Modgeto has disabled this Service, so it can&apos;t be published. Check your email for
            the reason, or contact support.
          </p>
        ) : lifecycle === "DRAFT" ? (
          <>
            <p className="text-body-sm text-foreground-secondary">
              Publishing puts this Service on your profile and lets Clients send Requests. It uses{" "}
              {capacity.limit - capacity.used > 1
                ? `one of your ${capacity.limit - capacity.used} free published slots`
                : capacity.limit - capacity.used === 1
                  ? "your last free published slot"
                  : "a published slot, and all of yours are in use"}
              .
            </p>
            <Button className="self-start" onClick={tryPublish}>
              Publish Service
            </Button>
            {triedPublish && !ready && (
              <p role="alert" className="text-body-sm font-medium text-danger">
                Fix the items below before publishing.
              </p>
            )}
          </>
        ) : live ? (
          <>
            <p className="text-body-sm text-foreground-secondary">
              {hasPendingChanges
                ? "You have unpublished changes. Clients still see the live version. Requests already submitted keep their original details."
                : "Everything you've saved is live. Edits are kept as unpublished changes until you publish them."}
            </p>
            <div className="flex flex-wrap gap-2">
              {hasPendingChanges && <Button onClick={tryPublishChanges}>Publish changes</Button>}
              {hasPendingChanges && (
                <Button variant="secondary" onClick={actions.discardChanges}>
                  Discard changes
                </Button>
              )}
              <ButtonLink href={publicHref} variant="secondary">
                <Eye aria-hidden="true" />
                View public page
              </ButtonLink>
              <Button variant="ghost" onClick={() => setUnpublishOpen(true)}>
                Unpublish
              </Button>
            </div>
            {triedPublish && !ready && (
              <p role="alert" className="text-body-sm font-medium text-danger">
                Fix the items below before publishing your changes.
              </p>
            )}
          </>
        ) : lifecycle === "SUBSCRIPTION_INACTIVE" ? (
          <>
            <p className="text-body-sm text-foreground-secondary">
              This Service is inactive because it&apos;s over your capacity. Clients see it as
              unavailable. Your existing Requests and Projects continue as normal.
            </p>
            <ButtonLink href={subscriptionHref} className="self-start">
              <TrendingUp aria-hidden="true" />
              Increase Capacity
            </ButtonLink>
          </>
        ) : (
          <>
            <p className="text-body-sm text-foreground-secondary">
              This Service is archived. Restore it as a Draft to edit and publish it again.
            </p>
            <Button className="self-start" onClick={actions.restore}>
              Restore as Draft
            </Button>
          </>
        )}
      </BuilderBlock>

      {/* Readiness checklist (docs/06 §58) */}
      <section
        id="readiness"
        tabIndex={-1}
        aria-labelledby="readiness-title"
        className="flex flex-col gap-4 rounded-xl bg-surface p-5 outline-none focus-visible:outline-2 focus-visible:outline-focus md:p-6"
      >
        <div className="flex items-center gap-2">
          <ListChecks aria-hidden="true" className="size-5 text-foreground-muted" />
          <h3 id="readiness-title" className="text-h4 text-foreground">
            {ready ? "Ready to publish" : "Before you can publish"}
          </h3>
        </div>
        <ul className="flex flex-col divide-y divide-border">
          {BUILDER_SECTIONS.filter((s) => s !== "preview-publish").map((section) => {
            const problems = blockers.filter((b) => b.section === section);
            return (
              <li key={section} className="flex items-start gap-3 py-3">
                {problems.length ? (
                  <CircleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-warning-text"
                  />
                ) : (
                  <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-body-sm font-medium text-foreground">
                    {SECTION_META[section].label}
                    {progress[section] === "optional" && (
                      <span className="ml-1.5 font-normal text-foreground-muted">
                        <span aria-hidden="true">·</span> Optional
                      </span>
                    )}
                    <span className="sr-only">
                      {problems.length ? ": needs attention" : ": ready"}
                    </span>
                  </span>
                  {problems.length > 0 && (
                    <ul className="text-body-sm text-foreground-secondary">
                      {problems.map((p, i) => (
                        <li key={`${p.code}-${p.target ?? i}`}>{p.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {problems.length > 0 && (
                  <NextLink
                    href={sectionHref(section)}
                    className="shrink-0 rounded-sm text-label text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Fix<span className="sr-only"> {SECTION_META[section].label}</span>
                  </NextLink>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Previews (SRV-006) */}
      <BuilderBlock
        title="Preview"
        description={
          service.brief.sections.length > 0
            ? "See the Service as a Client would, on any screen size."
            : "See the Service as a Client would. Add a Brief to preview it here too."
        }
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setPreview("page")}>
            <Eye aria-hidden="true" />
            Service page
          </Button>
          <Button variant="secondary" onClick={() => setPreview("configuration")}>
            <Settings2 aria-hidden="true" />
            Configuration
          </Button>
          {service.brief.sections.length > 0 && (
            <Button variant="secondary" onClick={() => setPreview("brief")}>
              <ListChecks aria-hidden="true" />
              Brief
            </Button>
          )}
        </div>
      </BuilderBlock>

      {preview === "page" && (
        <PagePreview service={service} creative={creative} onClose={() => setPreview(null)} />
      )}
      {preview === "configuration" && (
        <ConfigurationPreview
          service={service}
          creative={creative}
          onClose={() => setPreview(null)}
        />
      )}
      {preview === "brief" && (
        <BriefPreview brief={service.brief} onClose={() => setPreview(null)} />
      )}

      {/* Capacity-blocked publish (SRV-004, docs/05) */}
      <Dialog open={capacityOpen} onOpenChange={setCapacityOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>All your published slots are in use</DialogTitle>
            <DialogDescription>
              You&apos;re using {capacity.used} of {capacity.limit}. Increase your capacity to
              publish this Service, or unpublish another one first. This draft is saved and
              you&apos;ll come back here.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Keep as Draft</Button>} />
            <ButtonLink href={subscriptionHref}>
              <TrendingUp aria-hidden="true" />
              Increase Capacity
            </ButtonLink>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish returns to Draft and frees the slot (D-005, SRV-009) */}
      <Dialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Unpublish {service.name}?</DialogTitle>
            <DialogDescription>
              It leaves your profile, stops taking new Requests and frees a published slot. It
              becomes a Draft you can publish again. Existing Requests and Projects continue as
              normal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Keep it live</Button>} />
            <Button
              onClick={() => {
                setUnpublishOpen(false);
                actions.unpublish();
              }}
            >
              Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
