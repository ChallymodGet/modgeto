# Phase 02: Product Requirements Document

**Document:** 02-product-requirements-document-v1.0.md  
**Status:** Approved for Phase 03  
**Version:** 1.0  
**Date:** 8 November 2026  
**Source of truth:** Phase 01 Product Definition v1.0  
**Next phase:** Phase 03, Business Logic / Domain Model

> **Revision notice (10 November 2026):** The product is named **Modgeto**. SUB-001 Approved Plans is superseded by the 1–10 capacity model and pricing in `10-decisions-log-v1.0.md` D-001. SRV-003: Platform Disabled is a moderation overlay, not a lifecycle state (D-003). TRM-003 is clarified by D-002. §28 Request states are revised by D-006 and D-007. Other rulings affecting this document: D-005, D-008 to D-025.

---

## 1. Document Purpose

This PRD defines the functional, business, user, system, integration, and quality requirements for V1 of the platform.

It translates the approved Product Definition from **what the product is** into **how the product must behave**. It is the requirements reference for domain modelling, information architecture, user flows, UX, UI, frontend development, backend development, QA, and release validation.

---

## 2. Product Overview

The product is a link-first service configuration and project initiation platform for independent digital creatives and technology professionals.

A Creative can package configurable services, define pricing and scope, build service-specific Client Briefs, configure terms and commitment requirements, publish a personalized link, receive structured Project Requests, agree scope and price with the Client, provide external payment instructions, confirm receipt of required commitment, and explicitly start the Project.

Example public URLs:

```text
platform.com/charles
platform.com/charles/brand-identity
```

V1 covers Project initiation. Detailed Project execution takes place outside the platform.

---

## 3. Problem Statement

Creatives frequently receive Project enquiries through portfolios, social media, messaging apps, email, and referrals. Turning those enquiries into properly scoped Projects requires repetitive communication about services, prices, deliverables, revisions, timelines, requirements, references, terms, payment details, and Project-start conditions.

The platform gives each Creative a reusable personalized link through which prospective Clients can understand, configure, brief, price, and initiate work based on the Creative's own services and commercial rules.

---

## 4. Product Vision

> Make starting a Project with an independent Creative as structured and straightforward as configuring a service online, without taking control of the Creative's pricing, Client relationship, or Project payments.

---

## 5. Goals

- Reduce repetitive Project-intake conversations.
- Improve the completeness and quality of submitted Client Requests.
- Support configurable services across design, development, writing, motion, and related disciplines.
- Give Creatives control over scope, pricing, terms, payment methods, commitment fees, acceptance, and Project Start.
- Make the personalized link reusable across portfolios, websites, social profiles, email, and messaging apps.
- Clearly distinguish exact prices, estimates, and custom quotes.
- Establish an explicit Ready-to-Start state and Creative-controlled Project Start.
- Monetize through published-Service capacity rather than commission on Client Project value.
- Provide full functional parity for Creative and Client core workflows on mobile.

---

## 6. Non-Goals

V1 does not include:

- Freelancer bidding
- Client job boards
- Marketplace-first discovery
- Freelancer ranking
- Escrow
- Client Project-payment processing
- Project-payment wallet
- Automatic bank-transfer verification
- Commission on Client Project value
- Full portfolio website builder
- Blogging or case-study CMS
- Project deliverable management
- Project file collaboration after Project Start
- Feedback and revision tracking after Project Start
- Milestones, tasks, or Project messaging
- Final asset handoff
- Formal e-signatures
- Automatic currency conversion
- Social-media authentication

---

## 7. Target Users

### Creatives

Independent digital creatives and technology professionals, including:

- Graphic and Brand Designers
- UI/UX and Product Designers
- Web and Motion Designers
- Illustrators
- Frontend, Backend, Full-stack, and Mobile Developers
- Webflow, WordPress, Framer, and no-code professionals
- Copywriters, Content Writers, UX Writers, and Technical Writers
- Video Editors and related digital media professionals

### Clients

Any individual or organisation commissioning work, including individuals, startups, businesses, agencies, organisations, and returning Clients.

Client type is informational and does not create separate V1 roles or workflows.

---

## 8. Roles

### Guest

An unauthenticated visitor who can browse a public Creative profile, view available Services, begin configuration, and complete a Brief before authentication.

### Client

An authenticated and verified user commissioning work from a Creative.

### Creative

An authenticated and verified service provider who owns a public profile, Services, incoming Requests, payment confirmations, and Projects.

