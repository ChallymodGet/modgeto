# Phase 07: Frontend Design System / UI Foundation

**Document:** 07-frontend-design-system-ui-foundation-v1.0.md  
**Status:** Approved foundation  
**Version:** 1.0  
**Date:** 10 November 2026  
**Source of truth:** Phases 01–06  
**Implementation environment:** Claude in VS Code  
**Next phase:** Phase 08, Direct Frontend UI Implementation

> **Revision notice (10 November 2026):** Versions and tooling are pinned by `10-decisions-log-v1.0.md` D-020 (Next.js 16, React 19, Tailwind v4 with `@theme`, pnpm). §52 implementation sequence gains a domain-logic step (D-022). §44 source documents now include `09-modgeto-brand-guidelines-v1.0.md` and `10-decisions-log-v1.0.md`, all under `docs/`. §19 shells and §35 responsive patterns follow the navigation model in D-031.

---

## 1. Purpose

This document defines the code-first visual and component foundation for implementing the product directly in React, Next.js, and TypeScript.

There is no Figma dependency. The implemented frontend and its documented components are the visual source of truth.

---

## 2. Locked Frontend Decisions

- React
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui primitives
- Lucide icons
- CSS variables and semantic tokens
- Light mode for V1
- Full mobile capability parity
- Code as the visual source of truth
- CLAUDE.md governance
- Component showcase
- Product components separated from generic UI primitives
- No Figma dependency
- Claude in VS Code for UI/frontend implementation

---

## 3. Locked Visual Direction

### Professional Core + Creative Storefront

The authenticated application, operational dashboards, Builder, Request, subscription, and Admin surfaces should feel clean, restrained, trustworthy, and efficient.

Public Creative profiles and Service pages may be somewhat more expressive through imagery, layout, and selective brand accents, while remaining coherent with the core product system.

The product should not feel like generic unmodified enterprise software, and it should not become visually chaotic or decorative at the expense of trust and usability.

---

# 07A. UI Technology

## 4. Tailwind CSS

Tailwind CSS is used for:

- Layout
- Responsive behaviour
- Token-driven styling
- State variants
- Component composition

Arbitrary values should be limited. Components should rely on the approved spacing, colour, typography, radius, and shadow system.

## 5. shadcn/ui

shadcn/ui is the accessible primitive foundation, not the product's visual identity.

Suitable primitives include:

- Dialog
- Drawer
- Sheet
- Select
- Dropdown Menu
- Tabs
- Checkbox
- Radio Group
- Tooltip
- Toast
- Command
- Popover

Product-specific components such as `ServiceCard`, `ProposalComparison`, `CommitmentSummary`, and `CapacitySelector` are built on top of these primitives.

shadcn defaults should be adapted to the product tokens and interaction patterns rather than copied unchanged throughout the product.

## 6. Lucide

Lucide is the single V1 interface icon system.

Do not mix multiple icon libraries without an explicit requirement.

---

# 07B. Styling Architecture

## 7. Foundation

```text
Tailwind CSS
+ CSS Variables
+ Semantic Tokens
+ Reusable React Components
```

## 8. Semantic Token Principle

Components should reference semantic roles instead of hard-coded colour names.

Conceptual tokens:

```css
--background
--foreground
--surface
--surface-subtle
--surface-elevated
--foreground-muted
--foreground-disabled
--border
--border-strong
--primary
--primary-hover
--primary-pressed
--primary-foreground
--focus
--success
--warning
--danger
--info
```

Do not scatter rules such as `text-green-600` and `bg-red-100` across product components. Product semantics should map through tokens.

---

# 07C. Colour System

## 9. Colour Roles

### Foundation

- Page background
- Standard surface
- Subtle surface
- Elevated surface

### Text

- Primary
- Secondary
- Muted
- Disabled
- Inverse

### Interactive

- Primary
- Hover
- Pressed
- Focus
- Link

### Status

- Success
- Warning
- Danger
- Information

### Border

- Default
- Strong
- Interactive
- Error

Status must never rely on colour alone. Use text, iconography, border, or an explicit status label.

