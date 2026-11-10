# CLAUDE.md

## 1. Purpose

This repository implements **Modgeto**, a link-first platform for independent digital Creatives and technology professionals to package their Services, share personalized links, receive structured Client Requests, agree scope and price, record externally made commitment payments, and explicitly start Projects.

Tagline: **One link to start working with you.**

Read the source-of-truth documents before implementing or changing product behaviour.

## 2. Source Documents

All source documents live in `docs/`. Consult them in order:

```text
docs/01-product-definition-v1.0.md
docs/02-product-requirements-document-v1.0.md
docs/03-business-logic-domain-model-v1.0.md
docs/04-information-architecture-v1.0.md
docs/05-user-flows-v1.0.md
docs/06-ux-wireframes-screen-specification-v1.0.md
docs/07-frontend-design-system-ui-foundation-v1.0.md
docs/08-brand-visual-tokens-v1.0.md
docs/09-modgeto-brand-guidelines-v1.0.md
docs/10-decisions-log-v1.0.md
```

`10-decisions-log-v1.0.md` records rulings that resolve contradictions and gaps in documents 01–09. Where it records a rule, it overrides the earlier documents.

If documents conflict and the decisions log does not resolve it, stop and identify the conflict instead of silently inventing a rule. Record new rulings in the decisions log. Later documents may add implementation detail but must not casually override approved upstream product decisions.

## 3. Locked Technology

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4 (tokens via `@theme` in CSS)
- shadcn/ui primitives
- Lucide icons
- pnpm
- React Hook Form + Zod
- Server Actions for mutations
- Vitest for domain logic
- Supabase PostgreSQL
- Supabase Auth using email/password only (anonymous sign-in for Guest persistence)
- Termii for phone OTP
- Vercel hosting
- Cloudflare R2 file storage
- Brevo transactional email (also Supabase Auth custom SMTP)
- Paystack for Creative-to-Platform subscription billing

No Figma dependency exists. Code is the visual source of truth.

## 4. Locked Product Rules

- Do not invent features.
- Respect the V1/V2 boundary.
- Every Creative receives one free Published Service.
- Active-Service capacity ranges from 1 through 10.
- Capacity pricing must match the approved NGN/USD table in `docs/10-decisions-log-v1.0.md` (D-001) exactly.
- 5 Services is intentionally cheaper than 4, and 10 Services is intentionally cheaper than 9. Never flatten or "fix" the curve.
- Client Project payments happen outside the platform.
- Paystack handles platform subscriptions only.
- Never mix platform-subscription records with Client Project-payment records.
- Client declaration of payment does not equal confirmed receipt.
- Only the Creative confirms the external amount received.
- Only the Creative can Start Project.
- Only the Creative can Close Project.
- Project Start is explicit and never automatic.
- Ready to Start is distinct from Active Project.
- Limited Availability still accepts new Requests.
- Unavailable Creative blocks new Requests but preserves existing Requests.
- A Client may have multiple Requests with the same Creative.
- A Client may request the same Service multiple times for separate Projects.
- Prevent accidental duplicate submissions through idempotency, not a business restriction.
- Structured clarification exists only during Request negotiation.
- Do not turn clarification into Project chat.
- Any change to scope, price, timeline, or commitment is a CommercialProposal requiring Client acceptance.
- Submitted Requests preserve historical Service, scope, Brief, price, commitment, and terms snapshots.
- The Client cannot edit a submitted configuration or Brief.
- Live Service changes must not silently modify submitted Requests.
- Initial Service terms are reviewed/acknowledged at Request submission.
- If terms are unchanged and no accepted proposal changed scope or price, the submission acknowledgement counts as final acceptance.
- Otherwise, final terms are explicitly accepted before Ready to Start.
- Material Terms changes require reacceptance.
- Money uses integer minor units and round-half-up for percentages. Never use floating-point arithmetic for prices.
- V1 Project execution happens outside the platform.

## 5. V1 Project Boundary

V1 Project screens may include:

- Overview
- Agreed Scope
- Original Brief
- Commercial Summary
- Payment Summary
- Original Request
- Start date
- Status
- Close Project for the Creative

Do not add:

- Tasks
- Milestones
- Project chat
- Deliverable uploads
- Feedback
- Revision rounds
- Approval workflows
- Final handoff
- Time tracking
- Formal balance-payment stages

