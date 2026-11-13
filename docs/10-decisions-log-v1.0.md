# Phase 10: Decisions Log

**Document:** 10-decisions-log-v1.0.md  
**Status:** Approved  
**Version:** 1.0  
**Date:** 10 November 2026  
**Source of truth:** Phases 01–09  
**Purpose:** Record rulings on contradictions and gaps found during the pre-implementation review of documents 01–09.

---

## 1. How to Use This Document

This log resolves contradictions between upstream documents and fills gaps that blocked implementation.

Where an entry here conflicts with an earlier document, **this log wins** for the specific rule it records. Earlier documents carry a revision notice pointing here. Everything not covered here remains as written in documents 01–09.

New rulings are appended as new entries (D-xxx) with a date. Existing entries are never silently edited; superseding entries reference the entry they replace.

---

## 2. Contradiction Rulings

### D-001 Subscription capacity model and pricing (supersedes Phase 01 §21.2, PRD SUB-001, and the capacity tables in Phases 03–06 and 09)

The 1–10 published-Service capacity model from Phase 03 is authoritative. The four named plans in Phase 01 and the PRD are retired.

Revised pricing (approved 10 November 2026):

| Published-Service Limit | Nigeria (NGN/month) | International (USD/month) |
|---:|---:|---:|
| 1 | ₦0 | $0 |
| 2 | ₦2,000 | $2 |
| 3 | ₦4,000 | $4 |
| 4 | ₦6,000 | $6 |
| 5 | ₦5,000 | $5 |
| 6 | ₦7,000 | $7 |
| 7 | ₦9,000 | $9 |
| 8 | ₦11,000 | $11 |
| 9 | ₦13,000 | $13 |
| 10 | ₦12,000 | $12 |

Pricing logic:

```text
1 Service      Free
2–4 Services   Free + ₦2,000 / $2 per additional Service
5 Services     Discounted 5-Service price (₦5,000 / $5)
6–9 Services   5-Service price + ₦2,000 / $2 per additional Service
10 Services    Discounted 10-Service price (₦12,000 / $12)
```

Two intentional discount points exist and must not be corrected or flattened:

- **5 Services costs less than 4 Services** (₦5,000 / $5 vs ₦6,000 / $6).
- **10 Services costs less than 9 Services** (₦12,000 / $12 vs ₦13,000 / $13).

NGN prices mirror USD at ₦1,000 per $1 as fixed plan prices. They are not FX conversions.

UI copy consequences:

- The Ten-Service Offer in Brand Guidelines §23 uses: 9 Services ~~₦13,000/month~~, 10 Services **₦12,000/month**, "Get one more Service and save ₦1,000 each month."
- An equivalent Five-Service Offer may say: 4 Services ~~₦6,000/month~~, 5 Services **₦5,000/month**, "Get one more Service and save ₦1,000 each month."
- The capacity selector should make both discount points visible so a Creative choosing 4 or 9 understands the cheaper higher option.

### D-002 Final terms acceptance

If the terms snapshot is identical to the one acknowledged at Request submission, and no accepted CommercialProposal changed scope or price, the submission acknowledgement counts as final terms acceptance. It is recorded as a `TermsAcceptance` at submission time.

Any accepted CommercialProposal, or any material change to the terms, requires an explicit final terms acceptance step before Ready to Start.

This reconciles PRD TRM-003 with Phase 06 §40 and CLAUDE.md.

### D-003 Platform Disabled is a moderation overlay

Follow Phase 03 §14: Platform Disabled is a `moderationStatus` (`NORMAL` / `PLATFORM_DISABLED`) orthogonal to the Service lifecycle, not a lifecycle state. PRD SRV-003 is amended accordingly.

---

## 3. Gap Rulings

### D-004 Product name (B1)

The product is **Modgeto**. See `09-modgeto-brand-guidelines-v1.0.md`. Public URLs use `modgeto.com/username` and `modgeto.com/username/service-slug`. `platform.com` in earlier documents means `modgeto.com`.

### D-005 Unpublish target state (B2)

Unpublishing returns a Service to `DRAFT`. This frees the published slot and preserves history. The Service slug remains reserved within the Creative profile.

### D-006 Awaiting terms status (B3)

