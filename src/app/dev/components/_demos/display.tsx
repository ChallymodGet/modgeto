import { FileText, Inbox, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  REQUEST_STATUSES,
  availabilityLabel,
  clientRequestLabel,
  creativeRequestLabel,
  projectStatusLabel,
  serviceStatusLabel,
  type AwaitingClientReason,
  type RequestView,
} from "@/lib/domain";
import { ShowcaseSection, Specimen } from "./section";

const views: RequestView[] = [
  ...REQUEST_STATUSES.filter((s) => s !== "AWAITING_CLIENT").map((status) => ({
    status,
    awaitingClientReason: null,
  })),
  ...(
    ["QUOTE_PROPOSED", "CHANGES_PROPOSED", "CLARIFICATION_REQUESTED"] as AwaitingClientReason[]
  ).map((reason) => ({ status: "AWAITING_CLIENT" as const, awaitingClientReason: reason })),
  { status: "SUBMITTED", awaitingClientReason: null, clientAwaitingReply: true },
];

function uniqueLabels(
  labels: { label: string; intent: Parameters<typeof StatusBadge>[0]["status"]["intent"] }[],
) {
  return [...new Map(labels.map((l) => [l.label, l])).values()];
}

export function DisplayDemo() {
  const serviceLabels = [
    serviceStatusLabel("DRAFT", "NORMAL"),
    serviceStatusLabel("PUBLISHED", "NORMAL"),
    serviceStatusLabel("UNAVAILABLE", "NORMAL"),
    serviceStatusLabel("SUBSCRIPTION_INACTIVE", "NORMAL"),
    serviceStatusLabel("ARCHIVED", "NORMAL"),
    serviceStatusLabel("PUBLISHED", "PLATFORM_DISABLED"),
  ];

  return (
    <>
      <ShowcaseSection
        id="status"
        title="Badges and status"
        description="StatusBadge takes the actor-facing label from lib/domain/status, so backend enums never reach the UI. The text carries the meaning; colour and the dot reinforce it."
      >
        <Specimen label="Creative view of Requests" className="flex flex-wrap gap-2">
          {uniqueLabels(views.map(creativeRequestLabel)).map((s) => (
            <StatusBadge key={s.label} status={s} />
          ))}
        </Specimen>
        <Specimen label="Client view of Requests" className="flex flex-wrap gap-2">
          {uniqueLabels(views.map(clientRequestLabel)).map((s) => (
            <StatusBadge key={s.label} status={s} />
          ))}
        </Specimen>
        <Specimen label="Services, Projects and availability" className="flex flex-wrap gap-2">
          {[
            ...serviceLabels,
            projectStatusLabel("ACTIVE"),
            projectStatusLabel("COMPLETED"),
            availabilityLabel("AVAILABLE"),
            availabilityLabel("LIMITED"),
            availabilityLabel("UNAVAILABLE"),
          ].map((s, i) => (
            <StatusBadge key={`${s.label}-${i}`} status={s} size="md" />
          ))}
        </Specimen>
        <Specimen label="Badges" className="flex flex-wrap items-center gap-2">
          <Badge>Fixed price</Badge>
          <Badge tone="primary">Starting from</Badge>
          <Badge tone="outline">Custom quote</Badge>
          <Badge tone="info">Free Service</Badge>
          <Badge tone="success">Most chosen</Badge>
          <Badge tone="warning">Expires soon</Badge>
          <Badge tone="danger">Removed</Badge>
          <Badge tone="primary" size="md">
            <Sparkles aria-hidden="true" />
            New
          </Badge>
        </Specimen>
      </ShowcaseSection>

      <ShowcaseSection id="avatars-cards" title="Avatars and cards">
        <Specimen label="Avatars (initials fallback)" className="flex flex-wrap items-end gap-4">
          <Avatar name="Ada Okafor" size="xs" />
          <Avatar name="Ada Okafor" size="sm" />
          <Avatar name="Tunde Bakare" size="md" />
          <Avatar name="Mira" size="lg" />
          <Avatar name="Sola Adebayo" size="xl" />
        </Specimen>
        <div className="grid gap-6 md:grid-cols-3">
          <Card variant="feature" className="md:col-span-1">
            <CardHeader>
              <CardDescription>New Requests</CardDescription>
            </CardHeader>
            <p className="text-[3rem] leading-none text-numeral text-foreground">3</p>
            <CardFooter className="border-0 pt-0">
              <ButtonLink href="#avatars-cards" variant="secondary" size="sm">
                Review Requests
              </ButtonLink>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-1">
                <CardTitle>Brand identity</CardTitle>
                <CardDescription>Package · From ₦150,000</CardDescription>
              </div>
              <StatusBadge status={serviceStatusLabel("PUBLISHED", "NORMAL")} />
            </CardHeader>
            <CardContent>
              <p className="text-body-sm text-foreground-secondary">
                Logo, colour, type and brand assets for new and growing businesses.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm">
                Edit Service
              </Button>
              <Button variant="ghost" size="sm">
                Preview
              </Button>
            </CardFooter>
          </Card>
          <Card variant="subtle">
            <CardTitle>Payment instructions</CardTitle>
            <CardDescription>
              Pay the commitment directly to the Creative. Modgeto does not collect Client Project
              payments.
            </CardDescription>
          </Card>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id="feedback"
        title="Loading, empty and error states"
        description="Every screen needs all three (CLAUDE.md §18). Skeletons respect reduced motion."
      >
        <Specimen label="Skeleton" className="flex flex-col gap-4">
          <div aria-busy="true" aria-label="Loading Requests" className="flex flex-col gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </Specimen>
        <div className="grid gap-6 lg:grid-cols-2">
          <EmptyState
            icon={<Inbox />}
            title="No Requests yet"
            description="Share your link to start receiving Project Requests. New Requests appear here."
            actions={
              <>
                <Button>Copy your link</Button>
                <Button variant="secondary">Preview profile</Button>
              </>
            }
          />
          <ErrorState description="We couldn't load your Requests. Check your connection and try again." />
        </div>
        <ErrorState
          variant="inline"
          title="Your file didn't upload"
          description="brand-brief.pdf is larger than 25 MB. Choose a smaller file."
          actions={
            <Button variant="secondary" size="sm">
              <FileText aria-hidden="true" />
              Choose another file
            </Button>
          }
        />
      </ShowcaseSection>
    </>
  );
}
