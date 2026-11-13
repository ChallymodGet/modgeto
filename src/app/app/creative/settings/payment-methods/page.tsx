import type { Metadata } from "next";
import { Section } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Payment methods" };

export default function Page() {
  return (
    <Section title="Payment methods">
      <ScreenPlaceholder title="Payment methods" phase="Phase 7.11" source="docs/04 §16, PAY-002" />
    </Section>
  );
}