These are V2.

## 6. Authentication Rules

- Email/password only.
- No Google, Apple, GitHub, Microsoft, Facebook, or social login.
- Both Client and Creative require email verification.
- Both Client and Creative require phone verification through Termii OTP.
- Phone OTP supports expiry, attempt limits, resend cooldown, rate limiting, and E.164 phone format.
- Guest Clients may browse, configure, and complete the Brief before authentication.
- Preserve Guest progress through signup, email verification, and phone verification.
- Return users to the interrupted context after authentication or verification.

## 7. Notification Rules

V1 operational notifications use:

- In-app notifications
- Brevo email

Phone/SMS is for OTP security verification, not routine V1 notifications.

Email delivery failure must not reverse a successful business action.

## 8. Mobile Parity

All core Creative and Client V1 workflows must work on supported mobile browsers.

Never add a Continue on Desktop restriction to a core V1 workflow.

Implement mobile, tablet, and desktop behaviour in the same task.

Do not rely exclusively on:

- Hover
- Wide tables
- Drag-and-drop
- Tiny icon-only controls

Provide mobile-accessible alternatives such as Move Up, Move Down, and full-screen sheets.

## 9. UI Foundation

Use:

- Tailwind CSS for layout and responsive styling
- shadcn/ui as accessible primitives, not as the product identity
- Lucide as the sole icon library
- CSS variables and semantic tokens
- Inter as the V1 typeface
- Light mode only in V1

Build product components on top of primitives.

Examples:

```text
ServiceCard
PackageSelector
ProposalComparison
ClarificationPanel
PaymentInstructions
CapacitySelector
```

Do not duplicate an existing component without a justified reason.

## 10. Visual Direction

Use the Professional Core + Creative Storefront direction.

Authenticated application:

- Neutral and restrained
- White surfaces
- Slate text and borders
- Indigo primary actions
- Minimal shadows
- Moderate density

Public Creative storefront:

- More expressive composition
- Strong work imagery
- Larger typography moments
- Controlled Indigo, Cyan, and Coral accents
- Still trustworthy and accessible

## 11. Brand Tokens

Primary:

```text
Electric Indigo #635BFF
Hover #5147E5
Pressed #4238BF
Subtle #F3F2FF
```

Secondary:

```text
Electric Cyan #06B6D4
Subtle #ECFEFF
```

Tertiary:

```text
Creative Coral #F97360
Subtle #FFF4F1
```

Semantic:

```text
Success #16A34A
Warning #D97706
Danger #DC2626
Information #2563EB
```

Foundation:

```text
Background #F8FAFC
Surface #FFFFFF
Subtle Surface #F1F5F9
Primary Text #0F172A
Secondary Text #475569
Muted Text #64748B
Disabled Text #94A3B8
Border #E2E8F0
Strong Border #CBD5E1
```

Use the exact token system in `docs/08-brand-visual-tokens-v1.0.md`. Do not scatter raw colour classes across product components.

## 12. Voice and Terminology

Follow `docs/09-modgeto-brand-guidelines-v1.0.md` for all product copy, CTAs, notifications, emails, and errors.

