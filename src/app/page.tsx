import {
  ArrowDown,
  Check,
  ClipboardList,
  Copy,
  Layers,
  Link2,
  Mail,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { ThemeScript, ThemeToggle } from "@/components/marketing/theme";
import { Wordmark } from "@/components/marketing/wordmark";

const disciplines = [
  "Brand Identity Designers",
  "UI/UX Designers",
  "Product Designers",
  "Web Designers",
  "Illustrators",
  "Frontend Developers",
  "Full-stack Developers",
  "Mobile Developers",
  "Webflow Developers",
  "Framer Developers",
  "Copywriters",
  "UX Writers",
  "Technical Writers",
  "Motion Designers",
  "Video Editors",
];

export default function Home() {
  return (
    <div className="marketing relative min-h-dvh overflow-x-clip bg-background text-foreground">
      <ThemeScript />

      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[900px]">
        <div className="mg-grid absolute inset-0" />
        <div className="mg-drift absolute -top-40 left-1/2 h-[560px] w-[760px] -translate-x-[70%] rounded-full bg-[var(--glow-a)] blur-[110px]" />
        <div
          className="mg-drift absolute top-10 left-1/2 h-[460px] w-[560px] translate-x-[5%] rounded-full bg-[var(--glow-b)] blur-[110px]"
          style={{ animationDelay: "-9s" }}
        />
      </div>

      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <header className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="Modgeto home" className="rounded-md">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-caption font-medium text-foreground-secondary backdrop-blur sm:inline-flex">
            <span className="mg-pulse size-1.5 rounded-full bg-success" />
            Preparing for launch
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-[1200px] px-5 pt-10 pb-24 text-center sm:px-8 sm:pt-16 lg:pb-36">
          <p className="mg-rise mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-caption font-medium text-foreground-secondary backdrop-blur sm:hidden">
            <span className="mg-pulse size-1.5 rounded-full bg-success" />
            Preparing for launch
          </p>
          <h1
            className="mg-rise mx-auto mt-6 max-w-[14ch] text-display text-balance sm:mt-0"
            style={{ animationDelay: "80ms" }}
          >
            <span className="mg-headline-gradient">One link</span> to start working with you.
          </h1>
          <p
            className="mg-rise mx-auto mt-6 max-w-[60ch] text-body-lg text-pretty text-foreground-secondary"
            style={{ animationDelay: "180ms" }}
          >
            Modgeto helps independent Creatives package their Services, pricing, Project
            requirements and working terms into one personalized link that Clients can use to start
            a Project.
          </p>
          <div className="mg-rise mt-8 flex justify-center" style={{ animationDelay: "260ms" }}>
            <a
              href="#creatives"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-label text-primary-foreground transition-colors hover:bg-primary-hover active:bg-primary-pressed"
            >
              See what&apos;s coming
              <ArrowDown aria-hidden className="size-4" />
            </a>
          </div>

          <div className="mg-rise mt-16 sm:mt-20" style={{ animationDelay: "380ms" }}>
            <HeroPreview />
          </div>
        </section>

        {/* For Creatives */}
        <section
          id="creatives"
          className="scroll-mt-8 border-t border-border bg-surface/40 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="mg-reveal max-w-[40rem]">
              <p className="text-label text-primary-text">For Creatives</p>
              <h2 className="mt-3 text-h2 text-balance">
                Set up how you work once. Share it everywhere.
              </h2>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-12">
              <Feature
                className="lg:col-span-7"
                icon={<Layers className="size-5" />}
                title="Create configurable Services"
                body="Packages, add-ons, options and delivery choices, each with its price shown before a Client selects it."
                visual={<ServicesVisual />}
              />
              <Feature
                className="lg:col-span-5"
                icon={<ClipboardList className="size-5" />}
                title="Collect structured Client Briefs"
                body="Ask the questions you always need answered, section by section, with visual examples."
                visual={<BriefVisual />}
              />
              <Feature
                className="lg:col-span-5"
                icon={<ScrollText className="size-5" />}
                title="Set pricing and Project terms"
                body="Fixed, starting from or custom quote. Your prices, your terms and your payment method."
                visual={<PricingVisual />}
              />
              <Feature
                className="lg:col-span-7"
                icon={<Link2 className="size-5" />}
                title="Share one personalized link"
                body="Put it in your bio, portfolio or email signature. Clients start from there."
                visual={<LinkVisual />}
              />
            </div>
          </div>
        </section>

        {/* Built for */}
        <section className="py-20 sm:py-24" aria-labelledby="built-for">
          <div className="mx-auto max-w-[1200px] px-5 text-center sm:px-8">
            <h2
              id="built-for"
              className="mg-reveal mx-auto max-w-[32ch] text-h3 text-balance text-foreground"
            >
              Built for independent digital Creatives and technology professionals.
            </h2>
          </div>
          <div className="mg-marquee-wrap mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
            <div className="mg-marquee-track mg-marquee flex w-max">
              <DisciplineList items={disciplines} />
              <DisciplineList items={disciplines} hidden />
            </div>
          </div>
        </section>

        {/* Launch status */}
        <section className="px-5 pb-24 sm:px-8 sm:pb-32">
          <div className="mg-reveal relative mx-auto max-w-[1200px] overflow-hidden rounded-xl border border-border bg-surface px-6 py-16 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-[var(--glow-a)] blur-[90px]"
            />
            <p className="relative inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-caption font-medium text-foreground-secondary">
              <span className="mg-pulse size-1.5 rounded-full bg-success" />
              Launch status
            </p>
            <p className="relative mx-auto mt-6 max-w-[20ch] text-h1 text-balance">
              Modgeto is currently preparing for launch.
            </p>
            <p className="relative mx-auto mt-4 max-w-[48ch] text-body text-foreground-secondary">
              Services, Briefs and Project starts for independent Creatives.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-8 text-caption text-foreground-muted sm:flex-row sm:px-8">
          <Wordmark />
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <a
              href="mailto:modgetdesigns@gmail.com"
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-body-sm text-foreground-secondary transition-colors hover:text-foreground"
            >
              <Mail aria-hidden className="size-4" />
              modgetdesigns@gmail.com
            </a>
            <p>© 2026 Modgeto. Make it easier to start working with you.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
  visual,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  body: string;
  visual: ReactNode;
  className?: string;
}) {
  return (
    <SpotlightCard className={`group mg-reveal flex flex-col overflow-hidden ${className}`}>
      <div className="p-6 sm:p-8">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary-subtle text-primary-text">
          {icon}
        </span>
        <h3 className="mt-5 text-h3">{title}</h3>
        <p className="mt-2 max-w-[44ch] text-body-sm text-foreground-secondary">{body}</p>
      </div>
      <div aria-hidden className="mt-auto px-6 pb-6 sm:px-8 sm:pb-8">
        {visual}
      </div>
    </SpotlightCard>
  );
}

function ServicesVisual() {
  const packages = [
    { name: "Essential", price: "₦250,000", selected: false },
    { name: "Standard", price: "₦450,000", selected: true },
    { name: "Complete", price: "₦700,000", selected: false },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {packages.map((p) => (
        <div
          key={p.name}
          className={`rounded-lg border p-3 transition-transform duration-500 group-hover:-translate-y-1 ${
            p.selected ? "border-primary bg-primary-subtle" : "border-border bg-background"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-caption text-foreground-muted">{p.name}</p>
            {p.selected && <Check className="size-3.5 text-primary-text" />}
          </div>
          <p className="mt-2 text-[1.05rem] text-numeral text-foreground sm:text-[1.25rem]">
            {p.price}
          </p>
        </div>
      ))}
    </div>
  );
}

function BriefVisual() {
  const questions = [
    "What does your business do?",
    "Which logo directions resonate?",
    "Any brand assets to share?",
  ];
  return (
    <ul className="grid gap-2">
      {questions.map((q, i) => (
        <li
          key={q}
          className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
        >
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
              i < 2 ? "bg-success-subtle text-success" : "border border-border-strong"
            }`}
          >
            {i < 2 && <Check className="size-3" strokeWidth={3} />}
          </span>
          <span className="truncate text-body-sm text-foreground-secondary">{q}</span>
        </li>
      ))}
    </ul>
  );
}

function PricingVisual() {
  return (
    <div className="rounded-lg border border-border bg-background p-4 text-body-sm">
      <div className="flex justify-between text-foreground-secondary">
        <span>Standard package</span>
        <span>₦450,000</span>
      </div>
      <div className="mt-2 flex justify-between text-foreground-secondary">
        <span>Brand guidelines</span>
        <span>+₦80,000</span>
      </div>
      <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
        <span className="text-foreground-muted">Project total</span>
        <span className="text-[1.5rem] leading-none text-numeral text-foreground">₦530,000</span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-caption text-foreground-muted">
        <ScrollText className="size-3.5" /> Terms reviewed before the Request is sent
      </p>
    </div>
  );
}

function LinkVisual() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 py-3">
        <Link2 className="size-4 shrink-0 text-primary-text" />
        <span className="truncate text-body-sm text-foreground-muted">
          modgeto.com/<span className="font-medium text-foreground">your-name</span>
        </span>
      </div>
      <span className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-label text-background">
        <Copy className="size-4" /> Copy link
      </span>
    </div>
  );
}

function DisciplineList({ items, hidden = false }: { items: string[]; hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={`flex shrink-0 gap-3 pr-3 ${hidden ? "mg-marquee-dup" : ""}`}
    >
      {items.map((d) => (
        <li
          key={d}
          className="rounded-full border border-border bg-surface px-4 py-2 text-body-sm whitespace-nowrap text-foreground-secondary"
        >
          {d}
        </li>
      ))}
    </ul>
  );
}
