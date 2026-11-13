import type { Metadata } from "next";
import { Section } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Security" };

export default function Page() {
  return (
    <Section title="Security">
      <ScreenPlaceholder title="Security" phase="Phase 7.17" source="docs/04 §24" />
    </Section>
  );
}
