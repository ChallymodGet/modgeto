import type { Metadata } from "next";
import { Section } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return (
    <Section title="Profile">
      <ScreenPlaceholder title="Profile" phase="Phase 7.17" source="docs/04 §24" />
    </Section>
  );
}
