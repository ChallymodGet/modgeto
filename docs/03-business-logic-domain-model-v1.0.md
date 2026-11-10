# Phase 03: Business Logic / Domain Model

**Document:** 03-business-logic-domain-model-v1.0.md  
**Status:** Complete  
**Version:** 1.0  
**Date:** 9 November 2026  
**Source of truth:** Phase 01 Product Definition v1.0 and Phase 02 PRD v1.0  
**Next phase:** Phase 04, Information Architecture

> **Revision notice (10 November 2026):** §54–55 capacity pricing and invariants 44–45, and the §81 scenario, are superseded by `10-decisions-log-v1.0.md` D-001 (5 Services = ₦5,000/$5; 10 Services = ₦12,000/$12; both 5 < 4 and 10 < 9 are intentional). §38 and §74 Request statuses are revised by D-006 and D-007. §61 deterministic fallback is defined by D-016. Other rulings affecting this document: D-005, D-008 to D-012, D-015, D-019, D-024.

---

## 1. Purpose

This document converts the approved PRD into the core business entities, relationships, state machines, rules, invariants, snapshot strategy, capacity model, and recommended PostgreSQL boundaries for V1.

It is intentionally domain-first. It describes how the business works before final API routes, SQL migrations, UI layouts, or component structures are defined.

---

## 2. Approved Technical Context

The domain model is designed for the approved V1 architecture:

- React
- Next.js
- TypeScript
- Vercel
- Supabase PostgreSQL
- Supabase Auth using email/password only
- Mandatory email verification
- Mandatory phone verification through Termii OTP
- Paystack for Creative-to-Platform subscription payments
- Cloudflare R2 for file storage
- Brevo for transactional email
- In-app notifications stored by the application
- Client-to-Creative Project payments remain external to the platform

---

# 03A. Domain Foundation

## 3. Top-Level Domain

```text
User
├── Verification / Account State
├── Client Participation
└── Creative Profile? 0..1
      ├── Payment Methods
      ├── Commercial Defaults
      ├── Subscription / Capacity
      └── Services
            ├── Pricing
            ├── Packages
            ├── Deliverables
            ├── Add-ons
            ├── Options
            ├── Quantities
            ├── Dependencies
            ├── Delivery
            ├── Revisions
            ├── Terms
            ├── Brief
            └── Work Samples

Client + Service
      ↓
Draft Client Configuration
      ↓
Request
├── Service Snapshot
├── Scope Snapshot
├── Brief Snapshot
├── Commercial Proposals
├── Terms Snapshot / Acceptance
├── Request Responses
└── External Payment Records
      ↓
Ready to Start
      ↓
Project
```

## 4. Domain Aggregates

### Account Aggregate

Owns:

- User identity
- Email-verification state
- Phone-verification state
- Account status
- Capability relationships

Supabase Auth owns authentication credentials and sessions.

### Creative Aggregate

Owns:

- Creative Profile
- Availability
- Professional links
- Disciplines
- Commercial defaults
- External payment methods
- Free-Service designation
- Subscription relationship

### Service Aggregate

Owns the Creative's reusable offering:

- Service identity
- Pricing mode
- Packages
- Deliverables
- Add-ons
- Options
- Quantity rules
- Dependencies
- Delivery
- Revisions
- Terms
- Brief
- Work samples
- Commitment configuration
- Allowed payment methods

### Request Aggregate

Owns the pre-Project Client-Creative engagement:

- Client
- Creative
- Originating Service
- Immutable submission snapshots
- Clarification/change notes
- Commercial proposal history
- Terms acceptance
- Payment declarations and confirmations
- Start-condition state

### Project Aggregate

V1's Project is intentionally lightweight and owns:

- Originating Request
- Creative and Client
- Agreed snapshots
- Start date
- Agreed timeline
- Payment summary
- Active/Completed state

### Subscription Aggregate

Owns:

- Selected published-Service capacity
- Billing market/currency
- Current subscription state
- Paystack references
- Current billing period
- Upgrade/downgrade intent
- Expiration

---

# 03B. Identity & Roles Domain

## 5. User

```ts
User {
  id
  email
  phone
  emailVerifiedAt?
  phoneVerifiedAt?
  accountStatus
  createdAt
  updatedAt
}
```

### Account Status

```text
PENDING_VERIFICATION
ACTIVE
SUSPENDED
DELETION_PENDING
```

## 6. Capabilities Rather Than Exclusive User Roles

A User is not globally forced to be either Client or Creative.

A User may:

- Participate as a Client in Requests.
- Own a CreativeProfile and Services.
- Act as a Creative in their own Services while acting as a Client when commissioning another Creative.

Client capability is relationship-based through Request participation.

Creative capability exists when:

```text
User → CreativeProfile
```

## 7. Identity Invariants