Add an explicit Request status `AWAITING_TERMS`. It sits between `ACCEPTED` and the commitment/ready path when D-002 requires explicit final acceptance. It maps to **Awaiting Client** for the Creative and **Action Required** for the Client.

### D-007 Client-response statuses collapsed (B4)

`CHANGES_REQUESTED` and `AWAITING_CLIENT_RESPONSE` are collapsed into one status: `AWAITING_CLIENT`. The reason is stored as a sub-type:

```text
CHANGES_PROPOSED
QUOTE_PROPOSED
CLARIFICATION_REQUESTED
```

Revised Request status set:

```text
SUBMITTED
AWAITING_CLIENT
ACCEPTED
AWAITING_TERMS
AWAITING_COMMITMENT
AWAITING_PAYMENT_CONFIRMATION
PARTIALLY_CONFIRMED
READY_TO_START
CONVERTED_TO_PROJECT
DECLINED
WITHDRAWN
EXPIRED (reserved; see D-017)
```

### D-008 Request Changes mechanism (B5)

Any change to scope, price, timeline, or commitment is a `CommercialProposal`. A note-only clarification with no commercial change is a `RequestResponse`. "Request Changes" in the UI always produces a CommercialProposal with a required Creative note.

### D-009 Post-submission Client edits (B6)

The Client cannot edit submitted configuration or Brief answers. The submitted snapshot is immutable. The Client may attach files to clarification notes (`RequestResponse` attachments) using private assets.

### D-010 Delivery modifier (B7)

A delivery modifier is either a fixed amount or a percentage. A percentage applies to the subtotal before delivery (base or package + quantities + add-ons + paid options).

### D-011 Discounts and additional charges (B8)

- **Additional charges** (for example VAT) may be configured at Service level, are shown to the Client in the live price, and are also available in proposals.
- **Discounts** are applied by the Creative in CommercialProposals only. No public discounts, coupons, or campaigns in V1.

### D-012 Rounding (B9)

All money uses integer minor units. Percentage results (percentage delivery modifiers, percentage discounts, percentage charges, commitment) round half-up to the nearest minor unit at the line where the percentage is applied. Commitment is calculated from the Final Project Total.

### D-013 Supported Service currencies (B10)

V1 Service currencies: **NGN, USD, GBP, EUR**.

### D-014 Subscription market (B11)

The subscription market (Nigeria/NGN or International/USD) is determined by the Creative's billing country, chosen once at first upgrade. Changing it later requires Admin support.

### D-015 Upgrade, downgrade, and past due (B12)

- **Upgrade:** takes effect immediately at the full new monthly price and starts a new billing cycle. No proration.
- **Downgrade:** scheduled for the end of the current billing period (`scheduledServiceLimit`).
- **Past due:** 7-day grace period. If unresolved, the subscription becomes `EXPIRED` and capacity reverts to 1.

### D-016 Free Service fallback (B13)

If the Creative has not designated a free Service when capacity falls to 1, the earliest-published Service that is still eligible keeps the free slot. All other excess Services become `SUBSCRIPTION_INACTIVE`. The same deterministic rule (most recently published become inactive first) applies to any downgrade where the Creative has not chosen.

### D-017 Should-Have scope for V1 (B14)

In V1:

- Service duplication
- Duplicate Brief Question
- Duplicate Brief Section
- Quote validity date (an expired quote cannot be accepted until renewed)

Deferred (not V1):

- Testimonials
- Creative-owned Brief templates
- Platform starter Brief templates
- Request expiry (`EXPIRED` status reserved but not driven by an automatic timer)
- Basic Creative dashboard metrics
- Accent colour and page personalisation (already excluded by Phase 08 §18)

### D-018 File limits (B15)

- Maximum 25 MB per file.
- Maximum 10 files per multiple-file question.
- Allowlist: images (JPEG, PNG, WebP, GIF, SVG for Creative-owned public assets only), PDF, office documents (DOC/DOCX, XLS/XLSX, PPT/PPTX), plain text, and ZIP.
- Private files are scanned before being served. A file awaiting scan is shown as processing and cannot be downloaded.

### D-019 Admin assignment (B16)

Admins are recorded in a server-managed `admin_users` table. There is no self-service or UI path to become an Admin.

---

## 4. Technical Rulings

