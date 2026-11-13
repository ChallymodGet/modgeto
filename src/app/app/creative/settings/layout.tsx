import { PageContainer, PageHeader, SectionLayout } from "@/components/layout/page";

const base = "/app/creative/settings";
const sections = [
  { href: base, label: "Account and security" },
  { href: `${base}/profile`, label: "Creative profile" },
  { href: `${base}/business`, label: "Business preferences" },
  { href: `${base}/payment-methods`, label: "Payment methods" },
  { href: `${base}/notifications`, label: "Notifications" },
];

/** Settings sections (docs/04 §16) in a section sidebar (D-031). */
export default function SettingsLayout({ children }: LayoutProps<"/app/creative/settings">) {
  return (
    <PageContainer>
      <PageHeader title="Settings" />
      <SectionLayout label="Settings sections" items={sections}>
        {children}
      </SectionLayout>
    </PageContainer>
  );
}
