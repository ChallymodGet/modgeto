# Modgeto V1 Implementation Roadmap

**Status:** Draft for review  
**Date:** 10 November 2026  
**Derived from:** `CLAUDE.md` and `docs/01`–`docs/10` (decisions log wins on conflicts)

This is a working build plan, not a product spec. It doesn't add product behaviour. Where the docs leave a gap that blocks a phase, it's listed under **Open questions** and needs a ruling in `docs/10-decisions-log-v1.0.md` before that phase starts.

Strategy (D-022): build the UI first against typed fixtures, and build and test domain logic from day one. Supabase and integrations come after.

---

## Phase 0: Repository and tooling scaffold

- [x] Make the first commit on `main` (the repo has no commits yet). Add `.gitignore` and `.env.example`.
- [x] Next.js 16 (App Router), React 19, and strict TypeScript with pnpm, using a `src/` directory and `@/` path alias.
- [x] ESLint, Prettier, and the scripts `typecheck`, `lint`, `test`, and `test:watch`.
- [x] Vitest configured for `src/lib/domain`.
- [x] Tailwind CSS v4 (CSS-first `@theme`, no JS config).
- [x] shadcn/ui init (Tailwind v4 compatible, Base UI per D-034) and Lucide.
- [x] Inter via `next/font`.
- [x] Create the folder skeleton from CLAUDE.md §15: `components/{ui,layout,service,brief,request,project,payment,subscription,notifications}`, `features/*`, `lib/domain`, `lib/fixtures`, `types`, `styles`.
- [x] CI (optional, recommended): typecheck, lint, and test on every push.

**Start now, in parallel (long lead times, tracked risks in D-xxx §5):**
- [x] Paystack merchant account (Live, Pre-Approved, 10 Nov 2026). Website: https://modgeto.vercel.app
- [ ] Paystack: finish compliance (Pre-Approved → fully approved) and get USD enabled (dashboard shows NGN only).
- [x] Prelaunch landing page live at https://modgeto.vercel.app (D-033). `modgeto.com` is not registered yet.
- [ ] Termii account and an international OTP delivery test.
- [x] Vercel account and project (deploys from `main`).
- [ ] Supabase, Cloudflare R2, and Brevo accounts.
- [ ] Register `modgeto.com`, then set `SITE_URL` in Vercel.

**Exit:** `pnpm dev` runs, and `pnpm typecheck && pnpm lint && pnpm test` pass. **Met 10 Nov 2026.**

---

## Phase 1: Design tokens and visual foundation

Source: doc 08, doc 07 §7–18, CLAUDE.md §11.

- [ ] Palette scales in `@theme`: primary, secondary, tertiary, neutral, and semantic (success, warning, danger, info) with their subtle and border variants.
- [ ] Semantic tokens (`--background`, `--surface`, `--foreground-*`, `--border*`, `--primary*`, `--focus`, …) and the shadcn variable mapping.
- [ ] Radius (6/8/12/16/full) with D-032 usage, shadows (sm, md), and the spacing scale (4–80).
- [ ] Large light-weight numeral style for attention counts and prices (D-031).
- [ ] Breakpoints: Tailwind defaults plus a 1440px large-desktop breakpoint (doc 06 §10).
- [ ] Typography role utilities: Display, H1–H4, Body Large, Body, Body Small, Label, Caption. Doc 07 §55 says we set the sizes ourselves in code.
- [ ] Motion durations and easing, plus `prefers-reduced-motion` handling.
- [ ] The brand gradient as a single utility, for decorative use only.
- [ ] Light mode only.

**Exit:** a token reference page that renders under `/dev`.

---

## Phase 2: Domain core (`src/lib/domain`), test-first

Pure TypeScript with no React and no I/O. Every module ships with Vitest tests.

### 2a. Money
- [x] `Money { amountMinor: bigint; currency }` for NGN, USD, GBP, and EUR (D-013). Add, subtract, compare, and multiply by an integer.
- [x] Percentage of an amount with round-half-up at the line where it's applied (D-012).
- [x] Formatting with `Intl` (₦150,000, +₦80,000, and so on) and parsing of form input into minor units.
- [x] Serialization helpers so a bigint can cross Zod, forms, JSON, and the database.

