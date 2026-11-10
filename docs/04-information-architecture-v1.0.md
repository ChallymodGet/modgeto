# Phase 04: Information Architecture

**Document:** 04-information-architecture-v1.0.md  
**Status:** Complete  
**Version:** 1.0  
**Date:** 9 November 2026  
**Source of truth:** Phases 01–03  
**Next phase:** Phase 05, User Flows

> **Revision notice (10 November 2026):** §30 Capacity Pricing is superseded by `10-decisions-log-v1.0.md` D-001. §46–47 state mappings gain `AWAITING_TERMS` and the collapsed `AWAITING_CLIENT` status (D-006, D-007). Route prefixes are defined by D-021. §7 desktop navigation is a top pill bar per D-031; request-status mappings are refined by D-027 and D-028.

---

## 1. Purpose

This document defines the V1 platform structure, page hierarchy, navigation model, role-based information architecture, shared surfaces, state-based navigation rules, mobile navigation patterns, and V1/V2 boundaries.

The IA is organised in this order:

1. General Platform IA
2. Creative IA
3. Client IA
4. Admin IA
5. Public Profile and Service IA
6. Creative Mobile Navigation
7. Client Mobile Navigation
8. Shared and Cross-Role Surfaces
9. State-Based Navigation Rules
10. V1/V2 Boundary
11. IA Validation

---

# 04A. General Platform IA

## 2. Top-Level Platform Areas

```text
PLATFORM
├── Public Experience
├── Authentication
├── Creative Workspace
├── Client Workspace
├── Admin Workspace
└── Shared System Surfaces
```

## 3. General Platform Structure

```text
PLATFORM
│
├── PUBLIC
│   ├── Creative Profile
│   │   ├── Creative Overview
│   │   ├── Services
│   │   ├── Selected Work
│   │   ├── Availability
│   │   └── External Links
│   │
│   ├── Service Detail
│   │   ├── Service Overview
│   │   ├── Pricing
│   │   ├── Deliverables
│   │   ├── Packages
│   │   ├── Delivery and Revisions
│   │   ├── Relevant Work
│   │   └── Configure Service
│   │
│   └── Client Configuration
│       ├── Scope
│       ├── Add-ons
│       ├── Options
│       ├── Quantity
│       ├── Delivery
│       ├── Price Summary
│       ├── Brief
│       ├── Authentication and Verification
│       ├── Review
│       ├── Terms
│       └── Submit Request
│
├── AUTHENTICATION
│   ├── Sign Up
│   ├── Sign In
│   ├── Verify Email
│   ├── Verify Phone
│   ├── Forgot Password
│   └── Reset Password
│
├── CREATIVE WORKSPACE
│   ├── Dashboard
│   ├── Requests
│   ├── Services
│   ├── Projects
│   ├── Public Profile
│   ├── Subscription
│   └── Settings
│
├── CLIENT WORKSPACE
│   ├── Home
│   ├── Requests
│   ├── Projects
│   └── Account
│
├── ADMIN WORKSPACE
│   ├── Overview
│   ├── Users
│   ├── Services
│   ├── Requests
│   ├── Projects
│   ├── Subscriptions
│   ├── Moderation
│   ├── Audit
│   └── Platform Settings
│
└── SHARED SYSTEM SURFACES
    ├── Notifications
    ├── Request Detail
    ├── Proposal Detail
    ├── Payment Status
    ├── Project Record
    ├── File Viewer
    ├── Empty States
    ├── Error States
    └── Access and Unavailable States
```

## 4. Public-First Client Entry

```text
Creative Link
→ Public Profile
→ Service
→ Configure
→ Brief
→ Identity / Verification
→ Submit
→ Client Workspace
```

Authentication must not block initial Service exploration.

## 5. Information-Priority Principles

### Creative

```text
Action Required
→ Client Requests
→ Services
→ Projects
→ Profile / Subscription
→ Settings
```

### Client

```text
Action Required
→ Current Requests
→ Projects
→ Account
```

### Public Visitor

```text
Who is this Creative?
→ Are they available?
→ What can I hire them for?
→ What might it cost?
→ Can I trust their work?
→ How do I start?
```

---

# 04B. Creative IA

## 6. Creative Workspace

```text
CREATIVE WORKSPACE
├── Dashboard
├── Requests
│   ├── All
│   ├── New
│   ├── Awaiting Client
│   ├── Awaiting Payment
│   ├── Ready to Start
│   └── Closed
├── Services
│   ├── All Services
│   ├── Create Service
│   └── Service Builder
├── Projects
│   ├── Active
│   └── Completed
├── Public Profile
├── Subscription
└── Settings
```