### D-020 Versions and tooling (C1)

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4, with tokens defined in CSS through `@theme`
- Latest shadcn/ui (Tailwind v4 compatible)
- Lucide
- pnpm

### D-021 Route structure and reserved usernames (C2)

Usernames live at the root (`modgeto.com/charles`). Application areas use reserved prefixes:

```text
/app/...     Creative and Client workspaces
/admin/...   Admin workspace
/auth/...    Authentication and verification
/dev/...     Protected component showcase
/api/...     Route handlers and webhooks
```

These words, and a maintained blocklist of platform, legal, and common system names (including `modgeto`, `www`, `help`, `support`, `settings`, `pricing`, `about`, `terms`, `privacy`, `blog`, `login`, `signup`), cannot be registered as usernames.

### D-022 Build strategy (C3)

Build the UI first against typed mock fixtures that match the Phase 03 domain types. Build the pure pricing engine and the Request, Service, Proposal, Project, and Subscription state machines on day one with unit tests, because the UI depends on them. Supabase and integrations follow once the UI and domain logic are stable.

### D-023 Data and forms (C4)

- Server Actions for mutations
- React Hook Form + Zod for forms and validation
- Money as integer minor units: `BIGINT` in PostgreSQL, a small `Money` utility in TypeScript (no floating-point arithmetic)
- Vitest for pricing, state-machine, and domain-rule tests

### D-024 Guest persistence (C5)

Guests use Supabase anonymous sign-in so drafts and uploads are stored server-side from the start.

- **Sign-up:** the anonymous user is converted to a permanent user, keeping the same user ID and data.
- **Sign-in to an existing account:** a merge step moves the draft configuration and uploads to the existing account.

### D-025 Analytics (C6)

V1 records analytics in a Postgres `analytics_events` table. A third-party analytics vendor may be added later. Private Brief content must never be written to analytics.

### D-026 Screen implementation order (approved 10 November 2026)

Extends CLAUDE.md §20 step 12 with the Phase 06 screens it did not place. Screens are built on fixtures in this order:

```text
1.  Creative Public Profile
2.  Service Detail (+ Service Unavailable)
3.  Client Configuration
4.  Client Brief
5.  Authentication screens + Client Identification
6.  Review and Submit (+ Request Submitted)
7.  Creative Onboarding
8.  Creative Dashboard
9.  Services
10. Service Builder
11. Public Profile Management + Settings (incl. Payment Methods)
12. Creative Requests list + Creative Request Detail
13. Client Home + Client Requests list + Client Request Detail
14. Notification Centre
15. Subscription
16. Projects
17. Client Account
18. Admin
```

---

## 5. Implementation-Planning Rulings

Approved 10 November 2026. Governing principle for D-027 to D-030: **Request status describes the commercial position. Who owes a reply is derived from RequestResponses, not stored as a status.**

### D-027 Clarification loops (resolves roadmap Q1)

- **Creative asks for clarification:** Request becomes `AWAITING_CLIENT` with sub-type `CLARIFICATION_REQUESTED`.
- **Client answers it:** the Request returns to `SUBMITTED`. The Client sees "Awaiting Creative". The Creative sees the label "Client responded" while the latest RequestResponse is the Client's and has no reply. The Request stays in the Creative **New** grouping and drives the dashboard "Client Responses" attention item.
- **Client asks a question about a pending proposal:** no status change. The Request stays `AWAITING_CLIENT` (`QUOTE_PROPOSED` / `CHANGES_PROPOSED`) and the proposal stays `PROPOSED` and can still be accepted or rejected. A derived "awaiting reply" indicator shows "Client asked a question" to the Creative and "Waiting for the Creative's reply" to the Client.
- **The Creative replies** with a note (no status change) or issues a new proposal (supersedes the previous one, D-008).

### D-028 Payment status derivation and unreceived payments (resolves roadmap Q2)

Payment-stage status is derived from payment records, in this precedence:

```text
confirmed total >= required commitment → READY_TO_START (or AWAITING_TERMS if final terms are outstanding)
any declaration with resolution PENDING → AWAITING_PAYMENT_CONFIRMATION
confirmed total > 0                     → PARTIALLY_CONFIRMED
otherwise                               → AWAITING_COMMITMENT
```