### Admin

An authorised platform operator responsible for users, categories, plans, moderation, support visibility, and platform configuration.

---

## 9. Product Principles

1. **Creative-Controlled:** Creatives control their services and commercial relationship.
2. **Link-First:** The personalized profile and direct Service links are primary product surfaces.
3. **Client-Simple:** Browsing and configuration begin without mandatory account creation.
4. **Structured Before Starting:** The Creative receives sufficient information before work begins.
5. **Transparent Pricing:** Fixed, estimated, quoted, discounted, and additional charges remain distinguishable.
6. **Discipline-Flexible:** The product must not be hard-coded around one creative profession.
7. **Commercial Ownership:** Client Project payments remain external to the platform.
8. **Explicit State Changes:** Commercial and lifecycle states change through explicit actions.
9. **Historical Integrity:** Submitted Requests retain the Service, Brief, price, and terms shown to the Client.
10. **Mobile Capability Parity:** All core Creative and Client workflows must be completable on supported mobile browsers.

---

## 10. Requirement Identifier Families

| Prefix | Domain |
|---|---|
| AUTH | Authentication |
| PROF | Creative Profile |
| PUB | Public Experience |
| SRV | Service Management and Builder |
| PRC | Pricing |
| BRF | Brief Builder |
| CFG | Client Configuration |
| REQ | Requests |
| QTE | Quotes and Price Changes |
| TRM | Terms |
| PAY | External Project Payment |
| PRJ | Project |
| SUB | Subscription |
| NOT | Notifications |
| ADM | Admin |
| NFR | Non-Functional Requirements |
| ANA | Analytics |

---

# 11. Roles and Permissions

## Guest

- View eligible public Creative profiles.
- View Published and available Services.
- Begin and continue Service configuration.
- Complete a Brief before authentication.
- Cannot submit until Client identity, email, and phone are verified.

## Client

- View only their own Requests and Projects.
- Submit a valid Request.
- Respond to Creative-requested changes.
- Accept or reject proposed scope and price.
- Accept terms.
- Withdraw before Project Start.
- Declare external payment.
- View relevant payment instructions at the appropriate stage.
- Cannot confirm payment receipt.
- Cannot start or close a Project.

## Creative

- Manage their own profile, Services, Briefs, pricing, payment methods, Requests, and Projects.
- Publish only within available Service capacity.
- Accept, change, quote, or decline Requests.
- Confirm actual external payments received.
- Start and close Projects.
- Manage subscriptions and free/paid Service slots.

## Admin

- View users and operational records for authorised support.
- Suspend and restore accounts.
- Manage Service categories.
- Moderate Published Services.
- View plans and subscription status.
- Manage plan configuration.
- Cannot normally confirm Client Project payments on behalf of a Creative.

---

# 12. Authentication and Verification

## AUTH-001 Unified Account

One underlying account identity is used per email address. A user may act as both Creative and Client in different contexts.

## AUTH-002 Email and Password Only

V1 authentication supports:

- Email and password registration
- Email and password sign-in
- Email verification
- Password reset

V1 does not support Google, Apple, Microsoft, GitHub, Facebook, or other social login.

## AUTH-003 Email Verification

Both Creative and Client accounts must verify email.

- Creative cannot publish a Service before verification.
- Client cannot submit a Request before verification.

## AUTH-004 Phone Verification

Both Creative and Client accounts must provide and verify a phone number using a time-limited, single-use OTP.

Phone verification must include:

- OTP expiry
- Attempt limits
- Resend cooldown
- Rate limiting
- E.164-format phone numbers

Phone is used for security verification, not V1 operational SMS notifications.

## AUTH-005 Client Identity

Minimum Client account information:

- Full name
- Email
- Phone number
- Password

## AUTH-006 Guest Progress Preservation

Guest configuration, Brief answers, uploads, and pricing must survive authentication and verification.

## AUTH-007 Recovery and Sessions

Users must be able to:

- Request password reset
- Use a time-limited, single-use reset mechanism
- Sign out
- Resume persisted work after reauthentication where safely possible
- Access persisted state across supported mobile and desktop browsers

## AUTH-008 Account Deletion

Users may request account deletion. Historical, billing, security, legal, and audit records must be handled according to the final retention and anonymisation policy.

---

# 13. Creative Onboarding

## PROF-001 Creative Profile Enablement

An authenticated user can enable Creative capabilities and receive access to the Creative workspace.

## PROF-002 Required Public Information