## 10. Public Storefront Expression

Creative storefronts may use:

- Stronger imagery
- More expressive Service covers
- Purposeful accent colour
- Larger typography moments
- More spacious composition

They must still preserve:

- Readability
- Consistent form controls
- Accessible contrast
- Clear pricing
- Clear CTAs
- Shared product trust

---

# 07D. Typography

## 11. Typography Roles

```text
Display
H1
H2
H3
H4
Body Large
Body
Body Small
Label
Caption
```

Claude must use named typography roles or shared utilities/components instead of inventing arbitrary font sizes screen by screen.

## 12. Usage

- Display: public hero moments
- H1: application page title
- H2: major section
- H3/H4: card and subsection headings
- Body: standard content
- Label: form labels and controls
- Caption: metadata and supporting information

---

# 07E. Spacing and Sizing

## 13. Spacing Scale

Recommended foundation:

```text
4
8
12
16
20
24
32
40
48
64
80
```

Common rhythm:

- Label to input: 8
- Related fields: 16
- Form groups: 24
- Major page sections: 32–48

Avoid arbitrary spacing such as 37px unless there is a strong documented reason.

## 14. Responsive Targets

UX classifications:

- Mobile: 320–767px
- Tablet: 768–1023px
- Desktop: 1024–1439px
- Large desktop: 1440px+

Tailwind breakpoint values may use its standard naming while implementing these behaviours.

## 15. Touch Targets

Important interactive controls should generally provide at least approximately 44px of touchable height or width on mobile.

---

# 07F. Shape, Borders, Elevation, and Motion

## 16. Radius Strategy

Use a small, controlled radius scale. Avoid random radius values and excessive pill-shaped containers.

Pills are suitable for:

- Status badges
- Compact filters
- Small metadata chips

Cards, forms, and dialogs should use consistent shared radii.

## 17. Borders and Shadows

- Borders establish structure in operational interfaces.
- Shadows should be subtle and reserved for elevation, overlays, and selected contexts.
- Avoid heavy decorative shadows across every card.

## 18. Motion

Motion is functional and restrained.

Use for:

- Drawer / dialog transitions
- Collapsible price summary
- Selection feedback
- Toasts
- Section changes

Avoid:

- Decorative parallax
- Price-counting animation
- Excessive card movement
- Distracting dashboard animation

Respect reduced-motion preferences.

---

# 07G. Layout Architecture

## 19. Required Layout Primitives

```text
PublicLayout
AuthLayout
CreativeAppShell
ClientAppShell
AdminAppShell
BuilderShell
ConfigurationShell
```

## 20. Supporting Layout Components

```text
PageContainer
PageHeader
Section
SectionHeader
FormContainer
DashboardGrid
SplitLayout
StickySummary
BottomActionBar
```

Each major page should compose existing layout primitives instead of rebuilding navigation and responsive structure independently.

---

# 07H. Generic UI Primitives

## 21. Primitive Inventory

```text
Button
IconButton
Link
Input
Textarea
NumberInput
Select
Checkbox
RadioGroup
Switch
FormField
Badge
Avatar
Card
Dialog
Drawer
Sheet
Tabs
SectionNavigation
DropdownMenu
Popover
Command
Tooltip
Toast
Skeleton
EmptyState
ErrorState
```

## 22. FormField Contract

A reusable form field should support:

```ts
label
description
required
error
disabled
```

It should centrally handle label association, description IDs, error IDs, `aria-invalid`, and required state.

## 23. Overlay Accessibility

Dialog, drawer, and sheet primitives should centrally handle:

- Semantic roles
- Focus trap
- Escape behaviour
- Return focus
- Keyboard operation
- Accessible title and description

---

# 07I. Product Components

## 24. Service Components

```text
ServiceCard
ServiceStatusBadge
PackageCard
PackageSelector
DeliverableList
AddOnCard
AddOnSelector
OptionGroup
OptionCard
QuantityControl
DeliveryOption
RevisionSummary
```

## 25. Pricing Components

```text
MoneyDisplay
PriceModifier
PriceBreakdown
EstimatedPrice
PriceDifference
CommitmentSummary
```

