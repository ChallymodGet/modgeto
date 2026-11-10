# Phase 06: UX / Wireframes & Screen Specification

**Document:** 06-ux-wireframes-screen-specification-v1.0.md  
**Status:** Complete  
**Version:** 1.0  
**Date:** 10 November 2026  
**Source of truth:** Phases 01–05  
**Next phase:** Phase 07, Frontend Design System / UI Foundation

> **Revision notice (10 November 2026):** §70 capacity table and the 10-Service discount explanation are superseded by `10-decisions-log-v1.0.md` D-001 (discounts at both 5 and 10 Services). §40 Terms Model is clarified by D-002. Copy follows `09-modgeto-brand-guidelines-v1.0.md`. §11 Creative and Client desktop shells use a top pill navigation bar per D-031.

---

## 1. Purpose

This document translates the approved Product Definition, PRD, Domain Model, Information Architecture, and User Flows into implementation-ready UX specifications.

There is no Figma UI phase. The product interface will be designed and implemented directly in React, Next.js, and TypeScript. These specifications therefore define screen purpose, layout, hierarchy, interactions, responsive behaviour, component needs, validation, system states, and V1 boundaries.

---

## 2. Core UX Principles

1. Mobile and desktop have functional parity.
2. Public pages prioritize understanding and conversion.
3. Client experiences remain guided and lightweight.
4. Creative experiences prioritize action and operational clarity.
5. Admin experiences may be denser but must remain responsive.
6. Price-changing selections show their effect immediately.
7. Client Project payments are external and must never be presented as platform-processed.
8. Ready to Start is distinct from Active Project.
9. Submitted Service, Brief, pricing, and terms snapshots remain historically accurate.
10. V1 Project screens must not introduce V2 execution features.

---

# 06A. Complete V1 Screen Inventory

## 3. Public

- Creative Public Profile
- Service Detail
- Service Unavailable
- Service Configuration
- Configuration Price Summary
- Client Brief
- Client Identification
- Request Review
- Request Submitted

## 4. Authentication

- Sign Up
- Sign In
- Verify Email
- Verify Phone
- Forgot Password
- Reset Password
- Verification Error / Expired

## 5. Creative Onboarding

- Creative Introduction
- Public Identity
- Professional Profile
- Business Preferences
- Payment Setup
- First Service Entry

## 6. Creative Workspace

- Dashboard
- Services
- Service Builder sections
- Public Profile Management
- Requests
- Request Detail
- Request Changes
- Proposal Editor
- Payment Confirmation
- Ready-to-Start state
- Projects
- Project Detail
- Subscription
- Settings
- Notifications

## 7. Client Workspace

- Home
- Requests
- Request Detail
- Proposal Review
- Clarification
- Terms Acceptance
- Payment Instructions
- Payment Declaration
- Partial Commitment
- Ready-to-Start state
- Projects
- Project Detail
- Account
- Notifications

## 8. Admin

- Overview
- Users
- User Detail
- Services
- Service Detail
- Categories
- Requests
- Request Detail
- Projects
- Project Detail
- Subscriptions
- Subscription Detail
- Capacity Pricing
- Billing Events
- Moderation
- Audit
- Audit Event Detail
- Platform Settings

## 9. Shared System States

- Empty
- Loading
- Error
- Permission Denied
- Not Found
- Resource Unavailable
- Offline / Connection Problem
- Confirmation dialogs
- Drawers and full-screen mobile sheets

---

# 06B. Responsive UX Foundation

## 10. Viewport Strategy

| Range | Classification | Behaviour |
|---|---|---|
| 320–767px | Mobile | Single-column, touch-first |
| 768–1023px | Tablet | Adaptive one/two-column |
| 1024–1439px | Desktop | Sidebar and workspace |
| 1440px+ | Large desktop | Wider constrained workspace |

Exact CSS breakpoints are finalized in Phase 07.

## 11. Shells

### Public

```text
Header
Content
Footer
```

### Creative Desktop

```text
Sidebar | Main Workspace
```

### Creative Mobile

```text
Header
Content
Bottom Navigation: Home / Requests / Services / Projects / More
```

### Client Desktop

A lighter navigation shell with Home, Requests, and Projects.

### Client Mobile

```text
Header
Content
Bottom Navigation: Home / Requests / Projects / Account
```

### Admin

```text
Admin Sidebar | Operational Workspace
```

## 12. Responsive Rules

