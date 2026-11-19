"use client";

/**
 * Creative Services (docs/06 §50–52, docs/04 §11, SRV-009–015).
 * Capacity near the heading, search, status filters, and each Service with
 * its contextual actions. Lifecycle changes are SIMULATED in this browser
 * until Phase 8 adds Server Actions; reads come from the repositories.
 */
import {
  ArrowDown,
  ArrowUp,
  Archive,
  ArrowUpDown,
  Copy,
  CopyPlus,
  Eye,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RotateCcw,
  Search,
  TrendingUp,
} from "lucide-react";
import NextLink from "next/link";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ServiceCard } from "@/components/service/service-card";
import { CapacityUsage } from "@/components/subscription/subscription";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { TextLink } from "@/components/ui/text-link";
import { toast } from "@/components/ui/toast";
import { type ServiceLifecycle, effectiveCapacity, usedCapacity } from "@/lib/domain";
import { formatRelative } from "@/lib/format";
import { createLocalStore } from "@/lib/local-store";
import { cn } from "@/lib/utils";
import type { Service, Subscription } from "@/types";
import { isPubliclyVisible } from "./model";

type Overlay = {
  lifecycle?: Record<string, ServiceLifecycle>;
  order?: string[];
  duplicates?: { id: string; fromId: string; createdAt: string }[];
};

const NO_OVERLAY: Overlay = {};

type Filter = "ALL" | ServiceLifecycle | "DISABLED";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PUBLISHED", label: "Published" },
  { id: "DRAFT", label: "Drafts" },
  { id: "UNAVAILABLE", label: "Unavailable" },
  { id: "SUBSCRIPTION_INACTIVE", label: "Subscription inactive" },
  { id: "ARCHIVED", label: "Archived" },
  { id: "DISABLED", label: "Disabled by Modgeto" },
];

function matches(s: Service, f: Filter) {
  if (f === "ALL") return s.lifecycle !== "ARCHIVED";
  if (f === "DISABLED") return s.moderation === "PLATFORM_DISABLED";
  return s.lifecycle === f;
}