Global utilities:

- Notifications
- Workspace Switcher
- Account Menu
- Help

## 7. Desktop Primary Navigation

```text
Dashboard
Requests
Services
Projects
Public Profile
Subscription

Settings
```

Settings remains secondary to operational navigation.

## 8. Creative Dashboard

```text
DASHBOARD
├── Needs Attention
│   ├── New Requests
│   ├── Client Responses
│   ├── Payment Awaiting Confirmation
│   ├── Ready-to-Start Requests
│   └── Services Needing Attention
├── Request Overview
├── Active Projects
├── Services and Capacity
└── Quick Actions
    ├── Create Service
    ├── Copy My Link
    ├── View Public Profile
    └── Manage Services
```

The V1 Dashboard is action-oriented rather than analytics-heavy.

## 9. Creative Requests

```text
REQUESTS
├── All
├── New
├── Awaiting Client
├── Awaiting Payment
├── Ready to Start
└── Closed
```

UX groupings map multiple underlying domain states into user-meaningful categories.

### New

Primarily submitted Requests requiring Creative review.

### Awaiting Client

Includes:

- Changes requested
- Proposal awaiting Client response
- Terms awaiting Client acceptance

### Awaiting Payment

Includes:

- Awaiting commitment
- Payment awaiting Creative confirmation
- Partially confirmed commitment

### Ready to Start

Contains Requests where all start conditions are satisfied.

### Closed

Includes:

- Declined
- Withdrawn
- Expired
- Converted to Project

## 10. Creative Request Detail

```text
REQUEST DETAIL
├── Header
│   ├── Request Name
│   ├── Client
│   ├── Service
│   ├── Status
│   ├── Price
│   └── Next Action
├── Overview
├── Scope
├── Client Brief
├── Agreement
│   ├── Current Proposal
│   ├── Clarification
│   ├── Proposal History
│   └── Terms
├── Payment
│   ├── Project Total
│   ├── Required Commitment
│   ├── Confirmed Amount
│   ├── Remaining Commitment
│   ├── Client Declarations
│   └── Creative Confirmations
└── History
```

Contextual actions may include:

- Accept
- Request Changes
- Create Proposal
- Decline
- Confirm Payment
- Start Project

Only valid actions for the current Request state are shown.

## 11. Creative Services

```text
SERVICES
├── All Services
├── Filters
│   ├── Published
│   ├── Draft
│   ├── Unavailable
│   ├── Subscription Inactive
│   └── Archived
├── Search
└── Create Service
```

Capacity remains visible near the page heading.

## 12. Service Builder

```text
SERVICE BUILDER
├── Basics
├── Pricing
├── Scope
├── Add-ons and Options
├── Delivery and Revisions
├── Client Brief
├── Terms
├── Commitment and Payment
├── Work Samples
└── Preview and Publish
```

The Builder uses strong local navigation and visible completion states.

## 13. Projects

```text
PROJECTS
├── Active
├── Completed
└── Project Detail
    ├── Overview
    ├── Agreed Scope
    ├── Client Brief
    ├── Commercial Summary
    ├── Payment Summary
    └── Original Request
```

Creative alone sees Close Project on Active Projects.

## 14. Public Profile Management

```text
PUBLIC PROFILE
├── Preview
├── Public Information
├── Availability
├── Selected Work
├── Professional Links
├── Service Order
└── Share
```

This controls Client-visible content, not private account configuration.

## 15. Subscription

```text
SUBSCRIPTION
├── Current Capacity
├── Change Capacity
├── Service Allocation
├── Free Service
├── Billing
└── Subscription Status
```

The capacity selector communicates the approved 1–10 Service pricing model, including the intentional discount at 10 Services.

## 16. Settings

```text
SETTINGS
├── Account and Security
├── Creative Profile
├── Business Preferences
├── Payment Methods
└── Notifications
```

## 17. Workspace Switching

```text
Account Menu
├── Creative Workspace
├── Client Workspace
├── Account Settings
└── Sign Out
```

Client-only users see Become a Creative instead of an existing Creative workspace.

---

# 04C. Client IA

## 18. Client Experience Areas

```text
PUBLIC CLIENT JOURNEY
Creative Profile
→ Service
→ Configuration
→ Brief
→ Verification
→ Review
→ Submit

AUTHENTICATED CLIENT WORKSPACE
├── Home
├── Requests
├── Projects
└── Account
```

## 19. Client Primary Navigation

```text
Home
Requests
Projects
Account
```

Briefs, payments, proposals, and terms live inside their Request or Project context rather than becoming separate top-level destinations.

## 20. Client Home