- Public readable content uses constrained containers.
- Application content can use wider workspace layouts.
- Forms use vertically stacked labels, guidance, input, and validation.
- Desktop configuration may use content plus sticky summary.
- Mobile configuration uses a collapsible price summary.
- Desktop drawers become full-screen mobile sheets where needed.
- Wide tables become stacked cards/lists on mobile.
- Drag-and-drop is never the only reordering mechanism.
- Primary touch targets should generally be at least 44px.
- Sticky actions are used only when one dominant action exists.

## 13. Accessibility

V1 targets WCAG 2.2 AA.

- Real buttons and links
- Semantic form controls
- Programmatic labels
- Error associations
- Visible focus states
- Focus-managed dialogs and drawers
- Non-colour-only status communication
- Accessible visual-choice descriptions
- Reduced-motion support

---

# 06C. Creative Public Profile

## 14. Purpose

Help a visitor understand who the Creative is, whether they are available, what they offer, what it may cost, whether their work is credible, and how to start.

## 15. Hierarchy

```text
Header
Creative Identity
Availability
Introduction
Primary Start-a-Project CTA
Services
Selected Work
About
Professional Links
Repeated CTA / Footer
```

## 16. Service Cards

- Cover image, when available
- Service name
- Short description
- Pricing state
- Turnaround summary
- View Service CTA

## 17. Responsive Behaviour

Desktop may use multi-column Service and work grids. Mobile uses a single-column hierarchy with the primary CTA appearing before Services and optionally repeated later.

## 18. Availability

- Available: Requests enabled
- Limited: Requests enabled, constraint communicated
- Unavailable: exploration allowed, new Requests disabled

No Selected Work section is rendered when no samples exist.

---

# 06D. Service Detail

## 19. Purpose

Help the Client decide whether the Service matches their need before entering configuration.

## 20. Structure

```text
Creative Context
Service Hero
Pricing State
Description
Configure CTA
What You Get
Packages / Pricing
Available Add-ons Summary
Delivery
Revisions
Relevant Work
Key Terms
Repeated Configure CTA
```

## 21. Desktop

Main Service content can sit beside a sticky commercial summary containing price, turnaround, revisions, and Configure CTA.

## 22. Mobile

All content stacks. A sticky bottom Configure CTA may be used if it does not obscure content.

## 23. Pricing Language

- Fixed: exact amount
- Starting From: explicitly labelled estimate with Creative review explanation
- Quantity: amount per unit
- Packages: packages from lowest amount
- Custom Quote: Request a Quote without fabricated numbers

---

# 06E. Client Service Configuration

## 24. Purpose

Allow the Client to select what they need, how they want it, and understand scope and price effects before completing the Brief.

## 25. Adaptive Step Structure

```text
1. Base Service / Package
2. Customize Service
3. Delivery
4. Project Brief
5. Review
```

Empty/non-applicable steps are omitted.

## 26. Desktop

```text
Configuration Content | Sticky Project / Price Summary
```

## 27. Mobile

```text
Progress
Current Step
Configuration Content
Collapsible Current Total
Continue
```

## 28. Selection Patterns

### Add-ons

Card-based optional paid selections with title, description, and visible price modifier.

### Options

Single- or multi-selection cards. Example Website Platform / Tool options include Figma, Webflow, WordPress, Framer, and I'm not sure.

### Quantity

Stepper/input with unit amount, minimum, maximum, and item subtotal.

### Delivery

Selectable cards showing turnaround and price effect.

## 29. Dependencies

When a selection requires another item, the Client receives a clear explanation and a direct Add Prerequisite action where appropriate.

## 30. Pricing

- Every price-changing selection displays the amount before selection.
- The summary updates immediately.
- Starting-From Services retain estimate language.
- Custom Quote Services show Quote Required.
- Back navigation preserves unrelated downstream answers.

---

# 06F. Client Brief

## 31. Purpose

Collect complete Project information without recreating a long, unstructured form experience.

## 32. Long Brief Structure

```text
Brief Introduction
Section Progress
Current Section
Questions
Back / Continue
```

Desktop may show progress navigation beside the form. Mobile uses section progress and stacked questions.

## 33. Supported UX Patterns

- Short and long text
- Single and multiple choice
- Dropdown
- Number
- URL
- File upload
- Multiple-file upload
- Visual/image selection
- One-level conditional questions

## 34. Visual Selection

The Creative uploads their own reference examples. Client selections use borders, check indicators, and accessible selected state, not colour alone.

## 35. Uploads