export function ServicesScreen({
  services: base,
  subscription,
  creativeId,
  username,
  siteUrl,
  now,
}: {
  services: Service[];
  subscription: Subscription | null;
  creativeId: string;
  username: string;
  siteUrl: string;
  now: string;
}) {
  const store = useMemo(
    () => createLocalStore<Overlay>(`mg-sim-services:${creativeId}`),
    [creativeId],
  );
  const overlay = store.useValue() ?? NO_OVERLAY;
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [reordering, setReordering] = useState(false);
  const [moved, setMoved] = useState("");
  const [archiving, setArchiving] = useState<Service | null>(null);
  const nowDate = useMemo(() => new Date(now), [now]);

  // Apply simulated changes over the repository data.
  const services = useMemo(() => {
    const live = base.map((s) => ({ ...s, lifecycle: overlay.lifecycle?.[s.id] ?? s.lifecycle }));
    const dups = (overlay.duplicates ?? []).flatMap((d) => {
      const from = base.find((s) => s.id === d.fromId);
      return from
        ? [
            {
              ...from,
              id: d.id,
              name: `${from.name} (copy)`,
              slug: `${from.slug}-copy`,
              lifecycle: overlay.lifecycle?.[d.id] ?? ("DRAFT" as const),
              publishedAt: null,
              updatedAt: d.createdAt,
              workSamples: [],
            },
          ]
        : [];
    });
    const order = overlay.order ?? [];
    return [...live, ...dups].sort((a, b) => {
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return a.displayOrder - b.displayOrder;
    });
  }, [base, overlay]);

  const update = (patch: Overlay) => store.write({ ...store.read(), ...patch });
  const setLifecycle = (s: Service, lifecycle: ServiceLifecycle, message: string) => {
    update({ lifecycle: { ...(store.read()?.lifecycle ?? {}), [s.id]: lifecycle } });
    toast.success(message);
  };

  const limit = subscription
    ? effectiveCapacity(subscription.status, subscription.publishedServiceLimit)
    : 1;
  const used = usedCapacity(services);
  const published = services.filter((s) => s.lifecycle === "PUBLISHED");
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.id, services.filter((s) => matches(s, f.id)).length]),
  );
  const q = query.trim().toLowerCase();
  const shown = services.filter(
    (s) => matches(s, filter) && (!q || s.name.toLowerCase().includes(q)),
  );

  const copyLink = async (s: Service) => {
    try {
      await navigator.clipboard.writeText(`${siteUrl}/${username}/${s.slug}`);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const move = (id: string, delta: -1 | 1) => {
    const ids = published.map((s) => s.id);
    const i = ids.indexOf(id);
    const j = i + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    update({ order: ids });
    const name = published[i].name;
    setMoved(`${name} moved to position ${j + 1} of ${ids.length}.`);
    // If the pressed button is now disabled (top or bottom), keep focus on its partner.
    requestAnimationFrame(() => {
      const pressed = document.querySelector<HTMLButtonElement>(
        `[data-move="${id}:${delta < 0 ? "up" : "down"}"]`,
      );
      if (pressed?.disabled)
        document
          .querySelector<HTMLButtonElement>(`[data-move="${id}:${delta < 0 ? "down" : "up"}"]`)
          ?.focus();
    });
  };

  const actionsFor = (s: Service) => {
    const visible = isPubliclyVisible(s);
    const inactive = s.lifecycle === "SUBSCRIPTION_INACTIVE";
    return (
      <>
        {inactive ? (
          // Increase Capacity is the primary recovery action (docs/06 §52).
          <ButtonLink href="/app/creative/subscription" size="sm">
            <TrendingUp aria-hidden="true" />
            Increase Capacity
          </ButtonLink>
        ) : null}
        <ButtonLink href={`/app/creative/services/${s.id}`} size="sm" variant="secondary">
          {/* Icon dropped beside Increase Capacity so both fit one row on phones. */}
          {!inactive && <Pencil aria-hidden="true" />}
          Edit Service
        </ButtonLink>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <IconButton
                size="sm"
                variant="ghost"
                label={`More actions for ${s.name}`}
                icon={<MoreHorizontal />}
                className="ml-auto"
              />
            }
          />
          <DropdownMenuContent align="end" className="w-60">
            {visible && (
              <DropdownMenuItem render={<NextLink href={`/${username}/${s.slug}`} />}>
                <Eye aria-hidden="true" />
                Preview
              </DropdownMenuItem>
            )}
            {visible && (
              <DropdownMenuItem onClick={() => copyLink(s)}>
                <Copy aria-hidden="true" />
                Copy link
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                const id = `local-${crypto.randomUUID()}`;
                update({
                  duplicates: [
                    ...(store.read()?.duplicates ?? []),
                    {
                      id,
                      fromId: s.id.startsWith("local-") ? s.id : s.id,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                });
                toast.success("Duplicated as a Draft", {
                  description: "Clients, Requests and Projects aren't copied.",
                });
              }}
            >
              <CopyPlus aria-hidden="true" />
              Duplicate
            </DropdownMenuItem>
            {s.moderation === "NORMAL" && s.lifecycle === "PUBLISHED" && (
              <DropdownMenuItem
                onClick={() =>
                  setLifecycle(
                    s,
                    "UNAVAILABLE",
                    `${s.name} is paused. It stays on your profile but takes no new Requests.`,
                  )
                }
              >
                <PauseCircle aria-hidden="true" />
                Pause new Requests
              </DropdownMenuItem>
            )}
            {s.moderation === "NORMAL" && s.lifecycle === "UNAVAILABLE" && (
              <DropdownMenuItem
                onClick={() => setLifecycle(s, "PUBLISHED", `${s.name} is taking Requests again.`)}
              >
                <PlayCircle aria-hidden="true" />
                Take Requests again
              </DropdownMenuItem>
            )}
            {s.lifecycle === "ARCHIVED" ? (
              <DropdownMenuItem
                onClick={() => setLifecycle(s, "DRAFT", `${s.name} is a Draft again.`)}
              >
                <RotateCcw aria-hidden="true" />
                Restore as Draft
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setArchiving(s)}>
                  <Archive aria-hidden="true" />
                  Archive
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Services"
        description="Package what you offer. Published Services appear on your profile."
        actions={
          <ButtonLink href="/app/creative/services/new">
            <Plus aria-hidden="true" />
            Create Service
          </ButtonLink>
        }
      />

      {/* Capacity near the heading (docs/04 §11) */}
      <div className="mb-8 flex flex-col gap-3 rounded-xl bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <CapacityUsage used={used} limit={limit} />
        <TextLink
          href="/app/creative/subscription"
          className="self-start text-label sm:self-center"
        >
          {used >= limit ? "Add capacity" : "Manage capacity"}
        </TextLink>
      </div>

      {base.length === 0 ? (
        <EmptyState
          title="Create your first Service"
          description="Packages, pricing, a Brief and your terms, all on one link. Your first Published Service is free."
          actions={
            <ButtonLink href="/app/creative/services/new">
              <Plus aria-hidden="true" />
              Create Service
            </ButtonLink>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {!reordering && (
              <FormField label="Search Services" hideLabel className="lg:w-72">
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground-muted"
                  />
                  <Input
                    type="search"
                    placeholder="Search by name"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </FormField>
            )}
            <div className="flex items-center gap-2 lg:ml-auto">
              {published.length > 1 && (
                <Button
                  variant={reordering ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setReordering((r) => !r)}
                  aria-pressed={reordering}
                >
                  <ArrowUpDown aria-hidden="true" />
                  {reordering ? "Done reordering" : "Reorder"}
                </Button>
              )}
            </div>
          </div>

          {/* Status filters: toggle buttons that scroll on phones */}
          {!reordering && (
            <div
              role="group"
              aria-label="Filter by status"
              className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
            >
              {/* Keep the active filter visible even when its count drops to zero. */}
              {FILTERS.filter((f) => f.id === "ALL" || f.id === filter || counts[f.id] > 0).map(
                (f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-label whitespace-nowrap transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                      filter === f.id
                        ? "border-foreground bg-foreground font-semibold text-surface"
                        : "border-border bg-surface text-foreground-secondary hover:text-foreground",
                    )}
                  >
                    {f.label}
                    <span className="tabular-nums">{counts[f.id]}</span>
                  </button>
                ),
              )}
            </div>
          )}

          {reordering ? (
            // SRV-014: reorder Published Services without drag-and-drop.
            <section
              aria-labelledby="reorder-title"
              className="flex flex-col gap-3 rounded-xl bg-surface p-5"
            >
              <h2 id="reorder-title" className="text-h4 text-foreground">
                Order on your profile
              </h2>
              <ol className="flex flex-col divide-y divide-border">
                {published.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <span className="w-6 text-caption text-foreground-secondary tabular-nums">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-body-sm font-medium text-foreground">
                      {s.name}
                    </span>
                    <IconButton
                      size="sm"
                      variant="secondary"
                      label={`Move ${s.name} up`}
                      icon={<ArrowUp />}
                      disabled={i === 0}
                      data-move={`${s.id}:up`}
                      onClick={() => move(s.id, -1)}
                    />
                    <IconButton
                      size="sm"
                      variant="secondary"
                      label={`Move ${s.name} down`}
                      icon={<ArrowDown />}
                      disabled={i === published.length - 1}
                      data-move={`${s.id}:down`}
                      onClick={() => move(s.id, 1)}
                    />
                  </li>
                ))}
              </ol>
              <p aria-live="polite" className="sr-only">
                {moved}
              </p>
            </section>
          ) : shown.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              icon={<Search />}
              title="No Services match"
              description="Try another name or status."
              actions={
                <Button variant="secondary" onClick={() => (setQuery(""), setFilter("ALL"))}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <ul
              className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
              aria-label="Services"
            >
              {shown.map((s) => (
                <li key={s.id} className="flex">
                  <ServiceCard
                    service={s}
                    href={`/app/creative/services/${s.id}`}
                    headingLevel="h2"
                    className="w-full"
                    manage={{
                      meta: `Updated ${formatRelative(s.updatedAt, nowDate)}`,
                      actions: actionsFor(s),
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={archiving !== null} onOpenChange={(open) => !open && setArchiving(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Archive {archiving?.name}?</DialogTitle>
            <DialogDescription>
              It leaves your profile and stops taking new Requests. Existing Requests and Projects
              continue as normal. You can restore it as a Draft later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Keep Service</Button>} />
            <Button
              variant="destructive"
              onClick={() => {
                if (archiving)
                  setLifecycle(archiving, "ARCHIVED", `${archiving.name} is archived.`);
                setArchiving(null);
              }}
            >
              Archive Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