- One platform User per email address.
- Creative username is unique after normalization.
- Authenticated identity is required for Request submission.
- Email and phone must both be verified before full account operation.
- A Creative cannot commission their own Service.
- Suspended users cannot perform protected commercial actions.

---

# 03C. Creative Profile Domain

## 8. CreativeProfile

```ts
CreativeProfile {
  userId
  username
  displayName
  professionalTitle
  introduction
  location?
  avatarAssetId?
  availability
  defaultCurrency
  defaultCommitmentRequired
  defaultCommitmentPercentage?
  selectedFreeServiceId?
  profileStatus
  createdAt
  updatedAt
}
```

## 9. Availability

```text
AVAILABLE
LIMITED
UNAVAILABLE
```

Approved behaviour:

- AVAILABLE accepts new Requests.
- LIMITED accepts new Requests and communicates constrained availability publicly.
- UNAVAILABLE blocks new Requests globally while preserving the public profile and history.

## 10. Creative Links

```ts
CreativeLink {
  id
  creativeId
  type
  label?
  url
  displayOrder
}
```

Types may include:

```text
PORTFOLIO
LINKEDIN
BEHANCE
DRIBBBLE
GITHUB
OTHER
```

These are public links only and are not authentication providers.

## 11. Public Eligibility

Derived policy:

```ts
canGoPublic =
  emailVerified &&
  phoneVerified &&
  requiredProfileFieldsComplete &&
  accountStatus === ACTIVE
```

---

# 03D. Service Domain

## 12. Service

```ts
Service {
  id
  creativeId
  categoryId
  name
  slug
  shortDescription
  detailedDescription?
  coverAssetId?
  currency
  pricingMode
  lifecycleStatus
  moderationStatus
  displayOrder
  createdAt
  updatedAt
  publishedAt?
}
```

## 13. Service Lifecycle

```text
DRAFT
PUBLISHED
UNAVAILABLE
SUBSCRIPTION_INACTIVE
ARCHIVED
```

## 14. Service Moderation

Kept orthogonal to lifecycle:

```text
NORMAL
PLATFORM_DISABLED
```

This allows a Service to retain its author's intended lifecycle state while platform moderation independently blocks operation.

## 15. Effective Request Availability

```ts
canAcceptNewRequest =
  accountIsOperational &&
  creativeAvailability !== UNAVAILABLE &&
  serviceLifecycle === PUBLISHED &&
  serviceWithinSubscriptionCapacity &&
  moderationStatus === NORMAL
```

LIMITED Creative availability does not block this calculation.

## 16. Service Children

```text
Service
├── ServicePackage[]
├── Deliverable[]
├── AddOn[]
├── OptionGroup[]
│    └── ServiceOption[]
├── QuantityRule[]
├── DependencyRule[]
├── DeliveryOption[]
├── RevisionPolicy
├── CommitmentConfiguration
├── TermsDefinition
├── BriefDefinition
├── WorkSampleAssociation[]
└── PaymentMethodAssociation[]
```

## 17. Deliverable

```ts
Deliverable {
  id
  serviceId
  packageId?
  name
  description?
  displayOrder
}
```

Deliverables describe included outcomes and do not independently carry a price.

If an optional outcome is paid, it is modelled as an AddOn.

## 18. AddOn

```ts
AddOn {
  id
  serviceId
  name
  description?
  amountMinor
  allowsQuantity
  minimumQuantity?
  maximumQuantity?
  displayOrder
  active
}
```

## 19. OptionGroup and ServiceOption

```ts
OptionGroup {
  id
  serviceId
  label
  description?
  selectionMode
  required
  displayOrder
}
```

```text
SINGLE
MULTIPLE
```

```ts
ServiceOption {
  id
  optionGroupId
  label
  description?
  priceModifierMinor
  displayOrder
}
```

Example:

```text
Website Platform / Tool
Figma             +0
Framer            +configured amount
Webflow           +configured amount
WordPress         +configured amount
I'm not sure      +0
```

## 20. Quantity Rules

```ts
QuantityRule {
  id
  serviceId
  unitName
  unitAmountMinor
  minimum
  maximum?
  defaultQuantity
}
```

## 21. Dependencies

V1 supports simple prerequisite relationships:

```ts
DependencyRule {
  id
  serviceId
  prerequisiteItemType
  prerequisiteItemId
  dependentItemType
  dependentItemId
}
```

Example:

```text
Brand Guidelines REQUIRES Logo Design
```

No recursive Boolean dependency engine exists in V1.

---

# 03E. Pricing Domain

## 22. Primary Pricing Modes

```text
FIXED
STARTING_FROM
QUANTITY
PACKAGE
CUSTOM_QUOTE
```

A Service has exactly one primary pricing mode.

## 23. Money Representation

All amounts use exact financial arithmetic.

Recommended domain representation:

```ts
Money {
  amountMinor: bigint
  currency: string
}
```

Examples:

```text
₦150,000 → 15,000,000 kobo
$15 → 1,500 cents
```

Never use binary floating-point arithmetic for authoritative pricing.

## 24. Fixed Pricing

```ts
FixedPricing {
  serviceId
  baseAmountMinor
}
```

## 25. Starting-From Pricing

```ts
StartingPricing {
  serviceId
  minimumAmountMinor
}
```

The minimum is indicative until Creative confirmation and Client acceptance.

## 26. Quantity Pricing

```text
Unit Amount × Selected Quantity
```

Minimum and maximum limits are enforced.

## 27. ServicePackage

```ts
ServicePackage {
  id
  serviceId
  name
  description?
  amountMinor
  recommended
  turnaroundValue
  turnaroundUnit
  revisionConfiguration
  displayOrder
}
```

The Client selects exactly one package for Package-priced Services.

## 28. Price Breakdown

Every authoritative price calculation should be reconstructable through line items.

```ts
PriceBreakdown {
  lines[]
  subtotalMinor
  discountMinor
  additionalChargesMinor
  finalTotalMinor
  commitmentMinor
}
```

Calculation order:

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

× Commitment Percentage
= Required Commitment

Final Total
- Confirmed Payments
= Outstanding Balance
```

## 29. Pricing Invariants

- One currency per Service.
- No automatic FX conversion in V1.
- Final total cannot be negative.
- Submitted pricing is snapshotted.
- Agreed pricing cannot be silently overwritten.
- Commitment is calculated from the agreed Project price, not the current public Service price.

---

# 03F. Brief Domain

## 30. Brief Hierarchy

```text
BriefDefinition
├── BriefSection[]
│    └── BriefQuestion[]
│         ├── QuestionChoice[]
│         ├── VisualExample[]
│         └── QuestionCondition?
```

## 31. Question Types

```text
SHORT_TEXT
LONG_TEXT
SINGLE_CHOICE
MULTIPLE_CHOICE
DROPDOWN
NUMBER
URL
FILE
MULTIPLE_FILE
VISUAL_SELECTION
```

## 32. BriefQuestion

```ts
BriefQuestion {
  id
  sectionId
  type
  label
  description?
  example?
  required
  displayOrder
}
```

## 33. VisualExample

```ts
VisualExample {
  id
  questionId
  assetId
  label?
  description?
  displayOrder
}
```

This supports visual preference questions such as logo or interface-style references.

## 34. One-Level Conditional Logic

```ts
QuestionCondition {
  sourceQuestionId
  operator: EQUALS
  expectedValue
}
```

No nested conditions in V1.

## 35. Brief Rules

- Hidden conditional questions cannot block Request submission.
- Visible required questions must be answered.
- Pricing-affecting selections belong to Service Configuration rather than the Brief.
- Submitted Brief structure and responses are immutable historical snapshots.

---

# 03G. Client Configuration & Request Domain

## 36. DraftClientConfiguration

Before submission, the Client's configuration is mutable.

```ts
DraftClientConfiguration {
  id
  serviceId
  guestSessionId?
  clientUserId?
  packageSelection?
  addOnSelections[]
  optionSelections[]
  quantities[]
  deliverySelection?
  briefResponses[]
  calculatedPrice
  lastValidatedServiceVersion
  expiresAt?
}
```

Guest configurations can later be attached to the authenticated Client without losing progress.

## 37. Request

Submission creates the durable business record:

```ts
Request {
  id
  serviceId
  creativeId
  clientId
  status
  submittedAt
  serviceSnapshot
  scopeSnapshot
  briefSnapshot
  commercialSnapshot
  commitmentSnapshot
}
```

## 38. Request Statuses

> **Revised by `10-decisions-log-v1.0.md` D-006 and D-007.**

```text
SUBMITTED
CHANGES_REQUESTED
AWAITING_CLIENT_RESPONSE
ACCEPTED
AWAITING_COMMITMENT
AWAITING_PAYMENT_CONFIRMATION
PARTIALLY_CONFIRMED
READY_TO_START
CONVERTED_TO_PROJECT
DECLINED
WITHDRAWN
EXPIRED
```

Draft is primarily a DraftClientConfiguration state rather than a submitted Request state.

## 39. Multiple Request Rules

Approved:

- A Client may have multiple simultaneous Requests with the same Creative.
- A Client may submit the same Service multiple times for legitimately separate Projects.
- Accidental duplicates are prevented through request-submission idempotency rather than a business prohibition.

---

# 03H. Quote & Commercial Agreement Domain

## 40. CommercialProposal

Price/scope negotiation is versioned rather than overwritten.

```ts
CommercialProposal {
  id
  requestId
  version
  proposedByUserId
  scopeSnapshot
  totalMinor
  currency
  discount?
  charges[]
  turnaround
  commitmentPercentage
  commitmentAmountMinor
  note?
  status
  createdAt
  respondedAt?
}
```

## 41. Proposal Status

```text
PROPOSED
ACCEPTED
REJECTED
SUPERSEDED
EXPIRED
```

Only one proposal can represent the current accepted agreement.

Issuing a replacement proposal supersedes the prior unaccepted proposal.

## 42. CommercialAgreement

```ts
CommercialAgreement {
  requestId
  proposalId
  agreedScope
  agreedPriceMinor
  currency
  agreedTurnaround
  commitmentPercentage
  commitmentAmountMinor
  agreedAt
}
```

This drives commitment requirements and Project Start readiness.

## 43. Structured Request Responses

V1 supports narrow clarification notes during Request negotiation without creating general-purpose Project messaging.

```ts
RequestResponse {
  id
  requestId
  proposalId?
  authorUserId
  responseType
  message
  createdAt
}
```

Response types may include:

```text
CHANGE_REQUEST_NOTE
CLIENT_CLARIFICATION
CREATIVE_CLARIFICATION
PROPOSAL_NOTE
PROPOSAL_RESPONSE
```

Boundary:

- Available during Request clarification and proposal negotiation.
- Ends as a negotiation tool when the Project starts.
- Does not become V1 Project chat, revision feedback, collaboration comments, or messaging.

---

# 03I. External Project Payment Domain

## 44. Payment Separation

Project payment records are completely separate from Paystack platform subscription billing.

### Client Declaration

```ts
ProjectPaymentDeclaration {
  id
  requestId
  clientId
  paymentMethodSnapshot
  declaredAmountMinor
  currency
  declaredPaymentDate
  reference?
  evidenceAssetId?
  declaredAt
}
```

### Creative Confirmation

```ts
ProjectPaymentConfirmation {
  id
  requestId
  declarationId?
  creativeId
  confirmedAmountMinor
  currency
  confirmedAt
}
```

## 45. Payment Summary

Derived:

```ts
PaymentSummary {
  projectTotal
  requiredCommitment
  totalDeclared
  totalConfirmed
  commitmentRemaining
  projectBalance
}
```

## 46. Commitment Satisfaction

Let:

```text
T = Agreed Project Total
C = Commitment Percentage
P = Total Confirmed Payment
```

Then:

```text
Required Commitment = T × C
commitmentSatisfied = P >= Required Commitment
```

Only Creative-confirmed amounts count.

Proof-of-payment uploads do not constitute payment confirmation.

---

# 03J. Project Domain

## 47. Project

```ts
Project {
  id
  requestId
  creativeId
  clientId
  serviceSnapshot
  commercialAgreementSnapshot
  briefSnapshot
  paymentSummarySnapshot
  agreedTimeline
  startedAt
  completedAt?
  status
}
```

## 48. Project Status

```text
ACTIVE
COMPLETED
```

## 49. Ready-to-Start Policy

```ts
readyToStart =
  scopeAgreed &&
  priceAgreed &&
  briefComplete &&
  termsAccepted &&
  (noCommitmentRequired || commitmentSatisfied)
