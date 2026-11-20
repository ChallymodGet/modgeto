"use client";

/**
 * Public Profile management (docs/04 §14, PROF-002, PUB-003–008).
 * Controls Client-visible content only: public information, availability,
 * links, selected work, Service order and sharing. Account details live in
 * Settings. Saves are SIMULATED in this browser until Phase 8.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { PageContainer, PageHeader, Panel } from "@/components/layout/page";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { creativeLinkSchema, creativeProfileSchema } from "@/lib/schemas";
import { optionalText } from "@/lib/schemas/common";
import type {
  CreativeLinkType,
  CreativeProfile,
  Discipline,
  PaymentMethod,
  Service,
} from "@/types";
import { isPubliclyVisible } from "@/features/services/model";
import { setOrder, useMergedServices } from "@/features/services/simulated-services";
import { AvailabilityRadio, DisciplineCheckboxes, LINK_TYPES, SaveRow } from "./profile-fields";
import { CreativePublicProfile } from "./public-profile";
import { ShareLink } from "./share-link";
import { useMounted } from "@/lib/use-mounted";
import { useCreativeProfile } from "./simulated-profile";

const saved = (ok: boolean, message: string) =>
  ok ? toast.success(message) : toast.error("Couldn't save. Check your connection and try again.");

// ------------------------------------------------------------- public info

const infoSchema = creativeProfileSchema.omit({ username: true }).extend({
  about: optionalText(600),
  disciplines: z.array(z.string()),
});

function PublicInformation({
  creative,
  onSave,
}: {
  creative: CreativeProfile;
  onSave: (v: z.output<typeof infoSchema>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      displayName: creative.displayName,
      professionalTitle: creative.professionalTitle,
      introduction: creative.introduction,
      about: creative.about ?? "",
      location: creative.location ?? "",
      disciplines: [...creative.disciplines],
    },
  });
  return (
    <Panel
      id="information"
      headingLevel="h2"
      title="Public information"
      description="Your name and introduction appear at the top of your profile. Your email and phone are never shown."
    >
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit((v) => {
          onSave(v);
          form.reset(form.getValues());
        })}
      >
        <div className="flex items-center gap-4">
          <Avatar name={creative.displayName} src={creative.avatarUrl} size="lg" />
          <p className="text-body-sm text-foreground-secondary">
            You&apos;ll be able to add a photo soon. Until then, Clients see your initials.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="displayName"
            render={({ field, fieldState }) => (
              <FormField label="Display name" required error={fieldState.error?.message}>
                <Input {...field} autoComplete="name" maxLength={60} />
              </FormField>
            )}
          />
          <Controller
            control={form.control}
            name="professionalTitle"
            render={({ field, fieldState }) => (
              <FormField
                label="Professional title"
                required
                description="For example: Brand and UI Designer."
                error={fieldState.error?.message}
              >
                <Input {...field} maxLength={80} />
              </FormField>
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="introduction"
          render={({ field, fieldState }) => (
            <FormField
              label="Short introduction"
              required
              description="One or two sentences about who you help and how."
              error={fieldState.error?.message}
            >
              <Textarea {...field} rows={3} maxLength={160} showCount />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="about"
          render={({ field, fieldState }) => (
            <FormField
              label="About"
              optional
              description="A little more about how you work."
              error={fieldState.error?.message}
            >
              <Textarea {...field} value={field.value ?? ""} rows={4} maxLength={600} showCount />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="location"
          render={({ field, fieldState }) => (
            <FormField
              label="Location"
              optional
              description="City and country."
              error={fieldState.error?.message}
            >
              <Input
                {...field}
                value={field.value ?? ""}
                autoComplete="address-level2"
                className="sm:max-w-sm"
              />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="disciplines"
          render={({ field }) => (
            <DisciplineCheckboxes value={field.value} onChange={field.onChange} />
          )}
        />
        <SaveRow dirty={form.formState.isDirty}>Save public information</SaveRow>
      </form>
    </Panel>
  );
}

// ------------------------------------------------------------- availability

const availabilitySchema = z.object({
  availability: z.enum(["AVAILABLE", "LIMITED", "UNAVAILABLE"]),
  availabilityNote: optionalText(120),
});

function AvailabilityPanel({
  creative,
  onSave,
}: {
  creative: CreativeProfile;
  onSave: (v: z.output<typeof availabilitySchema>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      availability: creative.availability,
      availabilityNote: creative.availabilityNote ?? "",
    },
  });
  const availability = useWatch({ control: form.control, name: "availability" });
  return (
    <Panel id="availability" headingLevel="h2" title="Availability">
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit((v) => {
          onSave(v);
          form.reset(form.getValues());
        })}
      >
        <Controller
          control={form.control}
          name="availability"
          render={({ field }) => (
            <AvailabilityRadio
              legend="Are you taking new Projects?"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {availability === "LIMITED" && (
          <Controller
            control={form.control}
            name="availabilityNote"
            render={({ field, fieldState }) => (
              <FormField
                label="Note for Clients"
                optional
                description="For example: Booking projects that start from December."
                error={fieldState.error?.message}
              >
                <Input {...field} value={field.value ?? ""} maxLength={120} />
              </FormField>
            )}
          />
        )}
        <SaveRow dirty={form.formState.isDirty}>Save availability</SaveRow>
      </form>
    </Panel>
  );
}

// ------------------------------------------------------------- links

const linksSchema = z.object({
  links: z.array(creativeLinkSchema).max(5, { error: "Add up to five links." }),
});

function LinksPanel({
  creative,
  onSave,
}: {
  creative: CreativeProfile;
  onSave: (v: z.output<typeof linksSchema>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(linksSchema),
    defaultValues: {
      links: [...creative.links]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((l) => ({ type: l.type, url: l.url, label: l.label ?? "" })),
    },
  });
  const links = useFieldArray({ control: form.control, name: "links" });

  const moveAndFocus = (from: number, to: number, which: "up" | "down") => {
    links.move(from, to);
    requestAnimationFrame(() => {
      const row = document.querySelector(`[data-link-row="${to}"]`);
      const target = row?.querySelector<HTMLButtonElement>(`[data-move="${which}"]`);
      (target && !target.disabled
        ? target
        : row?.querySelector<HTMLButtonElement>("[data-move]:not(:disabled)")
      )?.focus();
    });
  };

  return (
    <Panel
      id="links"
      headingLevel="h2"
      title="Professional links"
      description="Your portfolio and profiles elsewhere. Up to five, in the order shown."
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) => {
          onSave(v);
          form.reset(form.getValues());
        })}
      >
        {links.fields.length === 0 && (
          <p className="text-body-sm text-foreground-secondary">
            No links yet. A portfolio link helps Clients see more of your work.
          </p>
        )}
        <ol className="flex flex-col gap-3">
          {links.fields.map((item, i) => (
            <li
              key={item.id}
              data-link-row={i}
              className="flex flex-col gap-3 rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-1">
                <span className="min-w-0 flex-1 text-label text-foreground">Link {i + 1}</span>
                <IconButton
                  size="sm"
                  label={`Move link ${i + 1} up`}
                  icon={<ArrowUp />}
                  data-move="up"
                  disabled={i === 0}
                  onClick={() => moveAndFocus(i, i - 1, "up")}
                />
                <IconButton
                  size="sm"
                  label={`Move link ${i + 1} down`}
                  icon={<ArrowDown />}
                  data-move="down"
                  disabled={i === links.fields.length - 1}
                  onClick={() => moveAndFocus(i, i + 1, "down")}
                />
                <IconButton
                  size="sm"
                  label={`Remove link ${i + 1}`}
                  icon={<Trash2 />}
                  onClick={() => links.remove(i)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <Controller
                  control={form.control}
                  name={`links.${i}.type`}
                  render={({ field }) => (
                    <FormField label={`Link ${i + 1} type`}>
                      <Select
                        items={LINK_TYPES}
                        value={field.value}
                        onValueChange={(v) => field.onChange(v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LINK_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}
                />
                <Controller
                  control={form.control}
                  name={`links.${i}.url`}
                  render={({ field, fieldState }) => (
                    <FormField label={`Link ${i + 1} address`} error={fieldState.error?.message}>
                      <Input {...field} type="url" inputMode="url" placeholder="https://" />
                    </FormField>
                  )}
                />
              </div>
              <Controller
                control={form.control}
                name={`links.${i}.label`}
                render={({ field, fieldState }) => (
                  <FormField
                    label={`Link ${i + 1} label`}
                    optional
                    description="Shown instead of the type."
                    error={fieldState.error?.message}
                  >
                    <Input {...field} value={field.value ?? ""} maxLength={40} />
                  </FormField>
                )}
              />
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {links.fields.length < 5 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => links.append({ type: "PORTFOLIO", url: "", label: "" })}
            >
              <Plus aria-hidden="true" />
              Add a link
            </Button>
          )}
          <SaveRow dirty={form.formState.isDirty}>Save links</SaveRow>
        </div>
      </form>
    </Panel>
  );
}

// ------------------------------------------------------------- screen

export function ProfileManager({
  creative: baseCreative,
  paymentMethods: baseMethods,
  services: baseServices,
  siteUrl,
}: {
  creative: CreativeProfile;
  paymentMethods: PaymentMethod[];
  services: Service[];
  siteUrl: string;
}) {
  const { creative, saveProfile } = useCreativeProfile(baseCreative, baseMethods);
  const { services, store } = useMergedServices(baseServices, creative.userId);
  const [previewing, setPreviewing] = useState(false);
  const profileUrl = `${siteUrl}/${creative.username}`;
  const publicServices = services.filter(isPubliclyVisible);
  const published = services.filter((s) => s.lifecycle === "PUBLISHED");
  const withSamples = publicServices.filter((s) => s.workSamples.length > 0);
  const [moved, setMoved] = useState("");
  const mounted = useMounted();

  const move = (index: number, delta: -1 | 1) => {
    const ids = published.map((s) => s.id);
    const j = index + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    setOrder(store, ids);
    setMoved(`${published[index].name} moved to position ${j + 1} of ${ids.length}.`);
    const id = published[index].id;
    requestAnimationFrame(() => {
      const row = document.querySelector(`[data-service-row="${id}"]`);
      const active = document.activeElement as HTMLButtonElement | null;
      if (!active || active.disabled || active === document.body)
        row?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Public Profile"
        description="What Clients see at your link. Account details are in Settings."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPreviewing(true)}>
              <Eye aria-hidden="true" />
              Preview
            </Button>
            <ShareLink url={profileUrl} />
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        <p className="flex flex-wrap items-center gap-x-2 text-body-sm text-foreground-secondary">
          Your link:
          <NextLink
            href={`/${creative.username}`}
            className="font-medium text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {profileUrl.replace(/^https?:\/\//, "")}
          </NextLink>
        </p>

        {!mounted ? (
          <div
            aria-busy="true"
            aria-label="Loading your profile"
            className="h-96 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
          />
        ) : (
          <>
            <PublicInformation
              creative={creative}
              onSave={(v) =>
                saved(
                  saveProfile({
                    displayName: v.displayName,
                    professionalTitle: v.professionalTitle,
                    introduction: v.introduction,
                    about: v.about,
                    location: v.location ?? null,
                    disciplines: v.disciplines as Discipline[],
                  }),
                  "Public information saved",
                )
              }
            />

            <AvailabilityPanel
              creative={creative}
              onSave={(v) =>
                saved(
                  saveProfile({
                    availability: v.availability,
                    availabilityNote: v.availability === "LIMITED" ? v.availabilityNote : null,
                  }),
                  v.availability === "UNAVAILABLE"
                    ? "You're unavailable. New Requests are paused; existing ones carry on."
                    : "Availability saved",
                )
              }
            />

            <LinksPanel
              creative={creative}
              onSave={(v) =>
                saved(
                  saveProfile({
                    links: v.links.map((l, i) => ({
                      id: `link-${i + 1}`,
                      type: l.type as CreativeLinkType,
                      label: l.label,
                      url: l.url,
                      displayOrder: i + 1,
                    })),
                  }),
                  "Links saved",
                )
              }
            />
          </>
        )}

        {/* Selected work comes from Services (PUB-007: not a portfolio CMS). */}
        <Panel
          id="work"
          headingLevel="h2"
          title="Selected work"
          description="Work samples from your live Services appear on your profile. Edit them in each Service."
        >
          {withSamples.length === 0 ? (
            <p className="text-body-sm text-foreground-secondary">
              No work samples yet. Add some in a Service&apos;s Work Samples section and
              they&apos;ll show here.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {withSamples.map((s) => (
                <li key={s.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-body-sm font-medium text-foreground">{s.name}</span>
                    <span className="flex items-center gap-1.5 text-caption text-foreground-secondary">
                      <ImageIcon aria-hidden="true" className="size-3.5" />
                      {s.workSamples.length} {s.workSamples.length === 1 ? "sample" : "samples"}:{" "}
                      {s.workSamples.map((w) => w.title).join(", ")}
                    </span>
                  </div>
                  <ButtonLink
                    href={`/app/creative/services/${s.id}?section=work-samples`}
                    variant="ghost"
                    size="sm"
                    className="self-start sm:self-auto"
                  >
                    <Pencil aria-hidden="true" />
                    Edit samples<span className="sr-only"> for {s.name}</span>
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          id="order"
          headingLevel="h2"
          title="Service order"
          description="The order Published Services appear on your profile."
        >
          {published.length === 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-body-sm text-foreground-secondary">
                You have no Published Services yet.
              </p>
              <ButtonLink
                href="/app/creative/services"
                variant="secondary"
                size="sm"
                className="self-start"
              >
                Go to Services
              </ButtonLink>
            </div>
          ) : (
            <>
              <ol className="flex flex-col divide-y divide-border">
                {published.map((s, i) => (
                  <li key={s.id} data-service-row={s.id} className="flex items-center gap-3 py-3">
                    <span className="w-6 text-caption text-foreground-secondary tabular-nums">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-foreground">
                      {s.name}
                    </span>
                    <IconButton
                      size="sm"
                      variant="secondary"
                      label={`Move ${s.name} up`}
                      icon={<ArrowUp />}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    />
                    <IconButton
                      size="sm"
                      variant="secondary"
                      label={`Move ${s.name} down`}
                      icon={<ArrowDown />}
                      disabled={i === published.length - 1}
                      onClick={() => move(i, 1)}
                    />
                  </li>
                ))}
              </ol>
              <p aria-live="polite" className="sr-only">
                {moved}
              </p>
            </>
          )}
        </Panel>

        <Panel
          id="share"
          headingLevel="h2"
          title="Share"
          description="Send Clients straight to your profile or to one Service."
        >
          <ul className="flex flex-col divide-y divide-border">
            <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-body-sm font-medium text-foreground">Your profile</span>
              <ShareLink url={profileUrl} label="Copy link" size="sm" />
            </li>
            {publicServices.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex min-w-0 items-center gap-2 text-body-sm font-medium text-foreground">
                  <span className="truncate">{s.name}</span>
                  <NextLink
                    href={`/${creative.username}/${s.slug}`}
                    className="shrink-0 rounded-sm text-foreground-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />
                    <span className="sr-only">View {s.name}</span>
                  </NextLink>
                </span>
                <ShareLink url={`${profileUrl}/${s.slug}`} label="Copy link" size="sm" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {previewing && (
        <Sheet open onOpenChange={(open) => !open && setPreviewing(false)}>
          <SheetContent size="lg" className="md:max-w-none">
            <SheetHeader>
              <SheetTitle>Profile preview</SheetTitle>
              <SheetDescription>
                How your profile looks to Clients, with your saved changes.
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="bg-background p-0">
              <div inert>
                <CreativePublicProfile creative={creative} services={publicServices} />
              </div>
            </SheetBody>
            <SheetFooter>
              <Button variant="secondary" onClick={() => setPreviewing(false)}>
                Close preview
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </PageContainer>
  );
}
