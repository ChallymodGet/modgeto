# Phase 05: User Flows

**Document:** 05-user-flows-v1.0.md  
**Status:** Complete  
**Version:** 1.0  
**Date:** 9 November 2026  
**Source of truth:** Phases 01–04  
**Next phase:** Phase 06, UX / Wireframes

> **Revision notice (10 November 2026):** §50 Capacity Pricing is superseded by `10-decisions-log-v1.0.md` D-001. §52 downgrade timing and §53 expiry are clarified by D-015 and D-016. §18 Guest-to-Verified Client uses Supabase anonymous sign-in (D-024). §21 terms acceptance is clarified by D-002.

---

## 1. Purpose

This document defines the V1 end-to-end ecosystem flow, task-level Creative, Client, and Admin flows, authentication and verification, Service creation and publishing, Request negotiation, terms, external payment, subscription capacity, exception recovery, cross-device continuity, and flow validation.

---

# 05A. General User Flow

## 2. Master Ecosystem Flow

```text
CREATIVE
Create Account
→ Verify Email
→ Verify Phone
→ Create Creative Profile
→ Set Business Preferences
→ Configure Payment Method
→ Create First Service
→ Configure Service
→ Build Client Brief
→ Preview
→ Publish
→ Share Personalized Link

CLIENT
Open Profile or Direct Service Link
→ Select Service
→ Configure Scope
→ Complete Brief
→ Authenticate / Verify
→ Review
→ Accept Terms
→ Submit Request

CREATIVE
Review Request
├── Accept
├── Request Changes / Proposal
└── Decline

CLIENT + CREATIVE
Clarify and Agree Scope / Price
→ Accept Terms
→ Satisfy Commitment if Required
→ Ready to Start

CREATIVE
Start Project
→ Active Project
→ Work Occurs Outside V1
→ Close Project
→ Completed
```

## 3. Core Flow Principles

- Preserve interrupted context.
- Preserve Guest configuration through authentication.
- Every lifecycle state should make the next responsible actor clear.
- Commercial changes require explicit Client acceptance.
- Live Service changes do not alter submitted Requests.
- External payment remains external.
- Client declaration does not equal payment confirmation.
- Ready to Start does not equal Active Project.
- Project execution is outside V1.

---

# 05B. Creative User Flows

## 4. Creative Onboarding

```text
Sign Up
→ Email + Password
→ Verify Email
→ Verify Phone via Termii OTP
→ Create Profile
→ Set Availability, Currency, Commitment Default
→ Add or Skip Payment Method
→ Create First Service
```

Profile completion and first-Service publication are separate analytics events.

## 5. First Service

```text
Create Service
→ Basics
→ Pricing
→ Scope
→ Add-ons and Options
→ Delivery and Revisions
→ Client Brief
→ Terms
→ Commitment and Payment
→ Work Samples
→ Preview and Publish
```

The first Published Service uses the free capacity slot.

## 6. Additional Service

```text
Create Draft
→ Configure
→ Publish
→ Capacity Available?
├── Yes → Publish
└── No
     → Choose New Capacity
     → Paystack Subscription
     → Verify Subscription Server-Side
     → Return to Draft
     → Publish
```

## 7. Edit Service

```text
Services
→ Select Service
→ Edit
→ Autosave
→ Validate
→ Save
```

Future Client configurations use the new version. Historical Request snapshots remain unchanged.

## 8. Availability

```text
Availability
├── Available → Requests Enabled
├── Limited → Requests Enabled
└── Unavailable → New Requests Blocked
```

## 9. Review Request

```text
Notification
→ Request Detail
→ Review Scope, Brief, Files, Price, Timeline
→ Accept / Request Changes / Create Proposal / Decline
```

## 10. Request Changes

```text
Request Changes
→ Explain Change
→ Adjust Scope, Timeline, or Price
→ Send
→ Await Client
```

## 11. Structured Clarification

```text
Agreement
→ Clarification
→ Add Note
→ Client Notified
→ Client Responds
→ Continue Until Agreement
```

This is not general Project chat and does not continue as an execution workspace after Project Start.

## 12. Confirm Payment

```text
Payment Declaration Notification
→ Request Payment Section
→ Check External Account
→ Enter Actual Amount Received
→ Confirm
→ Recalculate Commitment
```

## 13. Start and Close Project

```text
Ready to Start
→ Start Project
→ Revalidate
→ Create Active Project

Active Project
→ Close Project
→ Completed
```

---

# 05C. Client User Flows

## 14. Profile Entry

```text
Portfolio / Social / Messaging Link
→ Creative Profile
→ Browse Services
→ Select Service
→ Configure
```

## 15. Direct Service Entry

```text
Direct Service Link
→ Service Detail
→ Configure
```

## 16. Service Configuration

```text
Base / Package
→ Add-ons
→ Options
→ Quantities
→ Delivery
→ Current Pricing
→ Brief
→ References
→ Review
```

## 17. Long Brief

```text
Section 1
→ Validate
→ Section 2
→ Validate
→ Continue Until Complete
```

Conditional questions only appear when triggered.

## 18. Guest to Verified Client