Uploads show filename, progress, success, failure, retry, and removal. A failed upload does not erase completed answers.

## 36. Validation

Continue validates the current section and moves focus to the first invalid required field. Hidden conditional questions do not block progress.

## 37. Persistence

- Authenticated Client: server autosave
- Guest: Guest-session persistence
- UI may show a subtle Saved state

---

# 06G. Review & Submit

## 38. Purpose

Allow the Client to confirm the complete Request before sending it to the Creative.

## 39. Content

- Creative and Service
- Package/base selection
- Deliverables
- Add-ons
- Options
- Quantities
- Delivery
- Price or pricing state
- Commitment if accepted
- Brief completion
- Initial Service terms acknowledgement
- Submission explanation

## 40. Terms Model

> **Clarified by `10-decisions-log-v1.0.md` D-002.**

Locked model:

1. Initial Service terms are reviewed/acknowledged at Request submission.
2. Final terms are explicitly accepted before Ready to Start.
3. Reacceptance is required only after material Terms changes.
4. Unchanged terms should not trigger meaningless duplicate acceptance.

## 41. Messaging

Submission does not automatically:

- Start the Project
- Charge the Client
- Finalize a Starting-From estimate
- Finalize a Custom Quote

## 42. Submission

```text
Validate Service
Validate Scope
Validate Brief
Validate Identity
Snapshot Request
Create Request Idempotently
Notify Creative
```

## 43. Success

The confirmation explains:

1. Creative reviews the Request.
2. They may accept or propose changes.
3. Scope, price, and terms are agreed.
4. Payment instructions appear if commitment is required.
5. Creative starts the Project when all conditions are complete.

---

# 06H. Creative Dashboard

## 44. Purpose

Show what needs Creative attention immediately.

## 45. Structure

```text
Greeting / Header
Needs Attention
Request Overview
Active Projects
Service Capacity
Quick Actions
```

## 46. Attention Priority

1. Ready to Start
2. Payment requiring verification
3. New Request
4. Client response
5. Service issue
6. Subscription issue

## 47. New-Creative State

Show an activation checklist and Create Your First Service CTA rather than empty metrics.

## 48. No-Request State

Show the live public link and Copy My Link action.

## 49. Mobile

All sections stack by urgency. No operational capability disappears.

---

# 06I. Creative Services

## 50. Structure

- Capacity usage and subscription summary
- Create Service action
- Search
- Status filters
- Service cards/list

## 51. Service Item

- Cover
- Name
- Pricing state
- Status
- Last updated
- Contextual actions

## 52. Inactive Service

Subscription-inactive Services appear muted but remain editable. Increase Capacity is the primary recovery action.

---

# 06J. Service Builder

## 53. Builder Shell

Desktop:

```text
Global Navigation | Builder Navigation | Current Section
```

Mobile:

```text
Header
Section Progress
Current Section
Content
Previous / Continue
```

## 54. Sections

- Basics
- Pricing
- Scope
- Add-ons and Options
- Delivery and Revisions
- Client Brief
- Terms
- Commitment and Payment
- Work Samples
- Preview and Publish

## 55. Builder States

- Complete
- Requires attention
- Optional/incomplete
- Saving
- Saved
- Save failed

## 56. Pricing Configuration

The selected pricing model dynamically controls the configuration UI for Fixed, Starting From, Quantity, Packages, and Custom Quote.

## 57. Brief Builder

Sections and questions can be added, edited, reordered, and previewed. Desktop question editing may use a right drawer; mobile uses a full-screen editor.

## 58. Preview & Publish

Includes a readiness checklist and previews for public Service, Client configuration, and Client Brief. Publication blockers link directly to affected sections.

---

# 06K. Creative Request UX

## 59. Structure

```text
Header and Contextual Actions
Overview
Scope
Client Brief
Agreement
Payment
History
```

## 60. Request Changes

A focused editor captures note, scope/timeline changes, price effect, and revised total.

## 61. Proposal Editor

Captures scope, price, discount, charges, delivery, commitment, and note.

## 62. Payment Confirmation

Shows the Client declaration and proof while requiring the Creative to enter the amount actually received after checking the external account.

## 63. Ready to Start

Positive checklist:

- Scope agreed
- Price agreed
- Brief complete
- Terms accepted
- Commitment confirmed or not required

Primary action: Start Project.

---

# 06L. Client Request UX

## 64. Shared Structure

- Overview
- Your Selection
- Your Brief
- Agreement
- Payment
- History

## 65. Proposal Review