Before public profile activation:

- Display name
- Unique username
- Professional title
- Short introduction
- Verified email
- Verified phone

Optional:

- Profile image
- Location
- Disciplines
- Portfolio and professional links

## PROF-003 Username

Username rules:

- Unique and case-insensitive
- 3 to 30 characters
- Lowercase letters, numbers, and hyphens
- No spaces
- No leading or trailing hyphen
- Reserved platform names prohibited

Username changes should preserve old-link redirects for a defined retention period.

## PROF-004 Business Preferences

Creative onboarding supports:

- Availability
- Default currency
- Default commitment requirement and percentage
- External payment methods

Payment setup can be skipped during onboarding but must exist before a payment-requiring Service can operate through the payment stage.

## PROF-005 Activation Goal

Creative onboarding is complete at profile setup, but product activation is measured separately when the first Service is published.

## PROF-006 Save and Resume

Onboarding must persist across sessions and devices.

---

# 14. Creative Public Profile

## PUB-001 Profile URL

Every eligible Creative receives:

```text
platform.com/username
```

## PUB-002 Service URL

Every Published Service receives:

```text
platform.com/username/service-slug
```

## PUB-003 Public Content

Public profile supports:

- Display name
- Professional title
- Short introduction
- Optional profile image
- Optional location
- Disciplines
- Availability
- Published Services
- Selected work
- External professional links
- Primary Start-a-Project CTA

Verified account email and phone must not automatically become public.

## PUB-004 Availability

Supported Creative availability states:

- Available
- Limited Availability
- Unavailable

When Creative is Unavailable, profile remains visible but new Requests are blocked.

## PUB-005 Service Cards

Service cards show:

- Name
- Short description
- Cover where available
- Pricing state
- Turnaround summary where available
- View/Configure CTA

## PUB-006 Pricing Labels

- Fixed: `$150`
- Starting From: `Starting from $300`
- Quantity: `$20 / page`
- Packages: `Packages from $200`
- Custom Quote: `Request a Quote`

## PUB-007 Public Boundary

The public page is a commissioning storefront, not a full portfolio CMS, blog, social network, CV builder, or marketplace bidding profile.

## PUB-008 Sharing

Creative can copy/share:

- Profile URL
- Direct Service URL

Native mobile sharing should be used where supported, with Copy Link fallback.

## PUB-009 Unavailable States

Draft, Unavailable, Subscription Inactive, Platform Disabled, and removed Services must not expose an active commissioning flow. Existing URLs should show a useful unavailable state and route to other available Services where applicable.

---

# 15. Service Management

## SRV-001 Ownership

Every Service belongs to exactly one Creative in V1.

## SRV-002 Drafts

- Draft creation does not require available paid capacity.
- Drafts do not consume published-Service capacity.
- Incomplete Drafts can be saved.
- Drafts persist across sessions and devices.
- Builder changes should autosave with visible saving status.

## SRV-003 Service States

> **Amended by `10-decisions-log-v1.0.md` D-003:** Platform Disabled is a moderation overlay, not a lifecycle state.

- Draft
- Published
- Unavailable
- Subscription Inactive
- Platform Disabled
- Archived

These states must remain distinct because their causes and recovery actions differ.

## SRV-004 Publish Validation

A Service must meet publication requirements, including:

- Name
- Description
- Category
- Valid pricing model
- Valid scope
- Standard turnaround
- Revision configuration
- Terms
- Valid Brief
- Commitment configuration
- Payment method when commitment is required
- Available published-Service capacity

## SRV-005 Publication

Publishing:

- Changes status to Published
- Consumes a Service slot
- Enables public URL
- Enables Client configuration

## SRV-006 Preview

Creative can preview the public Service, Client configuration, Brief, and pricing before publication on desktop and mobile.

## SRV-007 Editing Published Services

Creative may edit Published Services. Changes affect future configurations and Requests only.

## SRV-008 Snapshot Protection

Submitted Requests preserve the Service configuration existing at submission. Later Service edits must not rewrite them.

## SRV-009 Unpublish

Unpublishing:

- Removes regular public access
- Blocks new Requests
- Frees the published-Service slot
- Preserves history

## SRV-010 Unavailable

A Creative may keep a Service publicly visible while blocking new Requests. An Unavailable Service still consumes published capacity.

## SRV-011 Subscription Inactive

When capacity is lost:

- Excess Services are greyed/disabled for the Creative
- New Requests are blocked
- Configuration is retained
- Public URL shows unavailable state
- Existing Requests and Projects continue independently

## SRV-012 Archive and Delete

- Services with submitted Request or Project history are archived rather than destructively deleted.
- Eligible Drafts with no history may be permanently deleted after confirmation.
- Archived Services may be restored to Draft where valid.

## SRV-013 Slugs

Service slugs are unique within a Creative profile. Previous published slugs should redirect for a defined retention period after changes.

## SRV-014 Ordering and Filtering

Creative can:

- Reorder Published Services
- Filter by status
- Search own Services by name

Mobile must provide alternatives to drag-and-drop.

## SRV-015 Duplication

Service duplication is a V1 Should Have. A duplicate becomes a new Draft and copies configuration but not Clients, Requests, Projects, or analytics.

---

# 16. Service Builder

The builder is organised into:

1. Basics
2. Pricing
3. Scope
4. Add-ons and Options
5. Delivery
6. Revisions
7. Client Brief
8. Terms
9. Commitment and Payment
10. Work Samples
11. Preview and Publish

## SRV-016 Basics

Required:

- Name
- Short description
- Category
- Pricing model

Optional:

- Detailed description
- Cover
- Work samples

## SRV-017 Deliverables

Each deliverable supports:

- Name
- Optional description

## SRV-018 Add-ons

Each add-on supports:

- Name
- Description
- Price
- Optional quantity
- Optional dependency
- Package availability

## SRV-019 Options

Options can be:

- Single-select
- Multi-select
- Required
- Optional
- Free
- Paid

Example Website Platform / Tool options:

- Figma
- Webflow
- WordPress
- Framer
- I'm not sure, recommend one

These are Creative-configured options, not globally hard-coded choices.

## SRV-020 Quantity

Quantity configuration supports:

- Unit name
- Unit price
- Minimum
- Optional maximum
- Default quantity

## SRV-021 Dependencies

V1 supports simple dependencies:

> Item B requires Item A.

## SRV-022 Delivery

Creative configures:

- Standard turnaround
- Business days, calendar days, or weeks
- Optional Priority and Rush choices
- Optional price modifiers

## SRV-023 Revisions

Creative configures:

- No revisions
- Fixed number
- Unlimited
- Optional additional-revision price

## SRV-024 Terms

Creative configures readable Service-specific commercial and working terms.

## SRV-025 Commitment and Payment

Service may:

- Require no commitment
- Inherit Creative default
- Override with a Service-specific percentage

Where payment is required, at least one valid Creative payment method must be selected.

---

# 17. Pricing Engine

## PRC-001 Primary Pricing Models

Every Service uses exactly one:

- Fixed
- Starting From
- Quantity-Based
- Package-Based
- Custom Quote

## PRC-002 Fixed

Requires a positive base amount.

## PRC-003 Starting From

Requires a minimum indicative amount and must always display as `Starting from` until final price acceptance.

## PRC-004 Quantity-Based

```text
Unit Price x Quantity = Item Subtotal
```

Minimum and maximum quantity rules must be enforced.

## PRC-005 Packages

Each package supports:

- Name
- Price
- Description
- Deliverables
- Delivery
- Revision allowance
- Eligible add-ons
- Optional Recommended label

Client selects one package.

## PRC-006 Custom Quote

No final price exists until Creative proposal and Client acceptance.

## PRC-007 Calculation Order

```text
Base or Package
+ Quantity Items
+ Add-ons
+ Paid Options
+ Delivery Modifier
= Configured Subtotal

- Discount
+ Additional Charges
= Final Project Total

x Commitment Percentage
= Commitment Due

Final Total
- Confirmed Payments
= Outstanding Balance
```

## PRC-008 Discounts and Charges

Creative may apply:

- Percentage discount
- Fixed discount
- Percentage additional charge
- Fixed additional charge

Every adjustment remains separately labelled. Final total cannot become negative.

## PRC-009 Currency

- One currency per Service
- No automatic currency conversion
- Currency-safe decimal arithmetic required

## PRC-010 Price Changes

Creative cannot silently change submitted or agreed pricing. Proposed changes preserve previous values and require Client acceptance.

---

# 18. Brief Builder

## BRF-001 Service-Specific Brief

Every Service can have its own Brief containing sections and questions.

## BRF-002 Question Types

- Short text
- Long text
- Single choice
- Multiple choice
- Dropdown
- Number
- URL
- File upload
- Multiple-file upload
- Visual/image selection