- A new declaration after partial confirmation moves the Request to `AWAITING_PAYMENT_CONFIRMATION`. The confirmed amount remains in the payment summary.
- `ProjectPaymentDeclaration` gains `resolution`: `PENDING` → `CONFIRMED` | `NOT_RECEIVED`.
- A `ProjectPaymentConfirmation` amount must be greater than zero. It records the amount actually received, which may differ from the declared amount.
- **Not received** is an explicit Creative action on a declaration with a required note. Copy must not be accusatory (Brand Guidelines §12.4), for example "[Creative] hasn't received this payment yet."
- The Creative may record a confirmation without a declaration (`declarationId` is already optional).
- Adds a notification to PRD NOT-002: **Payment not received yet**. Client: In-app + Email. Creative: Confirmation.

### D-029 Percentage additional charges (resolves roadmap Q3)

Percentage additional charges apply to the subtotal **after** discount. Each charge is calculated on the same post-discount base (charges do not compound) and rounds half-up on its own line (D-012). Commitment is calculated from the Final Project Total including charges.

### D-030 Changes affecting a Ready-to-Start Request (resolves roadmap Q4)

Ready to Start is derived and recalculated after every relevant write, and revalidated inside the Start Project transaction.

- **Payment correction:** confirmations are immutable. The Creative records a reversing adjustment with a required reason, which is audited. Allowed only before Project Start. If the confirmed total falls below the commitment, the derived status falls back per D-028.
- **Creative becomes Unavailable, or the Service is unpublished or becomes Subscription Inactive:** no effect on existing Requests. Start Project remains available.
- **Either party suspended:** status is unchanged. Start Project is blocked while the suspension lasts.
- **Service becomes Platform Disabled:** existing Requests continue. Moderation blocks only new Requests. An Admin who needs to stop an engagement suspends the user.
- **New proposal after Ready to Start:** allowed before Project Start. The Request moves to `AWAITING_CLIENT`. On acceptance, D-002 requires a new final terms acceptance and the commitment is recalculated. Previously confirmed payments still count.

### D-031 Desktop navigation and UI style direction (supersedes the Creative and Client desktop shells in Phase 04 §7, Phase 06 §11, and Phase 07 §19)

Approved 10 November 2026.

**Navigation by shell:**

| Shell | Desktop (≥1024px) | Tablet (768–1023px) | Mobile (<768px) |
|---|---|---|---|
| Creative | Top pill navigation bar | Bottom navigation + More sheet | Bottom navigation + More sheet (unchanged) |
| Client | Top pill navigation bar | Top pill bar (3 items fit) | Bottom navigation (unchanged) |
| Admin | Sidebar (unchanged) | Sidebar collapses to a drawer | Drawer / stacked lists |

- The top bar is a `neutral-900` segmented pill container. The active item is a white pill (or an Indigo pill), and the active state is also shown by weight and `aria-current`, never colour alone.
- Pages that need sub-navigation add a **section sidebar** beside the content: Requests (groupings with counts), Service Builder (sections with completion states), Settings, and Account.
- Utilities sit top right as round icon buttons with accessible names: notifications and the account/workspace menu.

**Adopted UI style (reference: FacilityFlow and PlanIQ dashboards):** light `background` canvas with white, mostly borderless cards; generous spacing; large light-weight Inter numerals for attention counts and prices; greeting header on the Creative Dashboard; clean tables with search, filters, status pills and pagination on desktop, stacked cards on mobile.

**Explicitly not adopted:** charts, trends, analytics totals (D-017), progress bars, task boards, calendars, meetings, team workload, AI assistant (V2 or out of scope), non-token accent colours, and gradients in the application.

### D-032 Card radius (amends Phase 08 §12 recommended usage)

Approved 10 November 2026. No new radius values are added.

| Element | Radius |
|---|---:|
| Dashboard cards, public Service and work cards, attention cards | 16px (XL) |
| Dense operational cards, table containers, panels | 12px (Large) |
| Inputs, buttons, selection cards | 8px (Medium) |
| Small controls, chips inside cards | 6px (Small) |
| Status badges, nav pills, round icon buttons | Full |

### D-033 Prelaunch landing page (approved 10 November 2026)

A temporary prelaunch landing page is served at `/` to give Modgeto a legitimate online presence (including Paystack merchant review). It is a single page, not the full marketing site.

