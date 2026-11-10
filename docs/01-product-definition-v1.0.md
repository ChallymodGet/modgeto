# Phase 01: Product Definition

**Status:** Complete  
**Version:** 1.0  
**Date:** 6 November 2026  
**Next Phase:** Phase 02, Product Requirements Document

> **Revision notice (10 November 2026):** The product is named **Modgeto** (`platform.com` = `modgeto.com`). §21.2 Published-Service Plans is superseded by the 1–10 capacity model and pricing in `10-decisions-log-v1.0.md` D-001. §21.7 proration is resolved by D-015. Other rulings affecting this document: D-004, D-010, D-011, D-017.

---

## 1. Product Overview

The product is a link-first service configuration and project initiation platform for independent digital creatives and technology professionals.

A Creative creates configurable services, publishes them through a personalized public link, and shares that link through portfolio CTAs, personal websites, social media, messaging apps, email, and other channels.

A prospective Client can open the link, select a service, configure what they need, specify how they want it, provide the information and files required by the Creative, understand the applicable price, accept the Creative's terms, and submit a complete Project Request.

The platform guides the relationship from initial interest to an agreed and ready-to-start Project. For V1, detailed project execution takes place outside the platform.

---

## 2. Core Value Proposition

> One personalized link through which Clients can select what they need from a Creative, specify how they want it, provide everything the Creative needs, understand the applicable price, and initiate a Project.

The product reduces repetitive conversations around:

- Available services
- Deliverables
- Pricing
- Client requirements
- Project scope
- Delivery expectations
- Revisions
- Terms
- Commitment fees
- Payment instructions
- Project-start conditions

---

## 3. Problem Statement

Creatives often receive project enquiries through portfolios, social media, messaging apps, email, and referrals, but turning those enquiries into properly scoped Projects requires considerable manual back-and-forth.

Clients need to understand what services are available, what they cost, which deliverables or options they can choose, and what information the Creative needs before work begins. Creatives repeatedly communicate this information, collect requirements through scattered channels, clarify scope, share payment details, and confirm Project-start conditions manually.

The opportunity is to give every Creative a reusable personalized link that structures this process around their own services, pricing, requirements, and terms, allowing prospective Clients to submit complete and actionable Project Requests.

---

## 4. Product Positioning

The product is not primarily a freelance marketplace.

The initial model assumes that the Creative has attracted or already knows the prospective Client through another channel and uses the platform to convert that interest into a properly structured Project.

The product should be positioned as:

> A service storefront and Project-start link for independent Creatives and digital professionals.

It complements portfolios, professional networks, and social profiles rather than replacing them.

---

## 5. Primary Launch Audience

V1 is designed for independent digital Creatives and technology professionals who sell configurable services directly to Clients.

### Design

- Graphic Designers
- Brand Identity Designers
- UI/UX Designers
- Product Designers
- Web Designers
- Motion Designers
- Illustrators

### Development

- Frontend Developers
- Backend Developers
- Full-stack Developers
- Mobile Developers
- Webflow Developers
- WordPress Developers
- Framer Developers
- Other no-code and low-code professionals

### Writing

- Copywriters
- Content Writers
- UX Writers
- Technical Writers

### Motion and Media

- Motion Designers
- Video Editors
- Other digital media Creatives

The service architecture should remain extensible enough to support other independent service professionals later.

---

## 6. User Roles

### 6.1 Creative

The person providing a service.

A Creative can:

- Create a professional profile
- Create and configure services
- Set prices
- Define packages, deliverables, add-ons, options, and quantities
- Create service-specific Briefs
- Add visual examples and references
- Define delivery timelines and revisions
- Configure terms
- Configure external payment details
- Require a commitment fee
- Publish a personalized link
- Receive and review Requests
- Accept, revise, or decline Requests
- Confirm external payments manually
- Start Projects
- Close Projects when the external work is complete

### 6.2 Client

Any individual or organisation commissioning work from a Creative.

This includes:

- Individuals
- Startups
- Businesses
- Agencies
- Organisations
- Returning Clients

Client type is informational in V1 and does not create separate system roles or workflows. The Creative can collect any relevant organisational information through the Brief Builder.

### 6.3 Admin

The platform operator responsible for:

- User administration
- Service category administration
- Basic moderation
- Plan and service-capacity configuration
- Subscription visibility
- Basic Request and Project support access
- Platform configuration

---

