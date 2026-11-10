# Phase 08 Foundation: Brand Visual Tokens

**Document:** 08-brand-visual-tokens-v1.0.md  
**Status:** Approved  
**Version:** 1.0  
**Date:** 10 November 2026  
**Implementation environment:** Claude in VS Code  
**Visual source of truth:** Code

> **Revision notice (10 November 2026):** §12 recommended radius usage is amended by `10-decisions-log-v1.0.md` D-032 (dashboard and public cards use 16px). UI style direction is recorded in D-031.

---

## 1. Visual Direction

### Professional Core + Creative Storefront

The authenticated application, dashboards, Service Builder, Request workflows, subscription, and Admin surfaces must feel clean, restrained, trustworthy, and efficient.

Public Creative profiles and Service pages may be more expressive through imagery, typography scale, spacious composition, and controlled brand accents.

The visual system must:

- Feel trustworthy enough for business and payment-related activity.
- Feel modern enough for designers, developers, writers, and other digital professionals.
- Avoid looking like generic unmodified enterprise software.
- Avoid visual excess that competes with Creative work samples.
- Maintain accessibility and readable contrast.

---

## 2. Brand Palette

### Primary: Electric Indigo

Primary action and recognition colour.

| Token | Hex |
|---|---|
| primary-50 | `#F3F2FF` |
| primary-100 | `#E8E6FF` |
| primary-200 | `#D2CEFF` |
| primary-300 | `#AEA7FF` |
| primary-400 | `#8B80FF` |
| primary-500 | `#635BFF` |
| primary-600 | `#5147E5` |
| primary-700 | `#4238BF` |
| primary-800 | `#372F99` |
| primary-900 | `#2E287A` |
| primary-950 | `#1B1748` |

Usage:

- Primary buttons
- Active navigation
- Important links
- Selected controls
- Focused branded moments
- Public storefront CTAs

Do not use Primary for every decorative element.

### Secondary: Electric Cyan

Supporting creative and technical accent.

| Token | Hex |
|---|---|
| secondary-50 | `#ECFEFF` |
| secondary-100 | `#CFFAFE` |
| secondary-200 | `#A5F3FC` |
| secondary-300 | `#67E8F9` |
| secondary-400 | `#22D3EE` |
| secondary-500 | `#06B6D4` |
| secondary-600 | `#0891B2` |
| secondary-700 | `#0E7490` |
| secondary-800 | `#155E75` |
| secondary-900 | `#164E63` |

Usage:

- Storefront accents
- Supporting illustrations
- Selected informational details
- Secondary graphics
- Future charts/analytics accents

Secondary is not an alternative default CTA colour.

### Tertiary: Creative Coral

Warm expressive accent.

| Token | Hex |
|---|---|
| tertiary-50 | `#FFF4F1` |
| tertiary-100 | `#FFE5DF` |
| tertiary-200 | `#FFCFC5` |
| tertiary-300 | `#FFA998` |
| tertiary-400 | `#FB8975` |
| tertiary-500 | `#F97360` |
| tertiary-600 | `#E45745` |
| tertiary-700 | `#BF4132` |
| tertiary-800 | `#9D372C` |
| tertiary-900 | `#823229` |

Usage:

- Public storefront accents
- Promotional highlights
- Onboarding artwork
- Decorative brand moments

Tertiary Coral must not be used as the Danger colour.

---

## 3. Neutral Palette

| Token | Hex |
|---|---|
| neutral-0 | `#FFFFFF` |
| neutral-25 | `#FCFCFD` |
| neutral-50 | `#F8FAFC` |
| neutral-100 | `#F1F5F9` |
| neutral-200 | `#E2E8F0` |
| neutral-300 | `#CBD5E1` |
| neutral-400 | `#94A3B8` |
| neutral-500 | `#64748B` |
| neutral-600 | `#475569` |
| neutral-700 | `#334155` |
| neutral-800 | `#1E293B` |
| neutral-900 | `#0F172A` |
| neutral-950 | `#020617` |

The authenticated application should be predominantly neutral.

---

## 4. Semantic Colours