- Voice: warm, concise, confident, and professional with a creative edge. Filter: **Clear. Capable. Creative.**
- Say what happens next. Write buttons as actions. No emoji in core product voice. No repeated punctuation.
- Use: Creative, Client, Service, Project Request, Submit Request, Project, Commitment, Payment instructions, Payment declared, Payment confirmed, Ready to Start, Start Project, Project Brief, Add-on, Deliverable.
- Never use: Gig, Order, Place Order, Buy Now, Add to Cart, Checkout, Payment successful, Paid (for Ready to Start), Job.
- State that Modgeto does not collect Client Project payments wherever payment instructions appear.
- Never expose private reasons (such as a Creative's subscription status) on public unavailable states.

## 13. UI Rules

- Reuse existing primitives and product components.
- Use semantic tokens.
- Use the approved spacing scale.
- Use the approved typography hierarchy.
- Use the approved radius, border, and shadow rules.
- Preserve keyboard accessibility.
- Use actual form controls behind custom selection cards.
- Do not use colour alone for state or selection.
- Use actor-appropriate status language instead of exposing backend enums.
- Show price modifiers before selection.
- Distinguish Fixed, Starting From, and Custom Quote clearly.
- Do not say Payment Successful for externally paid Client Project money.
- Do not say Order Confirmed for a submitted Request.
- Do not use gradients throughout operational UI.
- Do not implement dark mode in V1.
- Do not add user-controlled storefront colours in V1.

## 14. Accessibility

Target WCAG 2.2 AA.

Requirements:

- Real buttons for actions
- Real links for navigation
- Programmatic labels
- Associated errors and descriptions
- Visible focus states
- Keyboard operation
- Focus-managed dialogs/drawers
- Accessible names for icon-only controls
- Reduced-motion support
- Non-colour-only status meaning
- Useful descriptions for visual Brief options

## 15. Project Organisation

```text
docs/

src/

app/

components/
  ui/
  layout/
  service/
  brief/
  request/
  project/
  payment/
  subscription/
  notifications/

features/
  auth/
  creative-profile/
  services/
  requests/
  projects/
  subscriptions/

lib/
  domain/        pure pricing engine, state machines, money utilities (unit-tested)
  fixtures/      typed mock data matching the Phase 03 domain types

types/

styles/
```

- `components/ui`: generic visual/accessibility primitives
- product component folders: reusable product presentation
- `features`: business composition, data/state/actions, feature-specific logic
- `lib/domain`: framework-free business logic; no React, no I/O

Avoid an unstructured single components folder.

## 16. Routing

Usernames live at the root (`/charles`, `/charles/brand-identity`). Application areas use reserved prefixes:

```text
/app     Creative and Client workspaces
/admin   Admin workspace
/auth    Authentication and verification
/dev     Protected component showcase
/api     Route handlers and webhooks
```

All reserved prefixes and the username blocklist (D-021) must be rejected as usernames.

## 17. Component Quality Gate

Before a reusable component is considered ready:

- Typed props
- Semantic token styling
- Responsive behaviour
- Keyboard behaviour
- Accessible names/roles
- Disabled/loading/error states where applicable
- Visual example in the component showcase

## 18. Screen Quality Gate

Before a screen is considered complete:

- Mobile and desktop work
- Empty, loading, and error states exist
- Keyboard navigation works
- No unapproved feature was added
- Actor-facing status language is correct
- Copy follows the Modgeto voice and terminology
- Exact/estimated/quote pricing language is correct
- External payment language is accurate
- V1/V2 boundary is preserved
- Existing components are reused
- No Figma dependency was introduced

## 19. Component Showcase

Use Storybook when introduced or the protected development route:

```text
/dev/components
```

Show:

- Buttons
- Fields
- Selection cards
- Status badges
- Service cards
- Pricing
- Brief questions
- Request states
- Payment states
- Capacity selector
- Empty/loading/error states

Do not expose the development route publicly in production.

## 20. Implementation Order

UI is built first against typed fixtures (D-022). Domain logic is built and tested from day one.

1. Initialize Next.js + TypeScript (pnpm).
2. Add Tailwind CSS v4.
3. Add and theme shadcn/ui primitives.
4. Add Lucide.
5. Implement semantic tokens and Inter.
6. Build `lib/domain`: Money utility, pricing engine, and state machines, with Vitest tests.
7. Build typed domain types and mock fixtures.
8. Build generic UI primitives.
9. Build application shells.
10. Build product components.
11. Build component showcase.
12. Implement screens in this order (extended by D-026 in the decisions log, which places Auth, Onboarding, Profile Management, Settings, Client Home, Notifications, and Client Account):

```text
Creative Public Profile
Service Detail
Client Configuration
Client Brief
Review and Submit
Creative Dashboard
Services
Service Builder
Creative Request Detail
Client Request Detail
Subscription
Projects
Admin
```

13. Then Supabase schema, auth, and integrations.

## 21. Working Method

Before implementing a feature:

1. Read the relevant source-document sections, including the decisions log.
2. Identify approved states and permissions.
3. Reuse existing primitives/components.
4. Implement mobile, tablet, and desktop together.
5. Add empty/loading/error states.
6. Verify accessibility.
7. Verify the V1 boundary.
8. Run type checks, linting, and tests.
9. Do not silently change product rules to simplify implementation.