## 7. Core Product Relationship

```text
Creative
   -> Service
      -> Client Request
         -> Project
```

### Service

A reusable commercial configuration created by the Creative.

### Client Request

A Client's configured instance of a Service, including scope selections, Brief responses, price, timeline, terms, and payment requirements.

### Project

An accepted Request whose start conditions have been satisfied and that the Creative has explicitly started.

A submitted Request is not automatically a Project.

---

## 8. Personalized Link Model

Every Creative receives a personalized public URL, for example:

```text
platform.com/charles
```

Every published Service may also have a direct URL:

```text
platform.com/charles/brand-identity
```

The link can be used behind CTAs such as:

- Start a Project
- Work With Me
- Book a Service
- Book Now
- Hire Me
- Get Started

The link may be shared through:

- Portfolio websites
- Personal websites
- WhatsApp
- LinkedIn
- Instagram
- X
- Email
- Direct messages
- Other promotional channels

The Client must be able to browse the Creative's page and begin configuring a Service without first creating an account.

---

## 9. Product Principles

### 9.1 Creative-Controlled

The Creative decides what they sell, how they price it, what information they require, their delivery and revision terms, and how they receive payment.

### 9.2 Link-First

The personalized public link is a primary product surface, not a secondary sharing feature.

### 9.3 Client-Simple

The Client should be able to understand and initiate work without learning a complex platform.

### 9.4 Structured Before Starting

The Creative should receive sufficient scope, requirements, and commercial information before starting the Project.

### 9.5 Transparent Pricing

Where the Creative has predefined pricing, the Client should understand how packages, quantities, options, add-ons, delivery choices, discounts, and charges affect the price.

### 9.6 Discipline-Flexible

The system should support different service disciplines without forcing everyone into the same workflow.

### 9.7 Creative Owns the Commercial Relationship

The platform supports scoping, Briefing, Project initiation, and payment tracking. It does not process the Client's Project payment.

### 9.8 Snapshot-Based Integrity

Pricing, Briefs, terms, and Service configuration are preserved when a Request is submitted. Later edits to the public Service do not silently alter existing Requests.

---

## 10. Service Model

A Service is a reusable configuration created once and shared repeatedly.

### 10.1 Service Identity

- Service name
- Short description
- Category
- Cover image or thumbnail
- Optional detailed description
- Optional relevant work samples
- Pricing mode
- Status

### 10.2 Service Statuses

#### Draft

Editable by the Creative and not publicly available.

#### Published

Publicly available through the Creative's page and direct Service URL.

#### Unavailable

Retained by the Creative but closed to new Client Requests.

#### Subscription Inactive

Retained but disabled because it exceeds the Creative's currently active paid Service capacity.

### 10.3 Deliverables

Deliverables describe what the Client will receive.

Examples:

- Primary logo
- Secondary logo
- Brand icon
- Brand guidelines
- Responsive website design
- Figma source file
- Article manuscript
- Edited video

### 10.4 Add-ons

Add-ons are optional paid additions.

Example:

```text
Logo Design                 $150
Brand Guidelines            +$80
Business Card               +$20
Social Media Kit            +$40
```

### 10.5 Options

Options describe how the Client wants the Service configured. They can be free or paid.

Example:

**Website Platform or Tool**

- Figma
- Webflow
- WordPress
- Framer
- I'm not sure, recommend one

These are Creative-configured examples and not globally hard-coded options.

### 10.6 Quantities

Some Services or add-ons may be priced by quantity.

Examples:

- Social media designs
- Articles
- Website pages
- Minutes of edited video
- Presentation slides

The Creative can define:

- Unit name
- Unit price
- Minimum quantity
- Optional maximum quantity
- Default quantity

### 10.7 Dependencies

V1 supports simple dependencies:

> Item B requires Item A.

Examples:

- Brand Guidelines requires Logo Design
- Mobile Responsive Design requires Website UI Design

Complex conditional pricing rules are outside V1.

### 10.8 Delivery

A Service can include:

- Standard turnaround
- Optional Priority turnaround
- Optional Rush turnaround
- Price modifiers for expedited delivery

The delivery period starts only after the Creative explicitly starts the Project.

### 10.9 Revisions

A Service can specify:

- No revisions
- A fixed number of revisions
- Unlimited revisions
- Optional price for an additional revision

V1 records these commercial terms but does not manage revision execution after Project Start.

### 10.10 Terms

