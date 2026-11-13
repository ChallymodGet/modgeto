import type { Metadata } from "next";
import { Section } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Account and security" };

export default function Page() {
  return (
    <Section title="Account and security">
      <ScreenPlaceholder title="Account and security" phase="Phase 7.11" source="docs/04 §16" />
    </Section>
  );
}