## 26. Brief Components

```text
BriefSection
BriefProgress
QuestionRenderer
TextQuestion
ChoiceQuestion
VisualChoiceQuestion
FileQuestion
ConditionalQuestion
```

## 27. Request Components

```text
RequestCard
RequestStatus
RequestSummary
ScopeSummary
ProposalCard
ProposalComparison
ClarificationPanel
TermsPanel
```

## 28. Payment Components

```text
PaymentInstructions
PaymentDeclarationForm
PaymentConfirmationForm
PaymentRecord
CommitmentProgress
```

## 29. Subscription Components

```text
CapacitySelector
CapacityUsage
CapacityPrice
ServiceAllocation
SubscriptionStatus
```

## 30. Shared Product Components

```text
AttentionItem
NotificationItem
StatusTimeline
```

---

# 07J. Component States

## 31. Global Interactive States

- Default
- Hover
- Focus
- Active
- Selected
- Disabled
- Loading
- Error

## 32. Form States

- Empty
- Filled
- Invalid
- Valid where useful
- Required
- Optional
- Disabled
- Read-only

## 33. Product States

The status system must cover:

- Draft
- Published
- Unavailable
- Subscription inactive
- Platform disabled
- New Request
- Awaiting Client
- Awaiting Payment
- Partial commitment
- Ready to Start
- Active
- Completed
- Declined
- Withdrawn
- Expired

Backend enum names should be translated into actor-appropriate human language.

---

# 07K. Responsive Component Behaviour

## 34. Desktop and Mobile Are Designed Together

For every Phase 08 screen, Claude must implement:

1. Mobile structure
2. Tablet adaptation
3. Desktop structure

in the same implementation task.

## 35. Selected Responsive Patterns

| Component / Surface | Desktop | Mobile |
|---|---|---|
| Public profile | Multi-column sections | Single-column |
| Service detail | Content + summary | Stacked + CTA |
| Configuration | Form + sticky summary | Form + collapsible summary |
| Dashboard | Multi-column cards | Stacked priorities |
| Service Builder | Global + local nav + form | Section-based Builder |
| Request detail | Tabs/anchors/hybrid | Section selector + stack |
| Admin listing | Table | Cards/list |
| Drawer | Side drawer | Full-screen sheet |
| Dialog | Centered modal | Sheet or full-width modal |

No core action may be hidden on mobile.

---

# 07L. Selection Cards

## 36. Standard

Selectable cards are used where context matters, including:

- Packages
- Delivery choices
- Service options
- Visual preferences

They must use actual radio or checkbox semantics beneath the styled presentation.

A selection is communicated by more than colour, such as a border, check indicator, and accessible selected state.

---

# 07M. Status Architecture

## 37. StatusBadge

Generic intents:

```text
neutral
info
success
warning
danger
```

Example mapping:

- Draft → neutral
- Published → success
- Subscription inactive → warning
- New Request → info
- Ready to Start → success
- Declined → danger
- Completed → neutral or success

Exact colour values remain token-controlled.

---

# 07N. Iconography

## 38. Lucide

Use one icon library consistently.

Common interface icons may include:

- Plus
- Chevron
- Check
- X
- AlertTriangle
- Info
- Bell
- Settings
- Copy
- ExternalLink
- MoreHorizontal
- Upload
- File
- User
- Briefcase

Icon-only controls require accessible labels.

---

# 07O. Theme Strategy

## 39. Light Mode V1

V1 is light mode only.

Reasons:

- Reduces initial visual QA burden
- Keeps focus on core product value
- Avoids doubling public, Creative, Client, Admin, form, status, upload, and overlay QA

Semantic tokens must still be used so a dark theme can be introduced later without rewriting every component.

---

# 07P. Code Organisation

## 40. Recommended Structure

```text
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

types/

styles/
```

### components/ui

Generic visual and accessibility primitives.

### product component folders

Reusable product presentation components.

### features

Business composition, state, actions, data-access boundaries, and feature-specific logic.

This prevents a single unstructured components folder.

---