The Creative can add service-specific terms covering:

- Included work
- Excluded work
- Revision expectations
- Delivery expectations
- Client responsibilities
- Cancellation conditions
- Additional-work terms
- Commitment-fee terms

V1 uses terms acknowledgement rather than formal e-signature.

### 10.11 Payment Settings

A Service can:

- Use the Creative's default commitment rule
- Override the default commitment percentage
- Select one or more payment methods already configured on the Creative account

### 10.12 Service Ordering and Sharing

The Creative controls:

- Public display order
- Profile link sharing
- Direct Service link sharing

### 10.13 Service Duplication

Duplicating a Service is a Should Have item for V1.

### 10.14 Key Product Distinctions

- **Deliverable:** what the Client receives
- **Add-on:** an optional paid addition
- **Option:** how the Client wants the Service configured
- **Brief Question:** information the Creative needs to execute the work
- **Term:** a commercial or working condition

---

## 11. Pricing Model

Every Service uses one primary pricing mode.

### 11.1 Fixed Price

The base Service has one defined price.

Example:

```text
Logo Design        $150
```

### 11.2 Starting From

The Creative defines a minimum estimate, but confirms the final amount after reviewing the Request.

Example:

```text
Product UI/UX Design
Starting from $300
```

The Client must accept the confirmed amount before the Request proceeds.

### 11.3 Quantity-Based

```text
Unit Price x Quantity = Item Subtotal
```

Example:

```text
8 Social Media Designs x $10 = $80
```

### 11.4 Package-Based

The Creative offers two or more mutually exclusive packages.

Example:

- Starter
- Standard
- Premium

Each package can define its own:

- Price
- Deliverables
- Timeline
- Revision allowance
- Available add-ons

One package can be marked Recommended, but the label does not alter pricing or force selection.

### 11.5 Custom Quote

No final price is shown before Creative review.

The Client completes the Service configuration and Brief. The Creative then proposes:

- Scope
- Price
- Delivery timeline
- Commitment percentage
- Pricing note

The Client can accept, request clarification, or decline.

### 11.6 Compatible Price Components

The selected primary pricing mode can work with:

- Add-ons
- Paid options
- Quantities
- Priority or Rush delivery
- Additional revision pricing
- Manual discounts
- Optional additional charges
- Commitment percentage

### 11.7 Discounts

V1 supports Creative-applied manual discounts:

- Percentage discount
- Fixed-amount discount
- Optional discount label

Public coupon codes and automated campaigns are outside V1.

### 11.8 Additional Charges

The Creative can add an optional transparent charge:

- Charge label
- Percentage or fixed amount
- Short explanation

Examples include VAT or an administrative charge. The Creative is responsible for the appropriateness of any configured charge.

### 11.9 Currency

- Every Service has one currency
- All items within that Service use the same currency
- Automatic currency conversion is not supported in V1
- Differently denominated Services cannot be combined into one Request

### 11.10 Price Calculation Order

```text
1. Base Price or Selected Package
2. + Quantity-Based Items
3. + Add-ons
4. + Paid Options
5. + Delivery Modifier
6. = Configured Subtotal
7. - Discount
8. + Additional Charges
9. = Final Project Total
10. x Commitment Percentage
11. = Commitment Amount
12. Final Total - Confirmed Payments
13. = Outstanding Balance
```

### 11.11 Price Snapshot

At Request submission, preserve:

- Base price
- Package
- Add-ons
- Quantities
- Paid options
- Delivery modifier
- Discount
- Additional charges
- Final total
- Commitment percentage
- Commitment amount

Future public Service edits do not change the submitted Request.

### 11.12 Price Changes After Submission

The Creative cannot silently alter a submitted Request.

For any revision:

1. Preserve the previous scope and price
2. Show the revised scope and price
3. Show the difference
4. Require a Creative note or reason
5. Require Client acceptance
6. Recalculate commitment and balances only after acceptance

---

## 12. Brief Builder Model

Every Service can have its own Client Brief.

```text
Service
   -> Brief
      -> Sections
         -> Questions
            -> Client Responses
```

### 12.1 Supported Question Types

- Short text
- Long text
- Single choice
- Multiple choice
- Dropdown
- Number
- URL
- File upload
- Multiple file upload
- Visual or image selection

### 12.2 Question Configuration

Each question can contain:

- Question title
- Supporting description
- Example or guidance
- Question type
- Required or Optional status
- Placeholder where relevant
- Choices where relevant