### Success

- Base: `#16A34A`
- Subtle: `#F0FDF4`
- Border: `#BBF7D0`

Use for Published, Available, Ready to Start, confirmed payment, verification complete, successful save, and completed actions.

### Warning

- Base: `#D97706`
- Subtle: `#FFFBEB`
- Border: `#FDE68A`

Use for Limited Availability, partial commitment, subscription issues, and non-critical action required.

### Danger

- Base: `#DC2626`
- Subtle: `#FEF2F2`
- Border: `#FECACA`

Use for validation errors, destructive actions, suspension, failed critical actions, and serious system failures.

### Information

- Base: `#2563EB`
- Subtle: `#EFF6FF`
- Border: `#BFDBFE`

Use for New Request, educational callouts, and explanatory states.

---

## 5. Semantic UI Tokens

```css
:root {
  --background: #F8FAFC;
  --foreground: #0F172A;

  --surface: #FFFFFF;
  --surface-subtle: #F1F5F9;
  --surface-elevated: #FFFFFF;

  --foreground-secondary: #475569;
  --foreground-muted: #64748B;
  --foreground-disabled: #94A3B8;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;

  --primary: #635BFF;
  --primary-hover: #5147E5;
  --primary-pressed: #4238BF;
  --primary-subtle: #F3F2FF;
  --primary-foreground: #FFFFFF;

  --secondary: #06B6D4;
  --secondary-subtle: #ECFEFF;

  --tertiary: #F97360;
  --tertiary-subtle: #FFF4F1;

  --success: #16A34A;
  --success-subtle: #F0FDF4;
  --success-border: #BBF7D0;

  --warning: #D97706;
  --warning-subtle: #FFFBEB;
  --warning-border: #FDE68A;

  --danger: #DC2626;
  --danger-subtle: #FEF2F2;
  --danger-border: #FECACA;

  --info: #2563EB;
  --info-subtle: #EFF6FF;
  --info-border: #BFDBFE;

  --focus: #635BFF;
}
```

Map these into the Tailwind and shadcn semantic-token system. Do not duplicate raw values throughout components.

---

## 6. Colour Proportion

### Authenticated Application

Approximate visual balance:

- 80% neutral
- 15% Primary Indigo
- 5% semantic / Secondary / Tertiary accents

### Public Storefront

Approximate visual balance:

- 70% neutral
- 20% Primary Indigo
- 10% expressive brand accents

Creative work imagery supplies much of the visual richness.

---

## 7. Button Colours

### Primary

- Background: `primary-500`
- Text: White
- Hover: `primary-600`
- Pressed: `primary-700`
- Focus ring: Primary

Use for dominant actions such as Create Service, Submit Project Request, Accept Proposal, and Start Project.

### Secondary

- Background: White
- Text: Neutral 900
- Border: Neutral 300
- Hover background: Neutral 50

Use for Preview, View Brief, Ask for Clarification, and similar supporting actions.

### Ghost / Tertiary

- Transparent background
- Neutral 700 text
- Neutral 100 hover

Use for low-hierarchy actions.

### Destructive

- Danger background
- White text

Use only where destructive prominence is appropriate. Secondary destructive actions may use an outlined or ghost-danger treatment.

---

## 8. Approved Brand Gradient

Use sparingly:

```css
linear-gradient(
  135deg,
  #635BFF 0%,
  #8B80FF 45%,
  #06B6D4 100%
)
```

Suitable for:

- Public decorative artwork
- Onboarding visuals
- Empty-state illustration backgrounds
- Brand graphics

Do not use for routine dashboards, forms, navigation, tables, or every CTA.

---

## 9. Typography

### Typeface

Use **Inter** throughout V1.

Reasons:

- Strong interface readability
- Reliable pricing/numeric display
- Suitable for dense application UI
- Works for public and operational surfaces
- Avoids unnecessary second-font dependency

### Roles

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

### Usage

- Display: public hero moments
- H1: application page titles
- H2: major sections
- H3/H4: cards and subsections
- Body: standard content
- Label: forms and controls
- Caption: metadata and supporting information

