import { PageContainer, PageHeader, SectionLayout } from "@/components/layout/page";

const base = "/app/client/account";
const sections = [
  { href: base, label: "Profile" },
  { href: `${base}/security`, label: "Security" },
  { href: `${base}/notifications`, label: "Notifications" },
];

/** Client Account (docs/04 §24). */
export default function AccountLayout({ children }: LayoutProps<"/app/client/account">) {
  return (
    <PageContainer>
      <PageHeader title="Account" />
      <SectionLayout label="Account sections" items={sections}>
        {children}
      </SectionLayout>
    </PageContainer>
  );
}