```

Ready-to-Start may be derived by the system.

Project Start is never automatic.

## 50. Project Creation

Only the owning Creative may select Start Project.

Transactional operation:

```text
Verify Request READY_TO_START
↓
Verify Project Does Not Already Exist
↓
Create Project(ACTIVE)
↓
Set Request CONVERTED_TO_PROJECT
↓
Commit Transaction
↓
Emit ProjectStarted
```

## 51. Project Uniqueness

One Request may create at most one Project.

Repeated Start actions must be idempotent.

## 52. Completion

Only the Creative may transition:

```text
ACTIVE → COMPLETED
```

No V1 Client approval, deliverable, file, final-balance, feedback, or revision workflow is required for completion.

---

# 03K. Subscription & Service Capacity Domain

## 53. Capacity Model

Subscription is modelled around selected Published-Service capacity rather than four rigid conventional plan tiers.

Supported capacity:

```text
1 through 10 Published Services
```

## 54. Approved Capacity Pricing

> **Superseded by `10-decisions-log-v1.0.md` D-001.**

### Nigeria

| Published-Service Limit | Monthly Price |
|---:|---:|
| 1 | ₦0 |
| 2 | ₦2,000 |
| 3 | ₦4,000 |
| 4 | ₦6,000 |
| 5 | ₦8,000 |
| 6 | ₦10,000 |
| 7 | ₦12,000 |
| 8 | ₦14,000 |
| 9 | ₦16,000 |
| 10 | ₦15,000 |

### International

| Published-Service Limit | Monthly Price |
|---:|---:|
| 1 | $0 |
| 2 | $2 |
| 3 | $4 |
| 4 | $6 |
| 5 | $8 |
| 6 | $10 |
| 7 | $12 |
| 8 | $14 |
| 9 | $16 |
| 10 | $15 |

The 10-Service price is intentionally discounted below the calculated 9-Service price.

The platform must not automatically correct or flatten this pricing curve.

## 55. Business Pricing Logic

```text
1 Service      Free