### 12.3 Sections

Creatives can group questions into sections such as:

- About Your Business
- Audience and Market
- Design Direction
- Existing Materials
- Project Expectations

Sections and questions can be reordered.

### 12.4 Visual Selection Questions

The Creative can upload visual examples and ask the Client which examples resonate with them.

Example:

> Which logo styles resonate most with you?

The Creative could use visual references inspired by recognisable approaches such as Microsoft, Apple, Coca-Cola, Nike, Adidas, or FedEx, subject to appropriate rights and usage rules.

The Client may select one or multiple images and optionally explain what they like about them.

### 12.5 Conditional Questions

V1 supports simple one-level logic:

> Show Question B when Question A equals a specified answer.

Example:

```text
Do you currently have a logo?
- Yes
- No

If Yes:
Upload your existing logo.
```

Nested or complex conditional logic is outside V1.

### 12.6 Client Identity vs Brief

Essential identity information such as name and email should be collected through the Request flow and should not need to be rebuilt into every Brief.

The Brief focuses on Service-specific Project information.

### 12.7 Brief Preview

The Creative must be able to preview the Brief as the Client will experience it before publishing.

### 12.8 Brief Snapshot

When a Request is submitted, preserve:

- Sections
- Questions
- Descriptions
- Available choices
- Client responses
- Uploaded files
- Visual selections
- Conditional path shown to the Client

Later edits to the public Brief do not alter submitted Requests.

### 12.9 Brief Builder Priorities

#### Must Have

- Service-specific Briefs
- Sections
- Reordering
- Supported question types
- Required and Optional fields
- Supporting descriptions
- Visual selection
- One-level conditions
- Client-facing preview
- Brief snapshots

#### Should Have

- Duplicate Question
- Duplicate Section
- Creative-owned reusable templates
- Platform-provided starter templates

#### Later

- Complex nested conditions
- AI-generated Briefs
- Advanced scoring
- External form integrations

---

## 13. Request-to-Project Lifecycle

### 13.1 High-Level Flow

```text
Client Configures Service
        -> Completes Brief
        -> Reviews Request
        -> Submits Request
        -> Creative Reviews
        -> Accepts, Requests Changes, or Declines
        -> Scope and Price Are Agreed
        -> Client Accepts Terms
        -> Commitment Is Satisfied, if Required
        -> Ready to Start
        -> Creative Selects Start Project
        -> Active Project
```

### 13.2 Draft Request

Before submission, the Client can edit:

- Service selection
- Package
- Deliverables
- Add-ons
- Options
- Quantities
- Delivery preference
- Brief responses
- Uploaded references

### 13.3 Submitted Request

The Creative receives:

- Client identity
- Selected Service
- Full scope
- Brief responses
- Visual selections
- References
- Delivery preference
- Calculated or estimated price
- Commitment terms
- Submission date

### 13.4 Creative Actions

#### Accept

The Creative agrees to the submitted scope and price.

#### Request Changes

The Creative proposes clarification or changes to scope, quantity, timeline, price, or commitment.

#### Decline

The Creative closes the Request without starting a Project. A reason is optional.

### 13.5 Client Actions

The Client can:

- Accept proposed changes
- Ask for clarification
- Reject a revised proposal
- Accept terms
- Withdraw the Request before Project Start

### 13.6 Starting-From Flow

The submitted amount is an estimate. The Creative confirms or adjusts the final price, and the Client must accept it.

### 13.7 Custom Quote Flow

The Creative proposes scope, price, timeline, commitment, and a pricing note. No payment instructions appear until the Client accepts the quote.

### 13.8 Terms Acceptance

Before the Request becomes Ready to Start, the Client acknowledges the Creative's terms.

### 13.9 Start Conditions

A Request becomes Ready to Start when:

- Scope is agreed
- Price is agreed
- Required Brief is complete
- Terms are accepted
- Required commitment has been confirmed

The Creative must then explicitly select **Start Project**.

Payment confirmation does not automatically start the Project.

### 13.10 Request Statuses

Product-level statuses include:

- Draft
- Submitted
- Changes Requested
- Awaiting Client Response
- Accepted
- Awaiting Commitment
- Awaiting Payment Confirmation
- Partially Confirmed
- Ready to Start
- Converted to Project
- Declined
- Withdrawn
- Expired, if implemented