## BRF-003 Question Configuration

Each question supports:

- Label
- Supporting description
- Example/guidance
- Required or Optional
- Relevant choices

## BRF-004 Visual Selection

Creative can upload visual examples and allow single or multiple Client selection. An optional follow-up can ask what the Client likes about the selected direction.

## BRF-005 Conditions

V1 supports one-level logic:

```text
If Question A = X, show Question B.
```

No nested conditional engine in V1.

## BRF-006 Validation

Only visible required questions can block submission. Hidden conditional questions cannot block submission.

## BRF-007 Separation From Pricing

Brief responses do not independently alter price. Pricing-affecting choices belong in Service Configuration.

## BRF-008 Snapshot

Submitted Request retains Brief structure, choices, descriptions, answers, uploads, visual selections, and displayed conditional path.

## BRF-009 Preview and Reorder

Creative can preview and reorder sections/questions on desktop and mobile. Drag-and-drop cannot be the only reordering method.

---

# 19. Client Service Configuration

## CFG-001 Sequence

```text
Service
→ Package/Base Scope
→ Add-ons
→ Options
→ Quantities
→ Delivery
→ Price Summary
→ Brief
→ Identity and Verification
→ Review
→ Terms
→ Submit
```

UX may combine steps while preserving requirements.

## CFG-002 Live Price

Calculable prices update as selections change.

## CFG-003 Paid Selection Visibility

Every paid selection must show its price effect before confirmation.

## CFG-004 Review

Before submission, Client reviews:

- Creative
- Service
- Package
- Deliverables
- Add-ons
- Options
- Quantities
- Delivery
- Brief completion
- Price state
- Commitment requirement
- Terms

## CFG-005 Submission Validation

Submission requires:

- Required configuration complete
- Required Brief fields complete
- Required uploads complete
- Verified email
- Verified phone
- Terms available for review

## CFG-006 Duplicate Protection

Submission must be idempotent so repeated taps/clicks do not create duplicate Requests.

## CFG-007 Service Changes During Configuration

Material Service changes require refresh, revalidation, and explicit Client review before submission.

---

# 20. Request Management

## REQ-001 Request Detail

Creative receives:

- Client identity
- Service snapshot
- Scope
- Brief
- Files
- Visual preferences
- Price state
- Timeline
- Commitment rule
- Terms
- Submission timestamp

## REQ-002 Creative Actions

- Accept
- Request Changes
- Propose or revise price
- Decline

## REQ-003 Client Actions

- Accept changes
- Ask for clarification
- Reject proposal
- Accept terms
- Withdraw before Project Start

## REQ-004 History

Declined, Withdrawn, expired, and converted Requests remain historically accessible to authorised participants.

## REQ-005 Existing Requests Survive Service Changes

Unpublishing, subscription expiration, unavailability, and later Service edits do not automatically cancel existing submitted Requests.

---

# 21. Quotes and Price Negotiation

## QTE-001 Quote Contents

- Proposed scope
- Price
- Timeline
- Commitment percentage
- Commitment amount
- Optional Creative note

## QTE-002 Comparison

When replacing an estimate or proposal, show:

```text
Previous
Proposed
Difference
```

## QTE-003 Explicit Acceptance

Only explicit Client acceptance makes a proposal current.

## QTE-004 Version History

Previous commercial proposals remain traceable.

## QTE-005 Quote Validity

Quote expiry is a V1 Should Have. An expired quote cannot be newly accepted until renewed.

---

# 22. Terms and Agreement

## TRM-001 Terms Required

Every publishable Service must have terms.

## TRM-002 Visibility

Client can review terms before Request submission and again before final agreement.

## TRM-003 Final Acceptance

> **Clarified by `10-decisions-log-v1.0.md` D-002.**

Client must explicitly accept the agreed terms before Ready to Start.

## TRM-004 Snapshot

Accepted terms are preserved with:

- Exact content/version
- Request
- Client
- Timestamp

## TRM-005 Changed Terms

Material terms changes require Client reacceptance.

## TRM-006 V1 Boundary

This is terms acknowledgement, not an advanced electronic-signature system.

---

# 23. External Project Payment

## PAY-001 Boundary

Client Project payments occur outside the platform.

The platform does not:

- Collect funds
- Hold funds
- Provide escrow
- Process Project transfers
- Automatically verify receipt

## PAY-002 Creative Payment Methods

Supported configurable method types include:

- Bank transfer
- PayPal
- Mobile money
- Custom method

