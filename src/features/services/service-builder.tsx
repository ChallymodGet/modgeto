"use client";

/**
 * Service Builder (docs/04 §12 and §37, docs/06 §53–58, SRV-002, SRV-016–025).
 * Non-linear: every section is one tap away, with Previous / Continue as a
 * guide. Drafts autosave with a visible status. Edits to a live Service are
 * kept as unpublished changes until Publish changes (D-042).
 *
 * Writes are SIMULATED in this browser until Phase 8 (simulated-services.ts).
 */
import { CircleAlert, Cloud, CloudOff, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { BuilderShell } from "@/components/layout/flow-shells";
import { ServiceStatusBadge } from "@/components/service/service-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import {
  BUILDER_SECTIONS,
  type BuilderSection,
  effectiveCapacity,
  usedCapacity,
} from "@/lib/domain";
import type {
  CreativeProfile,
  PaymentMethod,
  Service,
  ServiceCategory,
  Subscription,
} from "@/types";
import { BriefSectionEditor } from "./brief-builder";
import { SectionBlockers } from "./builder-fields";
import {
  SECTION_META,
  blockersFor,
  hasChanges,
  isBuilderSection,
  sectionProgress,
} from "./builder-model";
import { PublishSection } from "./builder-publish";
import {
  AddOnsOptionsSection,
  BasicsSection,
  type BuilderContext,
  CommitmentPaymentSection,
  DeliveryRevisionsSection,
  PricingSection,
  type SectionProps,
  ScopeSection,
  TermsSection,
  WorkSamplesSection,
} from "./builder-sections";
import {
  markVisited,
  mergeServices,
  savePending,
  saveService,
  useServiceStore,
} from "./simulated-services";

type SaveState = "idle" | "saving" | "saved" | "failed";

const SECTION_COMPONENTS: Record<
  Exclude<BuilderSection, "preview-publish">,
  (p: SectionProps) => ReactNode
> = {
  basics: BasicsSection,
  pricing: PricingSection,
  scope: ScopeSection,
  "addons-options": AddOnsOptionsSection,
  "delivery-revisions": DeliveryRevisionsSection,
  brief: BriefSectionEditor,
  terms: TermsSection,
  "commitment-payment": CommitmentPaymentSection,
  "work-samples": WorkSamplesSection,
};

const subscribeNothing = () => () => {};

type Props = {
  serviceId: string;
  /** The repository version, or null for a Service created in this browser. */
  base: Service | null;
  /** All of the Creative's Services from the repository, for capacity and slugs. */
  creativeServices: Service[];
  creative: CreativeProfile;
  categories: ServiceCategory[];
  paymentMethods: PaymentMethod[];
  subscription: Subscription | null;
  siteUrl: string;
};

export function ServiceBuilder(props: Props) {
  const { value, store } = useServiceStore(props.creative.userId);
  // The store only exists in the browser: wait for it before reading the draft.
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const live = value.saved?.[props.serviceId] ?? props.base;

  if (!mounted) return <BuilderSkeleton />;
  if (!live) {
    return (
      <EmptyState
        headingLevel="h1"
        title="We can't find this Service"
        description="It may have been created on another device. Drafts are kept on this device until accounts are connected."
        actions={<ButtonLink href="/app/creative/services">Back to Services</ButtonLink>}
      />
    );
  }
  const pending = value.pending?.[props.serviceId] ?? null;
  return (
    <BuilderEditor
      key={props.serviceId}
      {...props}
      live={live}
      initial={pending ?? live}
      store={store}
      visited={value.visited?.[props.serviceId] ?? []}
      allServices={mergeServices(props.creativeServices, value)}
    />
  );
}

function BuilderSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading the Service Builder"
      className="flex flex-col gap-6 p-6"
    >
      <div className="h-10 w-64 animate-pulse rounded-md bg-surface-subtle motion-reduce:animate-none" />
      <div className="h-96 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none" />
    </div>
  );
}