```text
HOME
├── Needs Your Attention
│   ├── Scope Changes
│   ├── Proposal / Quote
│   ├── Terms
│   └── Commitment Payment
├── Active Requests
├── Active Projects
└── Recent Activity
```

## 21. Client Requests

```text
REQUESTS
├── Active
│   ├── Awaiting Creative
│   ├── Action Required
│   ├── Awaiting Payment Confirmation
│   └── Ready to Start
└── Closed
```

Client-facing labels reflect who must act next rather than mirroring raw backend states.

## 22. Client Request Detail

```text
REQUEST DETAIL
├── Overview
├── Your Selection
├── Your Brief
├── Agreement
│   ├── Current Proposal
│   ├── Clarification
│   ├── Previous Proposals
│   └── Terms
├── Payment
│   ├── Required Amount
│   ├── Payment Instructions
│   ├── Payment Declarations
│   └── Creative Confirmations
└── History
```

Contextual actions may include:

- Accept Changes
- Ask for Clarification
- Accept Proposal
- Reject Proposal
- Accept Terms
- I've Made the Payment
- Withdraw Request

## 23. Client Projects

```text
PROJECTS
├── Active
├── Completed
└── Project Detail
    ├── Overview
    ├── Agreed Scope
    ├── Your Brief
    ├── Commercial Summary
    ├── Payment Summary
    └── Original Request
```

## 24. Client Account

```text
ACCOUNT
├── Profile
├── Security
└── Notifications
```

The Client is not required to build a professional public profile.

---

# 04D. Admin IA

## 25. Admin Workspace

```text
ADMIN
├── Overview
├── Users
├── Services
├── Requests
├── Projects
├── Subscriptions
├── Moderation
├── Audit
└── Platform Settings
```

## 26. Admin Overview

```text
OVERVIEW
├── Needs Attention
├── Platform Snapshot
├── Recent Activity
└── Quick Actions
```

## 27. Users

```text
USERS
├── All Users
├── Creatives
├── Clients
├── Suspended
└── User Detail
    ├── Account
    ├── Verification
    ├── Creative Profile
    ├── Subscription
    ├── Services
    ├── Requests
    ├── Projects
    ├── Moderation
    └── Audit History
```

## 28. Services

```text
SERVICES
├── All
├── Published
├── Platform Disabled
├── Service Detail
└── Categories
```

Admin normally inspects and moderates rather than editing Creative-owned configuration.

## 29. Requests and Projects

Admin can inspect operational records for authorised support but cannot accept Requests, accept terms, confirm Client Project payments, or start Projects on behalf of participants.

## 30. Subscriptions

```text
SUBSCRIPTIONS
├── Overview
├── Active
├── Past Due
├── Expired
├── Capacity Pricing
├── Billing Events
└── Subscription Detail
```

> **Superseded by `10-decisions-log-v1.0.md` D-001.**

Capacity Pricing explicitly supports:

```text
1  → ₦0 / $0
2  → ₦2,000 / $2
3  → ₦4,000 / $4
4  → ₦6,000 / $6
5  → ₦8,000 / $8
6  → ₦10,000 / $10
7  → ₦12,000 / $12
8  → ₦14,000 / $14
9  → ₦16,000 / $16
10 → ₦15,000 / $15
```

## 31. Moderation and Audit

```text
MODERATION
├── Users
├── Services
└── Moderation History

AUDIT
├── All Events
├── Filters
└── Event Detail
```

Consequential Admin actions require confirmation, reason capture, and audit logging.

## 32. Admin Boundary

V1 excludes Admin impersonation of Creative or Client participants.

---

# 04E. Public Profile & Service IA

## 33. Creative Public Profile

```text
CREATIVE PUBLIC PROFILE
├── Identity
│   ├── Profile Image
│   ├── Display Name
│   ├── Professional Title
│   ├── Location
│   └── Availability
├── Introduction
├── Services
├── Selected Work
├── About
├── Professional Links
└── Start a Project CTA
```

Services are the dominant content.

## 34. Service Detail

```text
SERVICE DETAIL
├── Creative Context
├── Service Hero
├── What You Get
├── Pricing / Packages
├── Add-ons Summary
├── Delivery
├── Revisions
├── Relevant Work
├── Key Terms
└── Configure This Service CTA
```

## 35. Client Configuration

```text
1. Base Service / Package
2. Add-ons
3. Options
4. Quantities
5. Delivery
6. Price Summary
7. Client Brief
8. Identity / Verification
9. Review
10. Terms
11. Submit
```

A persistent or collapsible commercial summary should remain accessible during configuration.

---

# 04F. Creative Mobile Navigation

## 36. Bottom Navigation

```text
Home
Requests
Services
Projects
More
```