Exact state-machine names and transitions will be finalized in the PRD and Domain Model.

---

## 14. External Payment and Commitment Model

### 14.1 Payment Principle

The platform does not:

- Collect Client Project payments
- Hold funds
- Process transfers
- Provide escrow
- Operate a Project-payment wallet
- Automatically verify bank transfers

The Creative provides external payment instructions.

### 14.2 Payment Methods

The Creative can configure one or more methods, such as:

- Bank transfer
- PayPal
- Mobile money
- Custom payment method

Payment data may include:

- Bank or provider name
- Account name
- Account number or payment identifier
- Additional instructions

### 14.3 Commitment Fee

The Creative can define:

- Commitment required: Yes or No
- Commitment percentage

A default can be configured at account level and overridden per Service.

Example:

```text
Project Total:         $300
Commitment:             50%
Amount Due to Start:   $150
Outstanding Balance:   $150
```

### 14.4 Client Payment Declaration

After paying externally, the Client can select:

> I've Made the Payment

The Client may provide:

- Amount sent
- Method
- Date
- Reference note
- Optional proof of payment

This does not confirm receipt.

### 14.5 Creative Confirmation

The Creative independently checks their bank or payment account and records the actual amount received.

The Creative's confirmation is authoritative within the platform.

Partial receipts are supported. The Request remains blocked if the required commitment has not been fully satisfied.

### 14.6 No-Commitment Path

Where no commitment is required, payment is not a Project-start condition.

---

## 15. V1 Project Boundary

V1 ends detailed workflow when the Creative starts the Project.

### 15.1 Active Project Record

V1 retains:

- Project name
- Client
- Service
- Original Request
- Agreed scope
- Final price
- Commitment amount
- Confirmed payment amount
- Outstanding amount
- Timeline
- Start date
- Status
- Original Brief

### 15.2 Closing the Project

When the external work is complete, the Creative selects:

> Close Project

The Project becomes:

> Completed

### 15.3 Moved to V2

- Deliverable management
- Project file sharing
- Client feedback
- Revision tracking
- Milestones
- Progress tracking
- Tasks
- Project messaging
- Approval workflows
- Final asset delivery
- Structured balance-payment workflow
- Detailed completion and handoff

---

## 16. Creative Public Page Boundary

The public page is a Service storefront and Project-entry point, not a full portfolio builder.

### 16.1 Must Have

- Personalized profile URL
- Profile image
- Display name
- Professional title
- Short introduction
- Optional location
- Availability
- Published Services
- Service pricing state
- Individual Service pages
- Selected work
- External links
- Primary Project-start CTA
- Profile-link sharing
- Direct Service-link sharing
- Mobile-responsive experience
- No account required simply to browse and begin configuring

### 16.2 Availability States

- Available
- Limited Availability
- Unavailable

When unavailable, the public page remains visible but new Requests may be disabled.

### 16.3 Selected Work

V1 supports limited representative work samples on the profile and relevant Service pages.

V1 does not include:

- Rich case-study authoring
- Portfolio CMS
- Portfolio page builder
- Portfolio themes
- Full portfolio analytics

The Creative can link to an external portfolio for detailed case studies.

### 16.4 Work Sample vs Brief Example

- **Work Sample:** evidence of the Creative's previous work
- **Brief Example:** a reference used to understand Client preference

These remain distinct content types.

### 16.5 Should Have

- Testimonials
- Accent colour
- Basic page personalization

### 16.6 Later

- Custom domains
- Advanced themes
- Custom fonts
- Custom layouts
- White labeling
- Verified Client reviews
- Advanced page analytics

### 16.7 Explicit Boundary

The public page is not:

- A full website builder
- A social network
- A blogging platform
- A CV or resume builder
- A marketplace bidding profile
- A Project execution workspace

Its purpose is:

```text
Present -> Explain -> Configure -> Request
```

---

## 17. V1 MVP Scope

V1 must prove this loop:

> A Creative can package a Service, publish and share a personalized link, receive a complete Request, agree on the commercial terms, confirm any required external commitment payment, and start the Project.

### 17.1 Creative Account and Onboarding

- Account creation
- Creative profile
- Unique username
- Professional title
- Profile image
- Bio
- External links
- Availability
- Preferred currency
- Payment details
- Default commitment percentage
- Personalized public link

### 17.2 Service Management