function BuilderEditor({
  serviceId,
  creative,
  categories,
  paymentMethods,
  subscription,
  siteUrl,
  live,
  initial,
  store,
  visited,
  allServices,
}: Props & {
  live: Service;
  initial: Service;
  store: ReturnType<typeof useServiceStore>["store"];
  visited: string[];
  allServices: Service[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("section");
  const section: BuilderSection = isBuilderSection(requested) ? requested : "basics";

  const [draft, setDraft] = useState<Service>(initial);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(draft);
  const isLive = live.lifecycle !== "DRAFT" && live.lifecycle !== "ARCHIVED";

  // ---- Autosave (SRV-002) -------------------------------------------------
  const persist = useCallback(
    (service: Service) => {
      const ok = isLive
        ? savePending(store, hasChanges(service, live) ? service : null, service.id)
        : saveService(store, { ...service, updatedAt: new Date().toISOString() });
      setSaveState(ok ? "saved" : "failed");
      return ok;
    },
    [isLive, live, store],
  );

  const update = useCallback(
    (fn: (s: Service) => Service) => {
      setDraft((current) => {
        const next = fn(current);
        latest.current = next;
        return next;
      });
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        persist(latest.current);
      }, 600);
    },
    [persist],
  );

  // Save straight away when leaving the page, so nothing typed is lost.
  useEffect(() => {
    const flush = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        persist(latest.current);
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [persist]);

  // ---- Section navigation -------------------------------------------------
  const href = useCallback(
    (s: BuilderSection) => `/app/creative/services/${serviceId}?section=${s}`,
    [serviceId],
  );
  const firstRender = useRef(true);
  useEffect(() => {
    markVisited(store, serviceId, section);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // Move focus to the new section's heading for keyboard and screen reader users.
    document.getElementById("builder-section-title")?.focus();
  }, [section, serviceId, store]);

  // ---- Derived state ------------------------------------------------------
  const blockers = useMemo(() => blockersFor(draft, creative), [draft, creative]);
  const progress = sectionProgress(draft, blockers, [...visited, section]);
  const others = allServices.filter((s) => s.id !== serviceId);
  const takenSlugs = others.map((s) => s.slug).filter(Boolean);
  const limit = subscription
    ? effectiveCapacity(subscription.status, subscription.publishedServiceLimit)
    : 1;
  const used = usedCapacity(allServices);
  const hasFreeSlot = usedCapacity(others) < limit;
  const pendingChanges = isLive && hasChanges(draft, live);
  const index = BUILDER_SECTIONS.indexOf(section);
  const prev = BUILDER_SECTIONS[index - 1];
  const next = BUILDER_SECTIONS[index + 1];

  const ctx: BuilderContext = {
    creative,
    categories,
    paymentMethods,
    takenSlugs,
    siteHost: new URL(siteUrl).host,
  };

  // ---- Lifecycle actions (simulated) --------------------------------------
  const commit = (service: Service, message: string, action?: { label: string; href: string }) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const ok = saveService(store, service) && savePending(store, null, service.id);
    if (!ok) {
      setSaveState("failed");
      toast.error("Couldn't save. Check your connection and try again.");
      return;
    }
    setDraft(service);
    latest.current = service;
    setSaveState("saved");
    toast.success(
      message,
      action
        ? { action: { label: action.label, onClick: () => router.push(action.href) } }
        : undefined,
    );
  };
  const now = () => new Date().toISOString();
  const publicHref = `/${creative.username}/${draft.slug}`;

  const actions = {
    publish: () =>
      commit(
        { ...draft, lifecycle: "PUBLISHED", publishedAt: now(), updatedAt: now() },
        `${draft.name} is published. Clients can send Requests now.`,
        { label: "View", href: publicHref },
      ),
    publishChanges: () => {
      const termsChanged = draft.terms.content !== live.terms.content;
      commit(
        {
          ...draft,
          lifecycle: live.lifecycle,
          publishedAt: live.publishedAt,
          updatedAt: now(),
          // Material Terms changes create a new version; submitted Requests keep theirs.
          terms: termsChanged
            ? { content: draft.terms.content, version: live.terms.version + 1, updatedAt: now() }
            : live.terms,
        },
        "Your changes are live. Requests already submitted keep their original details.",
      );
    },
    discardChanges: () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      savePending(store, null, serviceId);
      setDraft(live);
      latest.current = live;
      toast.success("Changes discarded");
    },
    unpublish: () =>
      commit(
        { ...draft, ...{ lifecycle: "DRAFT" as const }, updatedAt: now() },
        `${draft.name} is a Draft again. Your published slot is free.`,
      ),
    restore: () =>
      commit({ ...draft, lifecycle: "DRAFT", updatedAt: now() }, `${draft.name} is a Draft again.`),
  };

  // ---- Render -------------------------------------------------------------
  const Section = section === "preview-publish" ? null : SECTION_COMPONENTS[section];
  const sectionBlockers = blockers.filter((b) => b.section === section);

  return (
    <BuilderShell
      title={draft.name.trim() || "Untitled Service"}
      back={{ href: "/app/creative/services", label: "Services" }}
      status={
        <span className="flex flex-wrap items-center gap-3">
          <ServiceStatusBadge service={draft} />
          <SaveStatus
            state={saveState}
            pendingChanges={pendingChanges}
            onRetry={() => persist(latest.current)}
          />
        </span>
      }
      actions={
        section !== "preview-publish" && (
          <ButtonLink href={href("preview-publish")} variant="secondary">
            {isLive ? "Review changes" : "Preview and Publish"}
          </ButtonLink>
        )
      }
      sections={BUILDER_SECTIONS.map((s) => ({
        href: href(s),
        label: SECTION_META[s].label,
        progress: s === "preview-publish" ? undefined : progress[s],
      }))}
      currentHref={href(section)}
      previous={prev ? { href: href(prev), label: "Previous" } : undefined}
      next={next ? { href: href(next), label: "Continue" } : undefined}
    >
      <div className="flex flex-col gap-2">
        <h2
          id="builder-section-title"
          tabIndex={-1}
          className="text-h3 text-foreground outline-none"
        >
          {SECTION_META[section].label}
        </h2>
        <p className="text-body text-foreground-secondary">{SECTION_META[section].description}</p>
      </div>
      {Section ? (
        <>
          {visited.includes(section) && <SectionBlockers blockers={sectionBlockers} />}
          <Section service={draft} update={update} blockers={sectionBlockers} ctx={ctx} />
        </>
      ) : (
        <PublishSection
          service={draft}
          creative={creative}
          blockers={blockers}
          progress={progress}
          hasPendingChanges={pendingChanges}
          hasFreeSlot={hasFreeSlot}
          capacity={{ used, limit }}
          sectionHref={href}
          publicHref={publicHref}
          returnHref={href("preview-publish")}
          actions={actions}
        />
      )}
    </BuilderShell>
  );
}

function SaveStatus({
  state,
  pendingChanges,
  onRetry,
}: {
  state: SaveState;
  pendingChanges: boolean;
  onRetry: () => void;
}) {
  return (
    <span
      aria-live="polite"
      className="flex items-center gap-1.5 text-caption text-foreground-secondary"
    >
      {state === "saving" && (
        <>
          <LoaderCircle
            aria-hidden="true"
            className="size-3.5 animate-spin motion-reduce:animate-none"
          />
          Saving
        </>
      )}
      {state === "saved" && (
        <>
          <Cloud aria-hidden="true" className="size-3.5" />
          {pendingChanges ? "Saved as unpublished changes" : "Saved"}
        </>
      )}
      {state === "idle" && pendingChanges && (
        <>
          <CircleAlert aria-hidden="true" className="size-3.5" />
          Unpublished changes
        </>
      )}
      {state === "failed" && (
        <>
          <CloudOff aria-hidden="true" className="size-3.5 text-danger" />
          <span className="font-medium text-danger">Couldn&apos;t save</span>
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </>
      )}
    </span>
  );
}