### 2b. Pricing engine
- [x] Pricing modes: FIXED, STARTING_FROM, QUANTITY, PACKAGE, CUSTOM_QUOTE.
- [x] Line items: base or package, then quantity items, add-ons (with quantity), paid options, and the delivery modifier, which can be fixed or a percentage of the subtotal before delivery (D-010).
- [x] Discount (in proposals only, D-011) and additional charges (Service level and proposal), giving the Final Total, which can't go below zero.
- [x] Commitment as a percentage of the Final Total (D-012).
- [x] Outstanding balance: total minus confirmed payments.
- [x] Price state output: Calculated, Estimated, or Quote Required.
- [x] Validation: quantity min/max, required option groups, single vs multiple selection, and prerequisite dependencies with an "Add prerequisite" hint.

### 2c. Subscription capacity
- [x] The D-001 price table exactly as written. Tests must assert that 5 < 4 and 10 < 9.
- [x] Capacity consumption: PUBLISHED and UNAVAILABLE use a slot.
- [x] The free-Service rule and the deterministic fallback in D-016.
- [x] Downgrade allocation and upgrade/downgrade timing (D-015): upgrade is immediate with no proration, downgrade is scheduled, past due gets a 7-day grace period.

### 2d. State machines (transition, actor guard, preconditions)
- [x] User account: PENDING_VERIFICATION, ACTIVE, SUSPENDED, DELETION_PENDING.
- [x] Service lifecycle, plus the moderation overlay (D-003) and unpublish returning to DRAFT (D-005).
- [x] Request: the full D-007 status set including `AWAITING_TERMS` (D-006) and the `AWAITING_CLIENT` sub-types.
- [x] CommercialProposal: PROPOSED, then ACCEPTED, REJECTED, SUPERSEDED, or EXPIRED, with quote validity (D-017).
- [x] Project: ACTIVE to COMPLETED, Creative only.
- [x] Subscription: FREE, ACTIVE, PAST_DUE, EXPIRED, CANCELLED.