2 Services     Free + 1 additional
3 Services     Free + 2 additional
4 Services     Free + 3 additional

5 Services     Discounted 5-Service price

6 Services     5-Service price + 1 additional
7 Services     5-Service price + 2 additional
8 Services     5-Service price + 3 additional
9 Services     5-Service price + 4 additional

10 Services    Discounted 10-Service price
```

## 56. CapacityPrice

```ts
CapacityPrice {
  publishedServiceLimit
  market
  currency
  amountMinor
  effectiveFrom
  effectiveUntil?
}
```

Prices are configured explicitly per market/currency. They are not dynamically derived from exchange rates.

## 57. Subscription

```ts
Subscription {
  id
  creativeId
  publishedServiceLimit
  market
  currency
  status
  paystackCustomerCode?
  paystackSubscriptionCode?
  currentPeriodStart?
  currentPeriodEnd?
  cancelAtPeriodEnd
  scheduledServiceLimit?
  createdAt
  updatedAt
}
```

## 58. Subscription Status

```text
FREE
ACTIVE
PAST_DUE
EXPIRED
CANCELLED
```

Provider-specific webhook mapping will be finalized during implementation architecture.

## 59. Capacity Consumption

Consumes capacity:

```text
PUBLISHED
UNAVAILABLE
```

Does not consume capacity:

```text
DRAFT
SUBSCRIPTION_INACTIVE
ARCHIVED
```

## 60. Free Service

The Creative explicitly designates which eligible Service occupies their free slot.

The oldest Service is not automatically entitled to remain free forever.

## 61. Downgrade and Expiration

When future capacity is lower than current usage:

- Creative should choose which Services remain active.
- Excess Services become SUBSCRIPTION_INACTIVE.
- No configuration or history is deleted.
- Submitted Requests remain operational.
- Existing Projects remain operational.

If a Creative fails to choose before capacity reduces, a deterministic fallback must be established in implementation/business-rule design without deleting data.

---

# 03L. Notification Domain

## 62. Domain Events

Examples:

```text
RequestSubmitted
RequestChangesRequested
RequestResponseCreated
CommercialProposalCreated
CommercialProposalAccepted
RequestAccepted
RequestDeclined
PaymentDeclared
PaymentConfirmed
CommitmentSatisfied
RequestReadyToStart
ProjectStarted
ProjectCompleted
SubscriptionPastDue
SubscriptionExpired
```

## 63. Notification Side Effects

Domain event handlers can produce:

```text
InAppNotification
EmailDeliveryJob
AnalyticsEvent
AuditEvent
```

Email failure must not roll back the originating business action.

## 64. Notification

```ts
Notification {
  id
  userId
  type
  entityType
  entityId
  title
  body
  readAt?
  createdAt
}
```

Approved V1 communication channels:

- In-app
- Brevo email

Termii phone messaging is used for OTP/security verification, not V1 lifecycle notifications.

---

# 03M. Asset Domain

## 65. Asset

Cloudflare R2 stores file bytes. PostgreSQL stores ownership and metadata.

```ts
Asset {
  id
  ownerUserId
  storageProvider
  bucket
  objectKey
  originalFilename
  mimeType
  sizeBytes
  visibility
  category
  securityStatus
  createdAt
}
```

## 66. Visibility

```text
PUBLIC
PRIVATE
```

## 67. Categories

```text
PROFILE_IMAGE
SERVICE_COVER
WORK_SAMPLE
BRIEF_VISUAL_EXAMPLE
CLIENT_BRIEF_UPLOAD
PAYMENT_EVIDENCE
```

## 68. Access Rules

Public examples may include:

- Profile image
- Service cover
- Public work samples

Private by default:

- Client Brief uploads
- Client business documents
- Payment evidence

Private assets require authorised, time-limited access rather than public R2 URLs.

---

# 03N. Audit & Snapshot Model

## 69. AuditEvent

```ts
AuditEvent {
  id
  actorUserId?
  action
  entityType
  entityId
  previousState?
  newState?
  metadata?
  occurredAt
}
```

Material audit actions include:

```text
SERVICE_PUBLISHED
SERVICE_UNPUBLISHED
SERVICE_MODERATED
REQUEST_SUBMITTED
CHANGES_REQUESTED
REQUEST_RESPONSE_CREATED
PRICE_PROPOSED
PRICE_ACCEPTED
TERMS_ACCEPTED
PAYMENT_DECLARED
PAYMENT_CONFIRMED
PROJECT_STARTED
PROJECT_COMPLETED
SUBSCRIPTION_CHANGED
USER_SUSPENDED
```

## 70. Snapshot Strategy

Do not version every Service keystroke.

Create durable snapshots at business boundaries.

### Request Submission

Capture:

- Service
- Scope
- Brief
- Price
- Terms
- Commitment

### Commercial Proposal

Capture:

- Proposed scope
- Proposed price
- Timeline
- Commitment

### Proposal Acceptance

Capture the final CommercialAgreement.

### Terms Acceptance

Capture exact accepted TermsSnapshot.

### Project Start

Capture Project-start commercial and payment state.

This preserves historical truth without implementing full document version control.

---

# 03O. State Machines & Transition Rules

## 71. User

```text
PENDING_VERIFICATION
      ↓