Shows previous value, proposed value, difference, changed scope, timeline, and commitment.

Actions:

- Accept Proposal
- Ask for Clarification
- Reject Proposal

## 66. Clarification

A contextual, narrow Request discussion without presence, reactions, calls, voice notes, or post-start Project chat.

## 67. Payment

Shows Project total, commitment, amount required, external payment instructions, declarations, confirmations, and remaining commitment.

## 68. Ready to Start

Client sees a waiting state. The Client does not receive a Start Project action.

---

# 06M. Subscription UX

## 69. Overview

- Current active-Service capacity
- Used capacity
- Current monthly price
- Billing state
- Renewal date
- Change Capacity action

## 70. Capacity Selector

The user selects an active-Service limit from 1 through 10 rather than choosing conventional named plans.

> **Superseded by `10-decisions-log-v1.0.md` D-001.**

| Capacity | NGN | USD |
|---:|---:|---:|
| 1 | ₦0 | $0 |
| 2 | ₦2,000 | $2 |
| 3 | ₦4,000 | $4 |
| 4 | ₦6,000 | $6 |
| 5 | ₦8,000 | $8 |
| 6 | ₦10,000 | $10 |
| 7 | ₦12,000 | $12 |
| 8 | ₦14,000 | $14 |
| 9 | ₦16,000 | $16 |
| 10 | ₦15,000 | $15 |

The 10-Service discount is intentionally explained as saving ₦1,000/$1 compared with 9.

## 71. Downgrade

Creative selects which Services remain active and which Service uses the free slot. Excess Services are retained but become Subscription Inactive.

## 72. Paystack Pending

The UI shows confirmation pending until server/webhook verification. Browser return alone does not activate capacity.

---

# 06N. Project UX

## 73. Project Detail

- Overview
- Agreed Scope
- Original Brief
- Commercial Summary
- Payment Summary
- Original Request

## 74. Creative Action

Active Projects expose Close Project with a confirmation explaining the V1 boundary.

## 75. V1 Boundary

No Project tasks, progress percentage, messages, deliverable uploads, milestones, revisions, approval, or final-handoff flow.

---

# 06O. Admin UX

## 76. Admin Overview

- Needs attention
- Platform snapshot
- Recent activity
- Quick actions

## 77. Operational Views

Dense desktop tables may be used for users, Services, Requests, Projects, subscriptions, and audit. Mobile uses stacked cards/lists.

## 78. Consequential Actions

Suspending users and disabling Services require reason, explicit confirmation, and audit capture.

## 79. Capacity Pricing

Admin sees and manages effective-dated pricing without overwriting historical billing events.

---

# 06P. Components, States & UX Validation

## 80. Foundation Components

- Button
- IconButton
- Link
- Input
- Textarea
- NumberInput
- Select
- Checkbox
- Radio
- Switch
- FormField
- Badge
- Avatar
- Card
- Dialog
- Drawer
- BottomSheet
- Tabs / Section Navigation
- DropdownMenu
- Tooltip
- Toast
- Skeleton
- EmptyState
- ErrorState

## 81. Product Components

- ServiceCard
- PackageSelector
- AddOnSelector
- OptionSelector
- QuantityControl
- DeliverySelector
- PriceBreakdown
- BriefProgress
- QuestionRenderer
- VisualChoice
- FileUploader
- RequestCard
- ProposalComparison
- ClarificationPanel
- TermsPanel
- PaymentInstructions
- PaymentDeclarationForm
- PaymentConfirmationForm
- CommitmentProgress
- ProjectCard
- CapacitySelector
- CapacityUsage
- ServiceAllocation
- NotificationItem
- AttentionItem

## 82. Component States

Applicable components require:

- Default
- Hover
- Focus
- Active
- Selected
- Disabled
- Loading
- Empty
- Error
- Success
- Validation error

## 83. Validated Outcomes

The UX supports:

- Mobile-only Creative operation
- Mobile-only Client conversion and Request submission
- Transparent exact, estimated, and quote pricing
- Structured Briefs with visual examples
- Declared-versus-confirmed payment distinction
- Explicit Ready-to-Start and Project Start separation
- Historical Request integrity
- Clear 1–10 Service capacity pricing
- Explicit V1/V2 Project boundary

---

## 84. Phase 06 Completion Status

Phase 06 is complete.

There are no unresolved product clarifications blocking Phase 07.

The next phase is **Phase 07: Frontend Design System / UI Foundation**, implemented directly in code without a Figma dependency.