## PAY-003 Privacy

Payment details are revealed only to the relevant Client at the proper Request stage.

## PAY-004 Client Declaration

Client can declare:

- Amount sent
- Method
- Date
- Reference
- Optional evidence

Declaration changes state to Awaiting Confirmation, not Paid.

## PAY-005 Creative Confirmation

Only Creative confirms the actual amount received after independently checking the external account.

## PAY-006 Partial Receipt

Multiple confirmed amounts may accumulate toward the commitment threshold.

## PAY-007 Commitment Condition

If commitment is required:

```text
Confirmed Amount >= Required Commitment
```

before Ready to Start.

## PAY-008 No-Commitment Path

Payment is not a start condition when no commitment is required.

## PAY-009 Outstanding Balance

V1 may calculate and display outstanding balance but does not manage formal post-start balance stages.

---

# 24. Project Start and Closure

## PRJ-001 Ready to Start

Required conditions:

- Scope agreed
- Price agreed
- Required Brief complete
- Terms accepted
- Commitment satisfied when required

## PRJ-002 Explicit Start

Only the Creative can transition:

```text
Ready to Start → Active
```

No event automatically starts the Project.

## PRJ-003 Start Timestamp

Project Start records the start date/time and begins the agreed delivery timeline by default.

## PRJ-004 Active Record

- Client
- Creative
- Service snapshot
- Scope
- Brief
- Agreed price
- Commitment
- Confirmed payments
- Outstanding balance
- Timeline
- Start date
- Status

## PRJ-005 Close

Only the Creative can transition:

```text
Active → Completed
```

Closing does not require V2 deliverables, Client approval, final payment confirmation, or revision records.

---

# 25. Subscription and Billing

Platform subscription is a separate financial relationship from Client Project payment.

## SUB-001 Approved Plans

> **Superseded by `10-decisions-log-v1.0.md` D-001** (1–10 capacity model with revised pricing).

| Plan | Published-Service Capacity | International Price | Nigeria Price |
|---|---:|---:|---:|
| Free | 1 | $0/month | ₦0/month |
| Additional Service | +1 slot | $2/month | ₦2,000/month |
| 5-Service Plan | Up to 5 | $8/month | ₦8,000/month |
| 10-Service Plan | Up to 10 | $15/month | ₦15,000/month |

Nigerian prices are fixed plan prices and are not real-time FX conversions.

## SUB-002 Billing Period

Monthly recurring billing.

## SUB-003 Free Slot

Every Creative gets one free Published Service. Creative chooses which eligible Service uses the free slot.

## SUB-004 Capacity

- Drafts do not consume capacity.
- Published and publicly Unavailable Services consume capacity.
- Unpublishing frees capacity.
- Capacity is reusable and not permanently tied to one Service.

## SUB-005 Upgrade and Downgrade

Upgrades and downgrades are available.

On downgrade, Creative chooses which Services remain active within the reduced capacity. Excess Services become Subscription Inactive and are not deleted.

## SUB-006 Expiration

After paid subscription expiration:

- Selected free Service remains eligible
- Excess Services become greyed/disabled
- Clients cannot configure them
- Existing public URLs show unavailable state
- Configuration and history remain intact
- Submitted Requests remain manageable

## SUB-007 Renewal

Restored capacity allows eligible Services to be revalidated and reactivated without rebuilding.

## SUB-008 Historical Billing

Historical subscription transactions remain unchanged when current plans or prices change.

---

# 26. Notifications

V1 notification channels:

- In-app
- Email

No V1 SMS operational notifications.

## NOT-001 Notification Centre

Authenticated users have an in-app notification centre supporting:

- Read/unread
- Timestamp
- Relevant destination link

## NOT-002 Critical Events

| Event | Creative | Client |
|---|---|---|
| Request submitted | In-app + Email | Confirmation |
| Changes requested | Confirmation | In-app + Email |
| Client responds | In-app + Email | Confirmation |
| Quote proposed | Confirmation | In-app + Email |
| Quote accepted | In-app + Email | Confirmation |
| Request accepted | Confirmation | In-app + Email |
| Request declined | Confirmation | In-app + Email |
| Client withdraws | In-app + Email | Confirmation |
| Payment declared | In-app + Email | Confirmation |
| Payment confirmed | Confirmation | In-app + Email |
| Partial receipt confirmed | Confirmation | In-app + Email |
| Ready to Start | In-app + Email | In-app + Email |
| Project started | Confirmation | In-app + Email |
| Project completed | Confirmation | In-app + Email |
| Subscription action needed | In-app + Email | Not applicable |