```text
Configured Request
→ Sign In or Sign Up
→ Verify Email
→ Verify Phone
→ Attach Guest Configuration
→ Return to Review
```

## 19. Submit Request

```text
Review
→ Revalidate Service and Price
→ Review Terms
→ Submit with Idempotency Key
→ Confirmation
→ Await Creative
```

## 20. Review Proposal or Changes

```text
Notification
→ Request
→ Compare Previous and Proposed Scope/Price
→ Accept / Clarify / Reject / Withdraw
```

## 21. Accept Terms

```text
Review Exact Terms
→ Accept
→ Record Snapshot and Timestamp
```

Materially updated terms require new acceptance.

## 22. Declare External Payment

```text
View Payment Instructions
→ Pay Creative Externally
→ I've Made the Payment
→ Enter Amount, Method, Date
→ Optional Reference / Proof
→ Submit Declaration
→ Await Creative Confirmation
```

## 23. Partial Payment Recovery

```text
Creative Confirms Partial Amount
→ Client Sees Remaining Commitment
→ Makes Additional External Payment
→ Declares Another Payment
```

## 24. Ready to Start and Project

```text
All Conditions Met
→ Ready to Start
→ Wait for Creative
→ Project Started Notification
→ View Active Project
→ Completed Notification
```

---

# 05D. Admin User Flows

## 25. Find User

```text
Global Search
→ Search Name, Email, Phone, Username
→ Select User
→ User Detail
```

## 26. Suspend / Restore User

```text
User Detail
→ Suspend
→ Enter Reason
→ Confirm
→ Audit Event
```

Restore reactivates account status but still re-evaluates Service and subscription conditions.

## 27. Disable / Restore Service

```text
Service Detail
→ Moderation
→ Disable
→ Reason
→ Confirm
→ Moderation = Platform Disabled
→ Audit
```

Restoring moderation does not automatically override Service lifecycle or subscription inactivity.

## 28. Manage Categories

```text
Services
→ Categories
→ Create / Edit / Disable / Reorder
→ Save
```

## 29. Investigate Request or Project

```text
Search / Listing
→ Record Detail
→ Inspect Participants, Snapshots, Agreement, Payment, State and Audit
```

Admin receives no participant commercial actions.

## 30. Investigate Subscription

```text
Subscriptions
→ Search Creative
→ Review Capacity, Service Use, Free Service, Billing Period, Status and Events
```

## 31. Change Future Capacity Pricing

```text
Capacity Pricing
→ Select Capacity and Market
→ Enter Future Price
→ Effective Date
→ Review
→ Confirm
```

Historical subscription transactions remain unchanged.

---

# 05E. Authentication & Verification Flows

## 32. Signup

```text
Full Name
→ Email
→ Phone
→ Password
→ Create Account
→ Verify Email
→ Verify Phone
→ Active Account
```

## 33. Email Verification

```text
Send Verification Email
→ Open Link
→ Token Valid?
├── Yes → Verified
└── No → Request New Link
```

## 34. Phone Verification

```text
Normalize Phone to E.164
→ Request OTP
→ Termii Sends Code
→ Enter Code
→ Validate
```

Invalid or expired codes support retry and rate-limited resend.

## 35. Password Recovery

```text
Forgot Password
→ Enter Email
→ Recovery Email
→ Valid Single-Use Link
→ New Password
→ Resume
```

## 36. Contextual Return

After verification, recovery, or sign-in, users return to the interrupted flow, such as Request Review or Service Publishing.

---

# 05F. Service Creation & Publishing Flows

## 37. Create and Resume Draft

```text
Create Service
→ Enter Data
→ Autosave Draft
→ Leave
→ Return on Any Supported Device
→ Continue
```

## 38. Publish Validation

```text
Publish
→ Validate
├── Invalid
│    → Explain Specific Issues
│    → Link to Relevant Sections
│    → Fix and Revalidate
└── Valid
     → Check Capacity
     → Publish or Upgrade
```

## 39. Unpublish and Archive

```text
Published Service
→ Unpublish
→ Confirm
→ New Requests Blocked
→ Slot Freed
```

```text
Service
→ Archive
→ Preserve History
→ Restore to Draft if Needed
```

---

# 05G. Request & Commercial Agreement Flows

## 40. Fixed Price

```text
Request Submitted
→ Creative Accepts
→ Scope and Price Locked
→ Terms
→ Commitment
```

## 41. Starting From

```text
Estimated Request
→ Creative Reviews
→ Final Proposal
→ Client Accepts / Clarifies / Rejects
→ Agreement
```

## 42. Custom Quote

```text
Quote Request
→ Creative Proposal
→ Client Review
→ Accept / Clarify / Reject
```

## 43. Proposal Replacement

```text
Proposal V1
→ Creative Creates V2
→ V1 Superseded
→ Client Reviews V2
```

## 44. Withdrawal

```text
Client Withdraws Before Project Start
→ Optional Reason
→ Confirm
→ Withdrawn
```

---

# 05H. External Payment & Commitment Flows

## 45. Payment Method Setup

