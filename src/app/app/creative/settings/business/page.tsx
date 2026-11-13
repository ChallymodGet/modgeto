import type { Metadata } from "next";
import { Section } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Business preferences" };

export default function Page() {
  return (
    <Section title="Business preferences">
      <ScreenPlaceholder
        title="Business preferences"
        phase="Phase 7.11"
        source="docs/04 §16, PROF-004"
      />
    </Section>
  );
}