Email failure must not reverse or block the underlying business action.

---

# 27. Admin Requirements

Admin supports:

- Operational dashboard
- User search and status inspection
- Account suspension and restoration
- Category management
- Published-Service moderation
- Subscription and capacity visibility
- Plan configuration
- Authorised Request and Project support visibility
- Audit logging for sensitive administrative actions

Admin does not become a participant in the Creative-Client commercial relationship.

---

# 28. States and Core Business Rules

## Account

```text
Pending Verification → Verified → Active → Suspended
```

## Service

```text
Draft
→ Published
↔ Unavailable
→ Subscription Inactive
→ Platform Disabled
→ Archived
```

## Request

> **Revised by `10-decisions-log-v1.0.md` D-006 and D-007.**

```text
Draft
→ Submitted
→ Changes Requested
→ Awaiting Client Response
→ Accepted
→ Awaiting Commitment
→ Awaiting Payment Confirmation
→ Partially Confirmed
→ Ready to Start
→ Converted to Project
```

Closure states:

- Declined
- Withdrawn
- Expired, if supported

## Price

- Calculated
- Estimated
- Quote Required
- Price Proposed
- Client Accepted
- Price Changes Requested
- Price Declined
- Price Locked

## Project

```text
Active → Completed
```

## Core Invariants

- Existing Request snapshots do not change with Service edits.
- Project never starts automatically.
- Client cannot confirm their own payment receipt.
- Subscription expiration does not cancel submitted Requests.
- Service deletion does not destroy history.
- Payment details are not publicly exposed.
- Client Project payments and Creative platform subscriptions remain separate.

---

# 29. Edge Cases

V1 must handle:

- Service changes during incomplete Client configuration
- Service becoming unavailable before submission
- Price changing before submission
- Creative becoming unavailable
- Subscription expiration with open Requests
- Payment method removal
- Incorrect Client-declared payment amount
- Partial commitment payment
- Duplicate submission attempts
- File upload failure and retry
- Verification failure without losing Guest progress
- Username and Service slug changes
- Creative or Client account suspension
- Session expiry during editing
- Capacity downgrade without prior Service selection
- Published Service becoming invalid due to removed dependencies

---

# 30. Non-Functional Requirements

## NFR-001 Mobile Capability Parity

All core Creative and Client V1 workflows must be completable on supported mobile browsers without a Continue-on-Desktop requirement.

Mobile functional parity includes:

- Onboarding
- Profile management
- Service Builder
- Brief Builder
- Uploads
- Preview and publication
- Request management
- Quote management
- Payment confirmation
- Project Start and Close
- Subscription management
- Notifications

Layouts may differ by viewport, but capabilities must not.

## NFR-002 Accessibility

V1 target: WCAG 2.2 AA.

Include:

- Keyboard operation
- Semantic labels
- Screen-reader compatibility
- Visible focus
- Sufficient contrast
- Error announcements
- Non-colour-only status communication

## NFR-003 Responsiveness

Support mobile, tablet, and desktop without application-level horizontal scrolling.

## NFR-004 Security

- Secure password hashing
- HTTPS-only production
- Protected sessions
- Server-side authorization
- OTP and login rate limiting
- File validation
- Secret management
- Protection against common web vulnerabilities
- OWASP-aligned security review

## NFR-005 Data Integrity

Commercial calculations and state transitions require authoritative server validation.

## NFR-006 Privacy

- Verified phone and login email remain private by default.
- Private Brief and Request content is restricted to authorised participants and authorised support.
- Payment details are limited to the relevant Request stage.

## NFR-007 Auditability

Sensitive transitions record actor, action, timestamp, entity, previous state, and new state.

Audit-critical actions include:

- Price proposal/acceptance
- Terms acceptance
- Payment confirmation
- Project Start
- Project Close
- Admin moderation

## NFR-008 Files

File handling must include:

- Type validation
- Size limits
- Secure access control
- Private/public separation
- Malware/security scanning strategy
- Authorised signed upload/download access where appropriate

---

# 31. Analytics and Success Metrics

## Creative Activation Funnel

```text
Signup
→ Email Verified
→ Phone Verified
→ Creative Profile Complete
→ First Service Created
→ First Service Published
→ First Link Shared
```

## Client Funnel