- Create
- Edit
- Save Draft
- Preview
- Publish
- Unpublish or make Unavailable
- Delete
- Reorder
- Direct Service URL

### 17.3 Client Configuration

- Browse without account creation
- Select Service
- Select package
- Choose add-ons and options
- Enter quantities
- Select delivery speed
- See live or estimated pricing
- Complete Brief
- Upload files
- Review terms
- Review complete Request
- Submit Request

### 17.4 Request Management

Creative views:

- New Requests
- Awaiting Client
- Awaiting Payment
- Ready to Start
- Closed Requests

Creative actions:

- Accept
- Request Changes
- Propose or revise price
- Decline
- Confirm payment
- Start Project

Client actions:

- View Request
- Respond to changes
- Accept revised price or scope
- Ask for clarification
- Accept terms
- Declare payment
- Withdraw before Project Start

### 17.5 Notifications

At minimum:

- In-app notifications
- Email notifications

Critical events include:

- Request submitted
- Changes requested
- Quote proposed
- Client accepts
- Creative accepts
- Client declares payment
- Creative confirms payment
- Ready to Start
- Project started
- Request declined
- Request withdrawn

### 17.6 Admin

- View Creatives
- View Clients
- Suspend or restore accounts
- View published Services
- Manage categories
- View plan and subscription status
- Configure Service capacities
- View Requests and Projects for support or moderation
- Manage basic system settings

---

## 18. V1 Should Have

- Duplicate Service
- Duplicate Brief Question
- Duplicate Brief Section
- Creative-owned Brief templates
- Platform starter Brief templates
- Testimonials
- Accent colour
- Basic page personalization
- Request expiry
- Quote validity date
- Basic Creative dashboard metrics

---

## 19. V2 Scope

### Project Execution and Collaboration

- Deliverables
- Files
- Feedback
- Revision rounds
- Additional revision requests
- Milestones
- Progress
- Project messaging
- Balance-payment stages
- Approvals
- Final delivery
- Completion and handoff

### Additional V2 or Post-MVP Candidates

- Custom domains
- Verified Client reviews
- Advanced public-page personalization
- Creative analytics
- Project analytics
- Advanced payment records
- Service template library
- Advanced Brief conditions
- AI-assisted Service creation
- AI-assisted Brief creation
- Calendar integrations
- Contract generation
- E-signatures
- Team or agency accounts

---

## 20. Later Marketplace Expansion

Marketplace capabilities should only be considered after the link-first model is proven.

Potential later capabilities:

- Browse Creatives
- Search and discovery
- Category directory
- Recommendations
- Verified Creatives
- Public reviews
- Matching

The product should avoid introducing bidding wars, race-to-the-bottom proposals, or platform-controlled pricing if these conflict with the Creative-controlled principle.

---

## 21. Business Model

### 21.1 Revenue Model

Platform revenue comes from monthly subscriptions for published-Service capacity.

The platform does not take a commission from Client Project payments.

### 21.2 Published-Service Plans

> **Superseded by `10-decisions-log-v1.0.md` D-001.**

| Plan | Published-Service Capacity | Monthly Price | Effective Price |
|---|---:|---:|---:|
| Free | 1 | $0 | $0 |
| Additional Service | 1 additional slot | $2 | $2 per additional Service |
| 5-Service Plan | Up to 5 published Services | $8 | $1.60 per Service |
| 10-Service Plan | Up to 10 published Services | $15 | $1.50 per Service |

### 21.3 Billing Period

- Monthly recurring billing
- Annual billing is not required for V1

### 21.4 Free-Service Rule

Every Creative receives one free published-Service slot.

The free Service has access to the complete core V1 functionality.

The Creative chooses which Service occupies the free slot.

The free allowance is attached to a capacity slot, not permanently to the first Service ever created.

### 21.5 Draft Services

Draft Services do not consume published-Service capacity.

A Creative may prepare additional Services before upgrading.

### 21.6 Reusable Capacity

Published-Service capacity is reusable.

If a Creative unpublishes or removes one Service, they can use the available slot for another Service without purchasing the slot again.

### 21.7 Upgrades

Upgrades are available.

Examples:

```text
Free -> Additional Service -> 5-Service Plan -> 10-Service Plan
```

Upgrading increases the number of Services that can be publicly accessible.

Proration and payment-provider behaviour will be defined in the PRD and technical architecture.

### 21.8 Downgrades

Downgrades are available.

