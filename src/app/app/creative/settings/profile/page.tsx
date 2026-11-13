import type { Metadata } from "next";
import { Section } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Creative profile" };

export default function Page() {
  return (
    <Section title="Creative profile">
      <ScreenPlaceholder
        title="Creative profile"
        phase="Phase 7.11"
        source="docs/04 §16, PROF-002"
      />
    </Section>
  );
}