### 2e. Policies and derivations
- [x] `canAcceptNewRequest` (LIMITED doesn't block) and `canGoPublic`.
- [x] Publish validation that returns blockers mapped to Builder sections.
- [x] `readyToStart` derivation, commitment satisfaction (only confirmed amounts count), and the final-terms rule (D-002).
- [x] Brief validation: one-level conditions, hidden questions never block, visible required questions must be answered.
- [x] Username rules (PROF-003) and the reserved-word blocklist (D-021).
- [x] File rules (D-018).
- [x] A Creative can't request their own Service, and a suspended user can't take protected actions.

### 2f. Actor-facing status language
- [x] Map domain statuses to Creative and Client labels and groupings (doc 04 §46–47, revised by D-006 and D-007).
- [x] Map each status to a StatusBadge intent (doc 08 §15).

### 2g. Scenario tests
- [x] Every scenario in doc 03 §78–92, using the D-001 prices.

**Exit:** domain coverage close to 100%, and every invariant in doc 03 §03P has a test. **Met 10 Nov 2026:** 161 tests, ~96% line coverage (`pnpm test:coverage`). Code in `src/lib/domain/`.

---

## Phase 3: Domain types, Zod schemas, fixtures, and the data-access seam

- [x] `src/types`: entity types from doc 03 updated with the D-xxx rulings, plus the snapshot types (service, scope, brief, price, terms, commitment).
- [x] Zod schemas shared between forms and Server Actions.
- [x] Repository interfaces in `features/*`, with a fixture implementation now and a Supabase implementation in Phase 8. Screens never import fixtures directly.
- [x] Fixtures (`src/lib/fixtures`):
  - [x] A Creative in each availability state (Ada AVAILABLE, Tunde LIMITED, Mira UNAVAILABLE; fictional people, `example.com` emails).
  - [x] One Service for every pricing mode.
  - [x] A Brief with every question type, including visual and conditional questions.
  - [x] A Request in every status.
  - [x] Proposal history with superseded versions.
  - [x] Partial and full payments.
  - [x] Active and completed Projects.
  - [x] Every subscription state.
  - [x] Notifications.
  - [x] Admin data.

**Done 12 Nov 2026.** Types in `src/types`, schemas in `src/lib/schemas`, fixtures in `src/lib/fixtures` (Requests built by running the real state machine), repositories behind `src/features/data`. 195 tests.

---

## Phase 4: Generic UI primitives (`components/ui`)

Source: doc 07 §21–23.

- [x] Button, IconButton, Link, Input, Textarea, NumberInput, Select, Checkbox, RadioGroup, and Switch.
- [x] FormField, which centrally handles labels, description and error IDs, `aria-invalid`, and the required state.
- [x] Badge, StatusBadge, Avatar, and Card.
- [x] Dialog, Drawer, and Sheet (a drawer on desktop becomes a full-screen sheet on mobile), with focus trap, Escape to close, and focus returned on close.
- [x] Tabs, SectionNavigation, DropdownMenu, Popover, Command, Tooltip, and Toast.
- [x] Skeleton, EmptyState, and ErrorState.
- [x] A SelectionCard base: a real radio or checkbox underneath, and a selected state that doesn't rely on colour alone.
- [x] `/dev/components` route, returning not-found in production unless explicitly enabled.

Each component must pass the CLAUDE.md §17 component gate before it's used in a screen.

**Done 13 Nov 2026.** shadcn/ui on Base UI, restyled to the doc 08 tokens in `src/components/ui`. FormField is built on Base UI Field. Dialogs become bottom sheets and Sheets become full screen on phones. SelectionCard sits on a real radio or checkbox group. Overlays were checked in Chrome at 390px and 1366px: no sideways scroll, focus trapped, Escape closes, focus returned. `/dev/components` returns 404 in production unless `ENABLE_DEV_ROUTES=true`. D-037 (status text and control border tokens) and D-038 (optional-field marking) approved 13 Nov 2026.

---

## Phase 5: Layout shells and route skeleton

- [x] Shells per D-031: PublicLayout, AuthLayout, CreativeAppShell (top pill bar on desktop; bottom nav plus a More sheet on tablet and mobile), ClientAppShell (top pill bar on desktop and tablet; bottom nav on mobile), AdminAppShell (sidebar), BuilderShell, and ConfigurationShell.
- [x] SectionSidebar for pages with sub-navigation (Requests groupings with counts, Builder sections, Settings, Account).
- [x] Supporting layout: PageContainer, PageHeader, Section, SectionHeader, FormContainer, DashboardGrid, SplitLayout, StickySummary, and BottomActionBar.
- [x] Route tree:
  - `/[username]` and `/[username]/[serviceSlug]`, plus the configure, brief, and review steps
  - `/auth/*`
  - `/app/*` for the Creative and Client workspaces
  - `/admin/*`
  - `/dev/*`
- [x] Workspace switcher and account menu (Client-only users see "Become a Creative").
- [x] Global not-found, error, permission-denied, and resource-unavailable pages.

**Done 13 Nov 2026.** Shells and layout components in `src/components/layout`. 60 routes, each with a placeholder that names the Phase 7 screen and its spec. Workspaces at `/app/creative` and `/app/client` (D-039). Unfinished areas are private in production (D-040). The fixture viewer is in `features/auth/viewer.ts` until Phase 9. Checked in Chrome at 390, 820 and 1366px: no sideways scroll, skip link first in tab order, More drawer, account menu and Admin menu all working.

---

## Phase 6: Product components

Every component gets a showcase entry. Doc 07 §24–30 has the full list.

- [x] **service:** ServiceCard, ServiceStatusBadge, PackageCard and PackageSelector, DeliverableList, AddOnCard and AddOnSelector, OptionGroup and OptionCard, QuantityControl, DeliveryOption, and RevisionSummary.
- [x] **pricing:** MoneyDisplay, PriceModifier, PriceBreakdown, EstimatedPrice, PriceDifference, and CommitmentSummary. CLAUDE.md §15 has no `pricing/` folder, so these go under `service/` unless we add one.
- [x] **brief:** BriefSection, BriefProgress, QuestionRenderer, the question type components, and FileUploader (UI only: progress, retry, remove).
- [x] **request:** RequestCard, RequestStatus, RequestSummary, ScopeSummary, ProposalCard, ProposalComparison, ClarificationPanel, and TermsPanel.
- [x] **payment:** PaymentInstructions (always states that Modgeto doesn't collect Client Project payments), PaymentDeclarationForm, PaymentConfirmationForm, PaymentRecord, and CommitmentProgress.
- [x] **subscription:** CapacitySelector (shows both discount points), CapacityUsage, CapacityPrice, ServiceAllocation, and SubscriptionStatus.
- [x] **project:** ProjectCard.
- [x] **notifications:** AttentionItem, NotificationItem, and StatusTimeline.

**Done 13 Nov 2026.** About 45 components in `src/components/{service,brief,request,payment,subscription,project,notifications}`. The pricing components live in `service/price.tsx`. They're shown with fixture data at `/dev/components/product`. Formatting helpers are in `lib/format.ts`, and the headline-price logic is `servicePriceSummary`, both tested. Forms use React Hook Form with the shared Zod schemas. Selection grids size to their container, so they stay readable inside narrow panels. Checked in Chrome at 390px and 1366px: no sideways scroll, Brief validation moves focus to the first problem, the conditional question appears, uploads show progress and retry, the capacity cards work with the arrow keys, and no console errors.

---

## Phase 7: Screens on fixtures

Each screen covers mobile, tablet, and desktop in the same task, includes empty, loading, and error states, and passes the CLAUDE.md §18 screen gate.

The order follows CLAUDE.md §20. Rows marked ➕ are screens from the doc 06 inventory that §20 doesn't place. Their position here is my proposal and needs confirming (see Q5).

| # | Screen(s) | Notes |
|---|---|---|
| 7.1 | Creative Public Profile | Available, Limited, and Unavailable states. No Selected Work section when there are no samples. |
| 7.2 | Service Detail and Service Unavailable | Pricing language for each mode. No private reasons shown. |
| 7.3 | Client Configuration | Adaptive steps, sticky or collapsible summary, back navigation keeps answers. |
| 7.4 | Client Brief | Section by section, validation focus, upload states. |
| 7.5 | ➕ Auth screens and Client Identification | Sign up, sign in, verify email, verify phone (OTP UI), forgot and reset password, expired link. Needed for the Review step's identity handoff. |
| 7.6 | Review and Submit, and Request Submitted | Terms acknowledgement and a "what happens next" explanation. |
| 7.7 | ➕ Creative Onboarding | Introduction, public identity, profile, business preferences, payment setup (skippable), first Service. |
| 7.8 | Creative Dashboard | Attention priority order, new-Creative checklist, no-request state with Copy My Link. |
| 7.9 | Services | Capacity summary, filters, muted inactive Services with Increase Capacity. |
| 7.10 | Service Builder (10 sections) | Non-linear sections, Brief Builder with Move Up/Down, Preview and Publish blockers, capacity-blocked publish leading to upgrade and back to the draft. |
| 7.11 | ➕ Public Profile Management and Settings | Settings includes payment methods and notification preferences. |
| 7.12 | Creative Requests list and Request Detail | Accept, Request Changes, Proposal Editor, clarification, Confirm Payment, Ready to Start, Start Project. |
| 7.13 | ➕ Client Home, Requests list, and Request Detail | Proposal review, clarification, Accept Terms, payment instructions and declaration, partial payment, waiting state. |
| 7.14 | ➕ Notification centre | Read/unread, timestamps, deep links. |
| 7.15 | Subscription | Overview, capacity selector, downgrade allocation, Paystack-pending state. |
| 7.16 | Projects | Creative and Client lists and detail, Close Project confirmation. No V2 features. |
| 7.17 | ➕ Client Account | Profile, Security, Notifications. |
| 7.18 | Admin | Overview, Users, Services and Categories, Requests, Projects, Subscriptions, Capacity Pricing, Billing Events, Moderation, Audit, Platform Settings. Dense tables on desktop become cards on mobile. |

**Milestone check after 7.6:** the whole Client journey can be clicked through on a phone.  
**Milestone check after 7.13:** the full Request-to-Ready-to-Start loop can be clicked through for both actors.

---

## Phase 8: Supabase backend foundation

- [ ] Migrations following the doc 03 §03Q boundaries: BIGINT money, JSONB snapshots, and unique constraints (username, `(creative_id, slug)`, `projects.request_id`).
- [ ] RLS policies from doc 03 §77. Authorization is still validated on the server in every action.
- [ ] An `admin_users` table with no UI path to becoming an Admin (D-019).
- [ ] Seed data: categories, `capacity_prices` (D-001, effective-dated), and the reserved usernames.
- [ ] Generated database types and a Supabase repository implementation that replaces the fixture one.
- [ ] Server Actions: Zod validation, then domain guards, then the database write, then the audit event.
- [ ] Postgres functions for the transactional operations: submit Request (with an idempotency key and all snapshots), accept proposal, confirm payment, and Start Project (idempotent, one Project per Request).
- [ ] Integration tests against a local Supabase instance.

## Phase 9: Authentication and verification

- [ ] Email/password sign-up and sign-in with Supabase Auth, using Brevo as the custom SMTP.
- [ ] Email verification, forgot password, and reset password.
- [ ] Guest drafts via anonymous sign-in (D-024): convert the user on sign-up, and merge the draft into the account on sign-in.
- [ ] Termii phone OTP: E.164 normalization, expiry, attempt limits, resend cooldown, and rate limiting. A provider failure never marks the phone as verified.
- [ ] Route protection (Next 16 `proxy`) and return to the interrupted context after authentication or verification.

## Phase 10: Files (Cloudflare R2)

- [ ] Separate public and private buckets or prefixes, the asset table, and asset relations.
- [ ] Presigned uploads and time-limited signed downloads.
- [ ] D-018 limits and allowlist.
- [ ] A scan pipeline. Files show as "processing" and can't be downloaded until the scan clears.

## Phase 11: Notifications, email, audit, and analytics

- [ ] Domain events write in-app notifications and `email_delivery_jobs` for every NOT-002 event.
- [ ] Brevo templates written in the doc 09 voice.
- [ ] A retry worker (Vercel Cron). An email failure never rolls back the business action.
- [ ] `audit_events` (append-only) and `analytics_events` (D-025), with no private Brief content.

## Phase 12: Paystack subscriptions

- [ ] Up to 18 paid plans (capacity × market). Market is set at the first upgrade (D-014).
- [ ] Checkout initialization, then a signed and idempotent webhook, then capacity activation. Returning from the browser alone never activates anything.
- [ ] Upgrade, downgrade scheduling, past due with the 7-day grace period, expiry with D-016 deactivation, and renewal with reactivation.
- [ ] Platform billing records stay fully separate from Project payment records.

## Phase 13: Admin wiring

- [ ] Search; suspend and restore accounts; disable and restore Services (reason plus confirmation plus audit).
- [ ] Category management and effective-dated capacity pricing.
- [ ] Read-only Request and Project inspection. Admins get no participant actions and no impersonation.

## Phase 14: QA and hardening

- [ ] Release criteria RC-001 to RC-011, run end to end.
- [ ] A full Creative and Client journey on real mobile browsers.
- [ ] Historical-integrity tests (RC-009): edits to a Service, price, Brief, terms, or subscription never change existing Requests or Projects.
- [ ] Every PRD §29 edge case.
- [ ] WCAG 2.2 AA audit (axe plus keyboard plus screen reader) and an OWASP-aligned security review.
- [ ] Copy audit against doc 09: no banned terms, and correct external-payment language.

## Phase 15: Launch

- [ ] Vercel production and preview environments, secrets, domains, HTTPS.
- [ ] `/dev` locked down in production.
- [ ] Error monitoring, and backups and restore checks.

---

## Open questions (rule on these in the decisions log before the phase listed)

| # | Question | Blocks |
|---|---|---|
| ~~Q1~~ | Resolved: D-027 (clarification loops). | — |
| ~~Q2~~ | Resolved: D-028 (payment status derivation, Not received). | — |
| ~~Q3~~ | Resolved: D-029 (charges apply after discount). | — |
| ~~Q4~~ | Resolved: D-030 (changes affecting Ready to Start). | — |
| ~~Q5~~ | ~~Please confirm where the ➕ screens go in the Phase 7 order.~~ Resolved: approved as listed, recorded as D-026. | — |
| Q6 | What is the launch list of Service categories? | Phase 3 seed |
| Q7 | What fields does each payment-method type have (Bank, PayPal, Mobile Money, Custom)? | Phase 6 |
| Q8 | Which file-scanning provider? | Phase 10 |
| Q9 | How long do redirects from an old username last (PROF-003)? | Phase 8 |
| Q10 | What is the retention and anonymisation policy for account deletion (AUTH-008)? | Phase 9 |
| Q11 | What goes in Admin Platform Settings? | Phase 7.18 |
| Q12 | Should we add Playwright for end-to-end tests? It isn't in the locked stack. | Phase 14 |
| ~~Q13~~ | Resolved: D-035 (Request status after a rejected proposal). | — |
| ~~Q14~~ | Resolved: D-036 (valid scope = at least one deliverable; Custom Quote exempt). | — |
