"use client";

import { Bell, Copy, ExternalLink, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { TextLink } from "@/components/ui/text-link";
import { ShowcaseSection, Specimen } from "./section";

export function ActionsDemo() {
  const [saving, setSaving] = useState(false);
  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1600);
  };

  return (
    <ShowcaseSection
      id="actions"
      title="Buttons and links"
      description="Buttons perform actions; links navigate. Buttons are 44px tall on touch layouts and 40px from tablet. One primary action per view."
    >
      <Specimen label="Variants" className="flex flex-wrap items-center gap-3">
        <Button>Submit Request</Button>
        <Button variant="secondary">View Brief</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="destructive">Decline Request</Button>
        <Button variant="destructive-outline">
          <Trash2 aria-hidden="true" />
          Archive Service
        </Button>
        <Button variant="link">Ask for clarification</Button>
      </Specimen>

      <Specimen label="Sizes, icons and states" className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button>Medium</Button>
        <Button size="lg">Start Project</Button>
        <Button>
          <Plus aria-hidden="true" />
          Create Service
        </Button>
        <Button loading={saving} onClick={save}>
          Save changes
        </Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
      </Specimen>

      <Specimen label="Full width (mobile action bars)" className="max-w-sm">
        <div className="flex flex-col gap-2">
          <Button fullWidth size="lg">
            Continue to Brief
          </Button>
          <Button fullWidth variant="secondary">
            Save and finish later
          </Button>
        </div>
      </Specimen>

      <Specimen
        label="Icon buttons (round, always labelled)"
        className="flex flex-wrap items-center gap-3"
      >
        <IconButton label="Notifications" icon={<Bell />} />
        <IconButton label="Copy link" icon={<Copy />} variant="secondary" />
        <IconButton label="More actions" icon={<MoreHorizontal />} size="sm" />
        <IconButton label="Add" icon={<Plus />} variant="primary" size="lg" />
      </Specimen>

      <Specimen label="Links" className="flex flex-wrap items-center gap-6">
        <TextLink href="#actions">View Service</TextLink>
        <TextLink href="#actions" tone="muted">
          Terms
        </TextLink>
        <TextLink href="https://modgeto.vercel.app" external>
          Portfolio
        </TextLink>
        <ButtonLink href="#forms" variant="secondary">
          Link styled as a button
          <ExternalLink aria-hidden="true" />
        </ButtonLink>
      </Specimen>
    </ShowcaseSection>
  );
}