ACTIVE
  ↕
SUSPENDED
      ↓
DELETION_PENDING
```

## 72. Service

```text
DRAFT
  ↓ publish
PUBLISHED
  ↔ UNAVAILABLE
  ↔ SUBSCRIPTION_INACTIVE
  → ARCHIVED
```

Moderation is an independent NORMAL / PLATFORM_DISABLED overlay.

## 73. Commercial Proposal

```text
PROPOSED
├── ACCEPTED
├── REJECTED
├── SUPERSEDED
└── EXPIRED
```

## 74. Request

> **Revised by `10-decisions-log-v1.0.md` D-006 and D-007.**

### Fixed/accepted path

```text
SUBMITTED
↓
ACCEPTED
↓
AWAITING_COMMITMENT
↓
AWAITING_PAYMENT_CONFIRMATION
↓
PARTIALLY_CONFIRMED (if applicable)
↓
READY_TO_START
↓
CONVERTED_TO_PROJECT
```

### No-commitment path

```text
SUBMITTED
↓
ACCEPTED
↓
READY_TO_START
↓
CONVERTED_TO_PROJECT
```

### Negotiated path

```text
SUBMITTED
↓
CHANGES_REQUESTED
↓
AWAITING_CLIENT_RESPONSE
↓
ACCEPTED
↓
Commercial / payment path
```

### Closures

```text
→ DECLINED
→ WITHDRAWN
→ EXPIRED
```

subject to transition policy.

## 75. Project

```text
ACTIVE → COMPLETED
```

## 76. Subscription

```text
FREE
↓ upgrade
ACTIVE
↓ payment issue
PAST_DUE
├── recovery → ACTIVE
└── unresolved → EXPIRED