# 07Q. CLAUDE.md Governance

## 41. Required Purpose

A root-level `CLAUDE.md` should govern AI-assisted implementation in VS Code.

## 42. Product Rules

Claude must be instructed:

- Do not invent features.
- Respect the V1/V2 boundary.
- Client Project payments remain external.
- Only the Creative confirms payment receipt.
- Only the Creative starts and closes a Project.
- Mobile capability parity is mandatory.
- Authentication is email/password only.
- Email and phone verification are required.
- In-app and email notifications are required.
- Limited Availability still accepts Requests.
- Multiple Requests with the same Creative are allowed.
- The same Service can be requested repeatedly for separate Projects.
- Clarification is contextual Request discussion, not Project chat.
- Initial terms are acknowledged at submission.
- Final terms are accepted before Ready to Start.
- Material Terms changes require reacceptance.

## 43. UI Rules

Claude must:

- Reuse existing primitives and product components.
- Use semantic tokens.
- Use the spacing scale.
- Use the typography hierarchy.
- Preserve keyboard accessibility.
- Implement mobile and desktop together.
- Use Lucide consistently.
- Avoid duplicating components.
- Avoid arbitrary one-off colour values.
- Avoid adding dark mode in V1.
- Avoid creating Figma-dependent workflows.

## 44. Source Documents

Claude should consult:

```text
01-product-definition-v1.0.md
02-product-requirements-document-v1.0.md
03-business-logic-domain-model-v1.0.md
04-information-architecture-v1.0.md
05-user-flows-v1.0.md
06-ux-wireframes-screen-specification-v1.0.md
07-frontend-design-system-ui-foundation-v1.0.md
```

before introducing unapproved behaviour.

---

# 07R. Component Showcase

## 45. Code as Visual Source of Truth

Use either:

- Storybook, when introduced; or
- A restricted internal component showcase route such as `/dev/components`

The showcase should render:

- Buttons
- Inputs
- Selection cards
- Status badges
- Service cards
- Package selectors
- Price breakdowns
- Brief questions
- Request states
- Payment states
- Capacity selectors
- Empty/loading/error states

The development route must not be publicly exposed in production without protection.

---

# 07S. Implementation Sequence

## 46. Step 1: Foundation

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide

## 47. Step 2: Tokens

- Colour
- Typography
- Spacing
- Radius
- Border
- Shadow
- Breakpoints
- Motion

## 48. Step 3: Generic Primitives

Buttons, forms, overlays, navigation primitives, status, loading, empty, and error states.

## 49. Step 4: Application Layouts

Public, authentication, Creative, Client, Admin, Builder, and Configuration shells.

## 50. Step 5: Product Components

Service, Brief, Request, Payment, Subscription, Project, and notification components.

## 51. Step 6: Component Showcase

Visually validate primitives and product components in isolation.

## 52. Step 7: Phase 08 Screens

Recommended order:

1. Creative Public Profile
2. Service Detail
3. Client Configuration
4. Client Brief
5. Review and Submit
6. Creative Dashboard
7. Services
8. Service Builder
9. Creative Request Detail
10. Client Request Detail
11. Subscription
12. Projects
13. Admin

---

# 07T. Quality Gates

## 53. Component Gate

Before use in full screens, a reusable component should have:

- Typed props
- Responsive behaviour
- Keyboard behaviour
- Accessible labels/roles
- Loading/disabled/error state where applicable
- Token-based styling
- Visual showcase example

## 54. Screen Gate

Before a screen is considered complete:

- Mobile and desktop both work
- Empty/loading/error states exist
- Keyboard access works
- No unapproved feature was added
- Status language matches the actor
- Price and payment language is accurate
- V1/V2 boundary is preserved
- Shared components are reused where appropriate

---

## 55. Phase 07 Completion Status

The frontend UI foundation decisions are locked.

The exact brand colour values and final typeface selection may be established during the initial Phase 08 foundation implementation, provided they follow the approved **Professional Core + Creative Storefront** direction and semantic-token architecture.

The next phase is **Phase 08: Direct Frontend UI Implementation with Claude in VS Code**.