More contains:

```text
Public Profile
Subscription
Settings
Switch to Client
Help
```

## 37. Mobile Service Builder

```text
Service Builder
→ Current Section
→ Section Content
→ Previous / Continue
```

A Sections control allows direct access to every Builder section. The Builder is not a forced linear wizard.

## 38. Mobile Reordering

Every reorderable object must support alternatives to drag-and-drop:

- Move up
- Move down
- Move to section
- Reorder mode

---

# 04G. Client Mobile Navigation

## 39. Authenticated Bottom Navigation

```text
Home
Requests
Projects
Account
```

Notifications remain in the header.

## 40. Public Journey

The public commissioning flow avoids distracting authenticated-app navigation.

## 41. Mobile Configuration

```text
Step / Progress
→ Content
→ Collapsible Price Summary
→ Continue
```

Long Briefs progress section by section rather than appearing as one enormous form.

## 42. Mobile Request Detail

```text
Header
→ Status / Next Action
→ Overview
→ Selection
→ Brief
→ Agreement
→ Payment
→ History
```

A sticky primary action is used only when the Client has a clear action to perform.

---

# 04H. Shared & Cross-Role Surfaces

## 43. Shared Request Structure

```text
Request
├── Overview
├── Scope / Selection
├── Brief
├── Agreement
├── Payment
└── History
```

Creative and Client see different language, permissions, and actions over the same conceptual object.

## 44. Shared Project Structure

```text
Project
├── Overview
├── Agreed Scope
├── Brief
├── Commercial Summary
├── Payment Summary
└── Original Request
```

## 45. Shared Utilities

- Notifications
- Authentication pages
- File viewer
- Empty states
- Loading states
- Error states
- Permission-denied states
- Resource-unavailable states
- Subscription-inactive states
- Platform-disabled states

---

# 04I. State-Based Navigation Rules

## 46. Creative Request Mapping

| Domain state | Creative location |
|---|---|
| Submitted | New |
| Changes Requested | Awaiting Client |
| Proposal Awaiting Client | Awaiting Client |
| Awaiting Commitment | Awaiting Payment |
| Payment Declared | Awaiting Payment |
| Partially Confirmed | Awaiting Payment |
| Ready to Start | Ready to Start |
| Converted | Closed and linked Project |
| Declined | Closed |
| Withdrawn | Closed |

## 47. Client Request Mapping

| Situation | Client grouping |
|---|---|
| Submitted | Awaiting Creative |
| Creative Requests Changes | Action Required |
| Proposal Created | Proposal to Review |
| Accepted | Active |
| Commitment Required | Action Required |
| Payment Declared | Awaiting Confirmation |
| Partial Commitment | Action Required |
| Ready to Start | Ready to Start |
| Converted | Closed and linked Project |
| Declined | Closed |
| Withdrawn | Closed |

## 48. Service Mapping

```text
Draft → Continue Setup
Published → Edit / Preview / Share
Unavailable → Restore Availability
Subscription Inactive → Increase Capacity
Archived → Restore to Draft
```

## 49. Context Preservation

When verification or subscription interrupts an action, successful completion returns the user to the interrupted context rather than a generic dashboard.

---

# 04J. V1 / V2 Boundary

## 50. V1 Project IA

Allowed:

- Overview
- Agreed scope
- Original Brief
- Commercial summary
- Payment summary
- Original Request
- Start date
- Status
- Close Project

## 51. Excluded From V1

- Tasks
- Milestones
- Deliverables
- Project files
- Project chat
- Feedback
- Revision rounds
- Approval
- Final handoff
- Time tracking
- Formal balance-payment stages

These should not appear as disabled or Coming Soon navigation in V1.

---

# 04K. IA Validation

The IA supports:

- Creative mobile Service creation and publication
- Capacity upgrade without losing Draft context
- Client entry from profile or direct Service URL
- Guest-to-verified Client conversion without lost progress
- Fixed-price and quote-based Requests
- Clarification, terms, and external commitment flow
- Partial payment recovery
- Creative-controlled Project Start
- Lightweight Active and Completed Projects
- One User switching between Creative and Client workspaces
- Graceful Subscription-Inactive public Service states

No blocking Phase 04 ambiguity remains.

---

# 52. Phase 04 Completion Status

Phase 04 is complete.

The approved IA now defines:

- General platform structure
- Creative desktop and mobile navigation
- Client public, authenticated, and mobile navigation
- Admin operational structure
- Public profile and Service hierarchy
- Shared Request and Project surfaces
- State-based navigation
- Subscription-driven routing
- Verification return paths
- Explicit V1/V2 navigation boundaries