ACTIVE
↓ cancellation takes effect
CANCELLED / FREE
```

Exact Paystack event mapping remains implementation-specific.

---

# 03P. Domain Invariants

## Identity

1. Email belongs to at most one User.
2. Creative username is unique after normalization.
3. Full Client Request submission requires verified email and phone.
4. Suspended accounts cannot perform protected operations.
5. A Creative cannot commission their own Service.

## Creative Availability

6. AVAILABLE accepts new Requests.
7. LIMITED accepts new Requests.
8. UNAVAILABLE blocks new Requests but does not destroy history.

## Service

9. A Service belongs to exactly one Creative.
10. Published Service must pass publication validation.
11. Drafts do not consume published capacity.
12. Published and Unavailable Services consume capacity.
13. Active public Services cannot exceed the Creative's Service limit.
14. Service edits never mutate submitted Request snapshots.
15. Historical Requests survive Service archival, unpublishing, or subscription inactivity.

## Pricing

16. Service has exactly one primary pricing mode.
17. All Service commercial amounts use its selected currency.
18. Financial arithmetic uses exact minor-unit/decimal calculations.
19. Final amount cannot be negative.
20. Commercial amendments require explicit Client acceptance.
21. Commitment uses the agreed Project price.

## Brief

22. Hidden conditional questions cannot block submission.
23. Visible required questions must be complete.
24. Submitted Brief responses do not change when the live Brief changes.

## Request

25. A Request belongs to one Client and one Creative.
26. The same Client may have multiple simultaneous Requests with one Creative.
27. The same Client may submit the same Service multiple times for separate Projects.
28. Accidental duplicate submission must be prevented through idempotency.
29. Client can withdraw only before Project Start.
30. Submitted Request snapshots are durable.
31. Structured clarification is allowed before Project Start but is not general Project messaging.

## Payment

32. Client cannot confirm receipt of their own payment.
33. Proof of payment does not constitute successful confirmation.
34. Only Creative-confirmed amounts count toward commitment.
35. Partial confirmations accumulate toward commitment.

## Project

36. One Request can produce at most one Project.
37. Only the owning Creative can start the Project.
38. Project can start only after Ready-to-Start conditions pass.
39. Project Start is explicit and never automatic.
40. Only ACTIVE can become COMPLETED.
41. Later Service changes do not alter the Project.

## Subscription

42. Capacity can range from 1 through 10 Published Services.
43. Capacity 1 is free.
44. Capacity pricing follows the approved market tables exactly.
45. Ten Services may be priced below nine Services as an intentional discount.
46. Subscription expiration does not cancel submitted Requests.
47. Subscription expiration does not affect existing Projects.
48. Subscription inactivity never deletes Service configuration.
49. Creative chooses the designated free Service.

## Notification

50. Notification or Brevo delivery failure cannot reverse a successful domain transaction.

---

# 03Q. Recommended PostgreSQL Schema Boundaries

These are schema boundaries, not final migrations.

## Identity

```text
auth.users                        Supabase-managed
profiles
phone_verifications
creative_profiles
creative_disciplines
creative_links
```

`profiles.id` should correspond to `auth.users.id`.

## Creative Commercial Configuration

```text
creative_payment_methods
creative_commercial_defaults
```

## Service

```text
service_categories
services
service_packages
service_deliverables
service_addons
service_option_groups
service_options
service_quantity_rules
service_dependencies
service_delivery_options
service_revision_policies
service_terms
service_payment_methods
service_work_samples
```

## Brief

```text
brief_definitions
brief_sections
brief_questions
brief_question_choices
brief_visual_examples
brief_question_conditions
```

## Draft Client Configuration

```text
draft_configurations
draft_configuration_addons
draft_configuration_options
draft_configuration_quantities
draft_brief_responses
draft_brief_response_assets
```

Guest persistence may use a hybrid temporary-state strategy before authentication; exact persistence lifetime belongs in technical architecture.

## Request and Snapshots

```text
requests
request_service_snapshots
request_scope_snapshots
request_brief_snapshots
request_price_snapshots
request_terms_snapshots
request_commitment_snapshots
request_responses
```

Recommended approach:

```text
Live configurable Service data → relational tables
Historical Request snapshots → structured JSONB where appropriate
```

## Commercial Negotiation

```text
commercial_proposals
commercial_agreements
terms_acceptances
```

## Project Payment Records

```text
project_payment_declarations
project_payment_confirmations
```

No Paystack Project-payment IDs belong here because Paystack does not process Client Project payments.

## Projects

```text
projects
```

## Platform Subscription Billing

```text
capacity_prices
creative_subscriptions
subscription_billing_events
```

Paystack identifiers live only in platform subscription billing records.

## Notifications

```text
notifications
email_delivery_jobs
```

## Assets

```text
assets
asset_relations
```

Cloudflare R2 stores bytes; PostgreSQL stores metadata and relationships.

## Auditing

```text
audit_events
```

Append-only from the application perspective.

## Analytics

```text
analytics_events
```

can be used initially if required, without turning Supabase into a high-volume analytics warehouse.

## Recommended Hard Constraints

Unique:

```text
creative_profiles.username
(creative_id, services.slug)
projects.request_id
```

Relational:

- No Service without Creative.
- No Request without Client, Creative, and originating Service reference.
- No CommercialProposal without Request.
- No Project without Request.

Financial:

- Use BIGINT minor-unit amounts or consistently constrained NUMERIC values.
- BIGINT minor units are recommended for V1.

---

## 77. Recommended Supabase RLS Boundaries

### Services

- Owner Creative manages private Service data.
- Public access only for eligible public Service representations.

### Requests

Readable by:

- Request Client
- Owning Creative
- Explicitly authorised Admin/support mechanism

### Request Responses

Writable/readable only by Request Client and Creative while the Request permits clarification.

### Project Payment Declarations

Client can create declarations for own Request. Client and owning Creative can read relevant records.

### Payment Confirmations

Owning Creative can create confirmations. Client can read resulting payment state.

### Projects

Client and Creative can read their Project. Creative alone performs Start/Close lifecycle mutations.

### Notifications

Only notification owner can access.

### Private Assets

Access is relationship-controlled and should not rely on public bucket listings.

Business-critical authorization remains server-validated even when RLS provides an additional database boundary.

---

# 03R. Domain Validation

## 78. Scenario: Free Creative

```text
Charles
→ Verified User
→ CreativeProfile
→ Capacity = 1
→ Brand Identity Service
→ Published
```

Valid.

## 79. Scenario: Capacity 4

Creative wants four Published Services.

```text
Capacity = 4
Nigeria = ₦6,000/month
International = $6/month
```

Valid.

## 80. Scenario: Capacity 5 Discount

```text
Capacity = 5
Nigeria = ₦8,000/month
International = $8/month
```

Valid.

## 81. Scenario: Capacity 9 versus 10

```text
9 Services  = ₦16,000 / $16
10 Services = ₦15,000 / $15
```

Ten is intentionally cheaper and must remain so.

Valid.

## 82. Scenario: Visual Brand Brief

Brief asks:

> Which logo directions resonate with you?

Client selects multiple visual examples and provides an explanation.

The Request snapshot retains the question, example metadata, selections, and response.

Valid.

## 83. Scenario: Service Price Changes

Client submits Logo Design at ₦150,000.

Creative later changes live Service price to ₦200,000.

Submitted Request remains ₦150,000 unless a new CommercialProposal is explicitly issued and accepted.

Valid.

## 84. Scenario: Starting-From Price

```text
Service starting price = ₦300,000
Creative proposal = ₦450,000
Client accepts
Agreed price = ₦450,000
```

Commitment is calculated from ₦450,000.

Valid.

## 85. Scenario: Partial Commitment

```text
Project Total = ₦300,000
Commitment = 50%
Required = ₦150,000
Creative confirms ₦100,000
```

Request remains partially confirmed.

Creative later confirms ₦50,000.

```text
Total Confirmed = ₦150,000
commitmentSatisfied = true
```

Valid.

## 86. Scenario: Multiple Requests Same Creative

Client simultaneously requests:

- Brand Identity
- Website Design
- UI/UX Design

Each Request is independent.

Valid.

## 87. Scenario: Repeated Same Service

An agency submits the same Brand Identity Service three times for three different underlying brands.

All are allowed as distinct Requests.

Accidental double-submit is prevented by idempotency.

Valid.

## 88. Scenario: Request Clarification

Creative requests a scope change and adds a structured note.

Client asks a clarification question.

Creative responds and issues a revised proposal.

Once the Project starts, structured Request clarification ceases to function as a Project chat system.

Valid.

## 89. Scenario: Explicit Project Start

All readiness conditions become true.

System derives READY_TO_START.

Creative explicitly selects Start Project.

Transaction creates exactly one Active Project and marks Request converted.

Valid.

## 90. Scenario: Subscription Expiry

Creative has multiple Services. Paid capacity expires.

- Designated free Service remains eligible.
- Excess Services become Subscription Inactive.
- Existing submitted Requests remain operational.
- Existing Projects remain operational.
- Disabled Service configurations remain intact.

Valid.

## 91. Scenario: Limited Availability

Creative profile is LIMITED.

Public profile communicates limited availability.

New Requests remain enabled.

Valid.

## 92. Scenario: Mobile

Creative creates a Service, builds the Brief, uploads visual examples, publishes, reviews a Request, clarifies scope, confirms payment, and starts the Project from mobile.

No domain object or business rule requires desktop access.

Valid.

---

# 93. Phase 03 Completion Status

Phase 03 is complete.

The finalized domain model now defines:

- User identity and verification
- Relationship-based roles
- Creative Profile
- Availability behaviour
- Service aggregate
- Service lifecycle and moderation
- Pricing objects and arithmetic rules
- Brief hierarchy and conditional logic
- Draft Client configuration
- Immutable submitted Request snapshots
- Multiple/repeated Request rules
- Structured Request clarification notes
- Versioned commercial proposals
- Commercial agreement
- External Project payment declarations and confirmations
- Commitment calculation
- Ready-to-Start derivation
- Explicit Project creation and closure
- 1–10 Service subscription-capacity model
- Nigeria and international capacity pricing
- Notification events
- Cloudflare R2 asset metadata model
- Audit model
- Snapshot boundaries
- State machines
- Domain invariants
- Recommended Supabase PostgreSQL schema boundaries
- Recommended Row-Level Security boundaries
- Representative domain validation scenarios

There are no unresolved Phase 03 product decisions blocking the next phase.

---

# 94. Source-of-Truth Order

```text
Phase 01 Product Definition
        ↓
Phase 02 Product Requirements Document
        ↓
Phase 03 Business Logic / Domain Model
        ↓
Phase 04 Information Architecture
        ↓
Phase 05 User Flows
        ↓
Phase 06 UX / Wireframes
        ↓
Phase 07 Design System
        ↓
Phase 08 High-Fidelity UI
        ↓
Phase 09 Frontend Architecture
        ↓
Phase 10 Frontend Development
        ↓
Phase 11 Backend / Database / APIs
        ↓
Phase 12 Integrations
        ↓
Phase 13 QA & Validation
        ↓
Phase 14 MVP Launch
```

If a later phase reveals a genuine upstream contradiction, the appropriate upstream artifact must be explicitly revised rather than silently overridden downstream.

---

# 95. Next Step

Proceed to **Phase 04: Information Architecture**.

Phase 04 should define:

1. General platform IA
2. Creative role-based IA
3. Client role-based IA
4. Admin role-based IA
5. Public profile and direct-Service information hierarchy
6. Creative mobile navigation architecture
7. Client mobile navigation architecture
8. Cross-role shared surfaces
9. Navigation rules based on Request/Service/Subscription states
10. V1 versus V2 navigation boundaries