Use shared typography utilities/components. Do not invent arbitrary font sizes per screen.

---

## 10. Pricing Typography

### Major Price

Large, high contrast:

```text
₦150,000
```

### Modifier

```text
+₦80,000
```

### Proposal Comparison

```text
Previous: ₦300,000
Proposed: ₦375,000
Difference: +₦75,000
```

Do not rely on colour alone for price changes.

---

## 11. Spacing

Approved spacing scale:

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

Suggested rhythm:

- Label to input: 8
- Related fields: 16
- Form groups: 24
- Page sections: 32–48

Avoid arbitrary values without documented need.

---

## 12. Radius

| Role | Value |
|---|---:|
| Small | 6px |
| Medium | 8px |
| Large | 12px |
| XL | 16px |
| Full | 9999px |

Recommended usage:

- Inputs: 8px
- Buttons: 8px
- Cards: 12px
- Public artwork/work cards: 16px
- Status badges: Full

Avoid making every element pill-shaped.

---

## 13. Borders

- Default: `1px solid #E2E8F0`
- Strong: `#CBD5E1`
- Selected/interactive: `#635BFF`
- Error: `#DC2626`

The application should rely more on borders than heavy card shadows.

---

## 14. Shadows

### Small

```text
0 1px 2px rgba(15, 23, 42, 0.06)
```

Use for subtle elevation and dropdowns.

### Medium

```text
0 8px 24px rgba(15, 23, 42, 0.10)
```

Use for dialogs, drawers, and overlays.

Avoid adding shadows to every operational card.

---

## 15. Status Mapping

| Product state | Semantic treatment |
|---|---|
| Draft | Neutral |
| Published | Success |
| Available | Success |
| Limited Availability | Warning |
| Unavailable | Neutral |
| Subscription Inactive | Warning |
| Platform Disabled | Danger |
| New Request | Information |
| Awaiting Client | Neutral / Information |
| Awaiting Payment | Warning |
| Payment Confirmation Required | Warning |
| Partial Commitment | Warning |
| Ready to Start | Success |
| Active Project | Information |
| Completed | Success |
| Declined | Danger |
| Withdrawn | Neutral |
| Expired | Neutral / Warning |

Use a shared StatusBadge mapping rather than choosing colours per page.

---

## 16. Public Storefront Behaviour

The public storefront should use:

- White / near-white surfaces
- Large, confident typography
- Strong Creative imagery
- Indigo primary CTAs
- Subtle Indigo/Cyan details
- Occasional Coral accents
- Generous spacing

Avoid covering the storefront in gradients or allowing platform colour to compete with Creative work samples.

---

## 17. Authenticated Application Behaviour

Use:

- `#F8FAFC` page backgrounds
- White operational surfaces
- Slate text
- Thin Slate borders
- Indigo primary actions
- Semantic status colours only where meaningful
- Minimal shadows
- Moderate information density

---

## 18. Creative Profile Customization Boundary

V1 uses one controlled platform theme.

V1 does not allow Creatives to enter arbitrary profile colours because that would introduce contrast, hover, dynamic-token, and accessibility risks.

Creative-custom accent colours may be considered later.

---

## 19. Do / Do Not

### Do

- Use semantic tokens.
- Keep application surfaces neutral.
- Use Indigo for primary action hierarchy.
- Use Cyan and Coral as controlled accents.
- Let Creative work imagery provide expression.
- Use one status mapping.
- Maintain accessible contrast.
- Implement mobile and desktop together.

### Do Not

- Use raw palette classes throughout components.
- Use Cyan or Coral as random CTA colours.
- Use Coral for Danger.
- Put gradients on every page.
- Add dark mode in V1.
- Add user-controlled profile colours in V1.
- Invent arbitrary font sizes, radii, or shadows.
- Use colour alone for status or selection.

---

## 20. Implementation Requirement

These tokens must be implemented before full Phase 08 screen construction and exposed through:

- CSS variables
- Tailwind semantic configuration
- shadcn theme mapping
- Shared typography utilities
- Shared status mapping
- Shared radius, spacing, border, and shadow utilities