- It may offer **light and dark themes** (system default plus a toggle). The dark theme is scoped to marketing pages only. The product application (`/app`, `/admin`, `/auth`, storefronts) remains light only per CLAUDE.md §9.
- Decorative use of the brand gradient and motion is allowed on this page (Phase 08 §8 permits public decorative artwork). All motion respects `prefers-reduced-motion`.
- Copy follows the Brand Guidelines. No waitlist, sign-up, or pricing claims beyond what is approved.

### D-034 shadcn/ui primitive library and theming (10 November 2026)

- shadcn/ui is initialised with **Base UI** (`@base-ui/react`, style `base-nova`), shadcn's current default. Radix and React Aria were the alternatives; revisit only if a required primitive is missing or fails accessibility testing.
- shadcn variable names (`card`, `muted`, `accent`, `destructive`, `input`, `ring`, `popover`, `sidebar`) map onto the Phase 08 semantic tokens. shadcn's default neutral palette, chart colours (D-017 defers metrics) and `.dark` block are not used.
- `--secondary` stays Electric Cyan as Phase 08 §5 defines. shadcn's `secondary` button variant is restyled in Phase 4 to the Phase 08 §7 secondary button (white, neutral border), not a cyan fill.
- The radius scale stays 6/8/12/16px (D-032) rather than shadcn's calculated scale. Inter remains the only typeface.

### D-035 Request status after a proposal is rejected (approved 12 November 2026)

Follows the D-027 principle (status shows the commercial position).

- **No earlier agreement:** the Request returns to `SUBMITTED`. It is the Creative's turn to revise the proposal or decline.
- **An earlier agreement exists** (a proposal sent after agreement, D-030): the earlier agreement still stands and the status is re-derived from it (terms, commitment, Ready to Start).
- The rejected proposal is recorded as `REJECTED` and stays in the proposal history.

### D-036 "Valid scope" for publishing (approved 12 November 2026)

PRD SRV-004 requires a valid scope. A Service's scope is valid when it lists **at least one deliverable**. Custom Quote Services are exempt, because their scope is set in the Creative's proposal.

### D-037 Accessible text and control colours (approved 13 November 2026)

Phase 08 §4–5 semantic colours fail WCAG 2.2 AA (4.5:1) as small text on their own subtle backgrounds: Success 3.15:1 and Warning 3.07:1. Badges, banners and inline messages therefore use a darker text step from the same hue. The background, border and icon colours are unchanged.

| Token | Value | Contrast on its subtle background |
|---|---|---:|
| `--success-text` | #15803D | 4.79:1 |
| `--warning-text` | #B45309 | 4.84:1 |
| `--danger-text` | #B91C1C | 5.91:1 |
| `--info-text` | #1D4ED8 | 6.16:1 |

Unselected checkbox, radio and switch boundaries use Muted Text (#64748B, 4.76:1 on white), so the control itself meets the 3:1 non-text contrast requirement (SC 1.4.11).

Text fields, selects and number fields use a new `--border-control` (#7C8AA0: 3.5:1 on white, 3.35:1 on Background) instead of Strong Border (#CBD5E1, 1.48:1). Phase 08 §12–13 asked for Strong Border on inputs, but at 1.48:1 the field boundary fails SC 1.4.11. Strong Border stays for decorative and structural borders, and for secondary buttons, whose text identifies them. Modal backdrops use `--overlay` (Slate 900 at 40%).

### D-038 Marking required and optional fields (approved 13 November 2026)

Most V1 form fields are required, so only optional fields are marked visibly, with "Optional" beside the label. Required fields carry `aria-required` and are not marked with an asterisk. This applies to Brief questions too: a question the Creative marks optional shows "Optional" (doc 01, Required and Optional fields).

---

## 6. Tracked Risks

These are not decisions. They should be validated early.

- **Termii international delivery:** phone OTP is mandatory for all users, including international Clients. Test delivery coverage outside Africa early.
- **Paystack USD:** USD billing requires an eligible Paystack merchant account. Each capacity × market price becomes a separate Paystack plan (up to 18 paid plans).
- **Supabase auth email:** configure Brevo as custom SMTP for Supabase Auth so verification and recovery emails are not limited by Supabase's default sender.