```text
Settings
→ Payment Methods
→ Add Method
→ Bank / PayPal / Mobile Money / Custom
→ Save
```

## 46. Commitment Configuration

```text
Service Builder
→ No Commitment / Default / Custom
→ Select Percentage
→ Select Eligible Payment Methods
```

## 47. Declaration and Confirmation

```text
Client Pays Externally
→ Declares Payment
→ Creative Checks External Account
→ Confirms Actual Amount
→ Recalculate Commitment
```

## 48. Multiple Payments

Multiple declarations and confirmations accumulate until the commitment threshold is satisfied.

## 49. No-Commitment Path

If no commitment is required, payment is omitted entirely from Ready-to-Start conditions.

---

# 05I. Subscription & Capacity Flows

## 50. Capacity Pricing

> **Superseded by `10-decisions-log-v1.0.md` D-001.**

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

The 10-Service discount is communicated intentionally.

## 51. Paystack Subscription

```text
Select Capacity
→ Review Price
→ Paystack Checkout
→ Return
→ Server / Webhook Verification
→ Activate Capacity
```

Browser return alone is not authoritative.

## 52. Downgrade

```text
Choose Lower Capacity
→ Current Usage Exceeds Limit?
├── No → Schedule / Apply
└── Yes
     → Choose Services to Remain Active
     → Choose Free Service
     → Confirm Excess Services Become Inactive
```

## 53. Expiry and Renewal

```text
Subscription Expires
→ Free Service Remains Eligible
→ Excess Services Inactive
→ Existing Requests / Projects Continue
```

```text
Renew
→ Paystack Verification
→ Restore Capacity
→ Validate and Reactivate Services
```

---

# 05J. Exception & Recovery Flows

## 54. Material Service Change During Configuration

```text
Client Started Configuration
→ Service Changes
→ Continue / Submit
→ Detect Version Difference
→ Explain Material Changes
→ Recalculate
→ Client Reviews
```

## 55. Service or Creative Becomes Unavailable

```text
Revalidate Before Submission
→ Unavailable
→ Block Submission
→ Explain
→ Offer Available Services
```

Already-submitted Requests continue.

## 56. Upload Failure

```text
Specific File Fails
→ Preserve Other Data
→ Retry or Remove
```

## 57. Session Expiry

```text
Protected Action
→ Reauthenticate
→ Return to Exact Context
```

## 58. Duplicate Submission and Start

Idempotency returns the existing Request or Project rather than creating duplicates.

## 59. Provider Failures

### Paystack

Show subscription confirmation pending until server verification succeeds.

### Brevo

Retry email delivery without reversing the business action.

### Termii

Do not mark phone verified during provider failure. Allow retry.

### Cloudflare R2

Preserve form/Brief state and allow upload retry.

---

# 05K. Cross-Device / Mobile Flows

## 60. Cross-Device Draft Continuity

```text
Phone Draft
→ Server Autosave
→ Desktop Sign-In
→ Same Draft
```

## 61. Mobile-Only Creative Journey

```text
Signup
→ Verify
→ Profile
→ Payment Method
→ Service
→ Brief
→ Publish
→ Share
→ Request
→ Clarification
→ Confirm Payment
→ Start Project
→ Close Project
```

## 62. Mobile-Only Client Journey

```text
Shared Link
→ Profile / Service
→ Configure
→ Brief
→ Verify
→ Submit
→ Proposal
→ Terms
→ External Payment
→ Declaration
→ Project Notification
```

## 63. Mobile Reordering

Reorder mode supports Move Up, Move Down, and Move to Section. Drag-and-drop is optional, not exclusive.

---

# 05L. Flow Validation

## 64. Validated Scenarios

The flows support:

- Free Creative onboarding and first-Service publication
- Client acquisition through portfolio CTA or direct Service link
- Fixed-price acceptance
- Starting-From pricing
- Custom Quote negotiation
- Structured clarification
- Multiple Requests with the same Creative
- Repeated Requests for the same Service
- External commitment declaration and Creative confirmation
- Partial commitment recovery
- No-commitment Projects
- Explicit Ready-to-Start and Start Project separation
- Lightweight Active and Completed Projects
- Capacity changes from 1 through 10 Services
- The intentional 10-Service discount below 9-Service pricing
- Subscription expiration with open Requests
- Available, Limited, and Unavailable Creative states
- Mobile-only Creative and Client journeys
- Provider outage recovery
- Duplicate-submission and duplicate-Project prevention

## 65. Clarification Status

No blocking product clarification remains for Phase 05.

The specific Paystack recurring-billing implementation for capacities 1–10 remains an integration architecture decision rather than a User Flow decision.

---

# 66. Phase 05 Completion Status

Phase 05 is complete.

The next phase is **Phase 06: UX / Wireframes**, which should cover:

1. Screen inventory
2. Responsive layout strategy
3. Public Profile and Service wireframes
4. Client configuration and Brief wireframes
5. Creative Dashboard and Requests
6. Service Builder
7. Client Request and Payment
8. Subscription and capacity
9. Project records
10. Admin operations
11. Mobile variants alongside desktop
12. UX validation before visual design