```text
Profile View
→ Service View
→ Configuration Started
→ Brief Started
→ Brief Completed
→ Request Submitted
```

## Commercial Funnel

```text
Request Submitted
→ Creative Reviewed
→ Scope and Price Agreed
→ Terms Accepted
→ Commitment Confirmed
→ Ready to Start
→ Project Started
```

## Core Metrics

- Creative Activation Rate
- Request Conversion Rate
- Project Start Conversion
- Time to First Published Service
- Time to First Request
- Time from Request Submission to Project Start
- Service Capacity Distribution
- Free-to-Paid Subscription Conversion

Analytics must not unnecessarily expose private Brief content.

---

# 32. Approved V1 Technical and Integration Stack

## Application Stack

- React
- Next.js
- TypeScript
- Next.js server-side capabilities for V1 backend logic

## Hosting

- Vercel

## Database

- Supabase PostgreSQL

## Authentication

- Supabase Auth
- Email/password only
- Mandatory email verification
- Mandatory phone verification
- No social login

## Phone OTP

- Termii

## Platform Subscription Payments

- Paystack

Paystack handles Creative-to-Platform subscription billing only.

## File Storage

- Cloudflare R2

Storage architecture must separate public Creative assets from private Client/Request files.

## Transactional Email

- Brevo for MVP transactional email

## Notifications

- In-app notifications stored in the application database
- Email notifications sent through Brevo

## Payment Separation

```text
Platform Subscription
Creative → Platform
Handled by Paystack

Project Payment
Client → Creative
Handled externally

Payment Record
Platform stores Client declaration and Creative confirmation
```

---

# 33. V2 Boundary

V2 begins after Project Start and may include:

- Project workspace
- Deliverables
- Project files
- Feedback
- Revision rounds
- Milestones
- Progress
- Project messaging
- Balance-payment stages
- Approvals
- Final delivery
- Structured completion and handoff

---

# 34. Release Criteria

V1 is ready only when the complete core loop works reliably.

## RC-001 Creative Journey

Creative can register, verify email and phone, complete profile, configure payment, create and publish a Service, and share the link on mobile and desktop.

## RC-002 Client Journey

Client can browse, configure, complete Brief, authenticate, verify email and phone, recover Guest progress, review, and submit on mobile and desktop.

## RC-003 Pricing

Fixed, Starting From, Quantity, Packages, Custom Quote, add-ons, paid options, delivery modifiers, discounts, and charges calculate correctly.

## RC-004 Request Processing

Creative can accept, request changes, quote, revise, and decline.

## RC-005 External Payment

Client can declare payment; Creative can confirm full or partial receipt; commitment threshold works correctly.

## RC-006 Project Start

Only Creative can explicitly start a Ready-to-Start Request.

## RC-007 Project Close

Only Creative can transition Active to Completed.

## RC-008 Subscription

Free, Additional Service, 5-Service, and 10-Service capacities, upgrades, downgrades, expiration, free-slot preservation, disabled Services, renewal, and reactivation work correctly.

## RC-009 Historical Integrity

QA verifies that changes to Services, pricing, Briefs, terms, subscription, and public availability do not corrupt historical Requests or Projects.

## RC-010 Mobile Parity

QA completes the entire Creative and Client core journey using supported mobile browsers.

## RC-011 Accessibility and Security

Critical journeys meet the agreed accessibility and security validation threshold before launch.

---

# 35. PRD Completion Status

Phase 02 is complete. This PRD incorporates the approved decisions for:

- Product foundation
- Roles and permissions
- Authentication and verification
- Creative onboarding
- Public profile
- Service Management
- Service Builder
- Pricing Engine
- Brief Builder
- Client configuration
- Request management
- Quotes
- Terms
- External Project payments
- Project Start and Close
- Subscription and billing
- Notifications
- Admin
- States and rules
- Edge cases
- Non-functional requirements
- Analytics
- Release criteria
- Approved V1 providers and technical stack

---

# 36. Next Step

Proceed to **Phase 03: Business Logic / Domain Model**.

Phase 03 should translate this PRD into:

- Domain entities
- Entity relationships
- Ownership rules
- State machines
- Invariants
- Pricing objects and calculation rules
- Snapshot/versioning model
- Subscription-capacity model
- Payment-record model
- Notification-event model
- Audit model
- Proposed PostgreSQL schema boundaries

No Phase 02 requirement should be silently contradicted downstream. If Phase 03 exposes a genuine requirement problem, the PRD must be updated explicitly.