If the Creative has more published Services than the new plan allows, the Creative chooses which Services remain active when the downgrade takes effect.

Excess Services are disabled, not deleted.

### 21.9 Subscription Expiry

When a paid subscription expires:

- The Creative's selected free Service remains active
- Additional Services become greyed out and disabled in the Creative dashboard
- Clients cannot access or configure disabled Services
- Service configuration is retained
- Renewal can restore the Services without rebuilding them

Retained data includes:

- Pricing
- Deliverables
- Add-ons
- Options
- Brief questions
- Visual examples
- Work samples
- Terms
- URLs and slugs

### 21.10 Expired Public Links

An expired or disabled Service URL should not return an unexplained 404.

It should show:

> This Service is currently unavailable.

And provide a route to the Creative's other available Services.

### 21.11 No Project-Value Commission

The platform does not take a percentage of:

- Project value
- Commitment fee
- Outstanding balance

Client-to-Creative Project payments remain external.

---

## 22. Explicit V1 Non-Goals

- Platform processing of Client Project payments
- Escrow
- Project-payment wallet
- Automatic bank-payment verification
- Commission on Client Project value
- Automatic currency conversion
- Full portfolio website builder
- Social network
- Blog or content publishing platform
- Project execution workspace
- Deliverable management
- Project file collaboration
- Revision management after Project Start
- Built-in Project messaging after Project Start
- Milestone management
- Marketplace-first discovery
- Bidding
- Freelancer ranking
- Client job board
- Complex contracts
- E-signatures

---

## 23. MVP Success Journey

```text
CREATIVE
Signs Up
   -> Creates Profile
   -> Creates a Service
   -> Selects Pricing Model
   -> Defines Deliverables, Add-ons, and Options
   -> Builds a Service-Specific Brief
   -> Sets Terms and Commitment Percentage
   -> Adds External Payment Details
   -> Publishes Service
   -> Receives Personalized Link
   -> Places Link on Portfolio CTA

CLIENT
Clicks Start a Project
   -> Opens Creative Page
   -> Selects Service
   -> Configures Scope
   -> Selects Visual Preferences
   -> Completes Brief
   -> Reviews Price and Terms
   -> Submits Request

CREATIVE
Reviews Request
   -> Accepts or Proposes Changes

CLIENT
Accepts Agreed Scope, Price, and Terms
   -> Receives Payment Instructions
   -> Pays Externally
   -> Declares Payment Made

CREATIVE
Checks Their Account
   -> Confirms Amount Received

SYSTEM
Checks Start Conditions
   -> Marks Request Ready to Start

CREATIVE
Selects Start Project

PROJECT
Becomes Active
   -> Work Happens Outside V1
   -> Creative Selects Close Project When Done
   -> Project Becomes Completed
```

---

## 24. Phase 01 Completion Status

Phase 01 is complete because the following have been defined and approved:

- Product concept
- Problem statement
- Core value proposition
- Product positioning
- Primary launch audience
- Roles
- Client definition
- Product principles
- Personalized-link model
- Service Model
- Pricing Model
- Brief Builder Model
- Request-to-Project lifecycle
- External payment and commitment model
- Project Management boundary
- Creative Public Page boundary
- MVP scope
- V2 boundary
- Explicit non-goals
- Business Model
- Subscription expiry behaviour

This document is now the approved Product Definition source of truth for Phase 02.

---

## 25. Product Development Roadmap

```text
01. Product Definition                  COMPLETE
        ↓
02. Product Requirements Document       NEXT
        ↓
03. Business Logic / Domain Model
        ↓
04. Information Architecture
        ↓
05. User Flows
        ↓
06. UX / Wireframes
        ↓
07. Design System
        ↓
08. High-Fidelity UI
        ↓
09. Frontend Architecture
        ↓
10. Frontend Development
        ↓
11. Backend / Database / APIs
        ↓
12. Integrations
        ↓
13. QA and Validation
        ↓
14. MVP Launch
        ↓
15. Iteration and Post-MVP
```

---

## 26. Next Step

Proceed to **Phase 02: Product Requirements Document**.

The PRD should convert this approved Product Definition into:

- Functional requirements
- User stories
- Acceptance criteria
- Permissions
- State transitions
- Validation rules
- Notifications
- Subscription rules
- Edge cases
- Non-functional requirements
- Success metrics
- Release requirements

No major Phase 01 product decision should be reinvented inside the PRD without first updating this document.
