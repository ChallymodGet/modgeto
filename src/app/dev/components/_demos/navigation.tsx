"use client";

import {
  CreditCard,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Package,
  ScrollText,
} from "lucide-react";
import { SectionNavigation } from "@/components/ui/section-navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShowcaseSection, Specimen } from "./section";

export function NavigationDemo() {
  return (
    <ShowcaseSection
      id="navigation"
      title="Tabs and section navigation"
      description="Tabs switch views within a page. Section navigation links between sections: a sidebar from desktop and a scrolling pill row on phones and tablets."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Specimen label="Segmented tabs">
          <Tabs defaultValue="overview">
            <TabsList aria-label="Request detail">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="brief">Brief</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-body-sm text-foreground-secondary">
              Summary of the Request, price and next step.
            </TabsContent>
            <TabsContent value="brief" className="text-body-sm text-foreground-secondary">
              The Client&apos;s answers, exactly as submitted.
            </TabsContent>
            <TabsContent value="payment" className="text-body-sm text-foreground-secondary">
              Commitment, declarations and confirmations.
            </TabsContent>
          </Tabs>
        </Specimen>
        <Specimen label="Line tabs (scroll on narrow screens)">
          <Tabs defaultValue="all">
            <TabsList variant="line" aria-label="Filter Projects">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="text-body-sm text-foreground-secondary">
              All Projects.
            </TabsContent>
            <TabsContent value="active" className="text-body-sm text-foreground-secondary">
              Projects in progress.
            </TabsContent>
            <TabsContent value="completed" className="text-body-sm text-foreground-secondary">
              Closed Projects.
            </TabsContent>
          </Tabs>
        </Specimen>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Specimen label="Request groups with counts">
          <SectionNavigation
            label="Request groups"
            currentHref="#new"
            items={[
              { href: "#new", label: "New", count: 2 },
              { href: "#awaiting-client", label: "Awaiting Client", count: 4 },
              { href: "#awaiting-payment", label: "Awaiting Payment", count: 3 },
              { href: "#ready", label: "Ready to Start", count: 1 },
              { href: "#closed", label: "Closed", count: 4 },
            ]}
          />
        </Specimen>
        <Specimen label="Service Builder sections with completion">
          <SectionNavigation
            label="Service Builder sections"
            currentHref="#pricing"
            items={[
              { href: "#basics", label: "Basics", icon: <FileText />, complete: true },
              { href: "#pricing", label: "Pricing", icon: <CreditCard />, complete: true },
              { href: "#packages", label: "Packages", icon: <Package />, complete: false },
              { href: "#brief", label: "Brief", icon: <ListChecks />, complete: false },
              { href: "#media", label: "Media", icon: <ImageIcon />, complete: true },
              { href: "#terms", label: "Terms", icon: <ScrollText />, complete: false },
            ]}
          />
        </Specimen>
      </div>
    </ShowcaseSection>
  );
}
