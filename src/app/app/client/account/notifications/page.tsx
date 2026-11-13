import type { Metadata } from "next";
import { Section } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return (
    <Section title="Notifications">
      <ScreenPlaceholder title="Notifications" phase="Phase 7.17" source="docs/04 §24" />
    </Section>
  );
}
