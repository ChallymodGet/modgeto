"use client";

import { useState } from "react";
import { SelectionCard, SelectionCardGroup } from "@/components/ui/selection-card";
import { ShowcaseSection, Specimen } from "./section";

export function SelectionDemo() {
  const [pkg, setPkg] = useState("pkg-standard");
  const [addOns, setAddOns] = useState<string[]>(["ao-guidelines"]);

  return (
    <ShowcaseSection
      id="selection"
      title="Selection cards"
      description="A real radio or checkbox sits under every card. Selection shows through the control mark, an Indigo outline and a tint, so it never relies on colour alone. Price modifiers are visible before selection."
    >
      <Specimen label="Single choice (radio group, arrow keys)">
        <SelectionCardGroup
          legend="Choose a package"
          description="You can add extras in the next step."
          value={pkg}
          onValueChange={setPkg}
          columns={3}
        >
          <SelectionCard
            value="pkg-essential"
            title="Essential"
            meta="₦150,000"
            description="Logo and colour palette for a new business."
          />
          <SelectionCard
            value="pkg-standard"
            title="Standard"
            meta="₦250,000"
            description="Full identity with typography and brand assets."
          />
          <SelectionCard
            value="pkg-complete"
            title="Complete"
            meta="₦400,000"
            description="Everything in Standard plus guidelines and launch kit."
          />
        </SelectionCardGroup>
      </Specimen>

      <Specimen label="Multiple choice (checkboxes)">
        <SelectionCardGroup
          type="multiple"
          legend="Add-ons"
          optional
          value={addOns}
          onValueChange={setAddOns}
          columns={2}
        >
          <SelectionCard
            value="ao-guidelines"
            title="Brand guidelines"
            meta="+₦80,000"
            description="A 20-page PDF covering logo use, colour and type."
          />
          <SelectionCard
            value="ao-social"
            title="Social media templates"
            meta="+₦40,000 each"
            description="Editable Canva templates."
          />
          <SelectionCard
            value="ao-rush"
            title="Rush delivery"
            meta="+25%"
            description="Halves the turnaround."
            disabled
          />
        </SelectionCardGroup>
      </Specimen>

      <Specimen label="Visual Brief options with an error">
        <SelectionCardGroup
          type="multiple"
          legend="Which logo directions appeal to you?"
          description="Choose up to two."
          error="Choose at least one direction."
          columns={3}
        >
          {[
            { v: "wordmark", t: "Wordmark", d: "Your name set in a distinctive typeface." },
            { v: "monogram", t: "Monogram", d: "Initials combined into one mark." },
            { v: "abstract", t: "Abstract mark", d: "A shape that suggests your idea." },
          ].map((o) => (
            <SelectionCard
              key={o.v}
              value={o.v}
              title={o.t}
              description={o.d}
              media={
                <div
                  aria-hidden="true"
                  className="flex aspect-[16/9] items-center justify-center text-h2 text-foreground-muted"
                >
                  {o.v === "wordmark" ? "Aa" : o.v === "monogram" ? "AO" : "◐"}
                </div>
              }
            />
          ))}
        </SelectionCardGroup>
      </Specimen>
    </ShowcaseSection>
  );
}
