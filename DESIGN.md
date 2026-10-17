---
name: ZenFocus
colors:
  surface: '#fbf8ff'
  surface-dim: '#d8d8ed'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2ff'
  surface-container: '#edecff'
  surface-container-high: '#e6e6fc'
  surface-container-highest: '#e1e1f6'
  on-surface: '#191b2a'
  on-surface-variant: '#464555'
  inverse-surface: '#2d2f3f'
  inverse-on-surface: '#f0efff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4f43e3'
  primary: '#3725cd'
  on-primary: '#ffffff'
  primary-container: '#5146e5'
  on-primary-container: '#dbd8ff'
  inverse-primary: '#c3c0ff'
  secondary: '#5e50ae'
  on-secondary: '#ffffff'
  secondary-container: '#a799fd'
  on-secondary-container: '#3b2b89'
  tertiary: '#005347'
  on-tertiary: '#ffffff'
  tertiary-container: '#006d5e'
  on-tertiary-container: '#72f1d8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#3522cb'
  secondary-fixed: '#e5deff'
  secondary-fixed-dim: '#c8bfff'
  on-secondary-fixed: '#1a0063'
  on-secondary-fixed-variant: '#463795'
  tertiary-fixed: '#7af8de'
  tertiary-fixed-dim: '#5bdbc3'
  on-tertiary-fixed: '#00201b'
  on-tertiary-fixed-variant: '#005045'
  background: '#fbf8ff'
  on-background: '#191b2a'
  surface-variant: '#e1e1f6'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  metric-display:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 68px
    letterSpacing: -0.03em
  metric-display-mobile:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-tablet: 1.75rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an atmosphere of centered calm, cognitive clarity, and shared household trust. Serving both self-directed students seeking deep study flow and parents guiding digital balance, the design language harmonizes quiet productivity with gentle, supportive guardrails. It rejects abrasive parental lockouts and anxious timers in favor of intentional ritual and collaborative accountability.

The visual direction blends **Modern Tactile Minimalism** with **Calm Ambient Depth**:
- **Intelligent Simplicity:** Clean, uncluttered layouts with generous negative space to reduce cognitive fatigue during extended study sessions.
- **Supportive Transparency:** Dual-sided UI semantics that convey safety and progress without surveillance-heavy or punitive aesthetics.
- **Signature Motifs:** 
  - *Zen Ring:* Continuous circular tracks representing cyclical focus intervals, state of flow, and mindfulness breaks.
  - *Family Bridge:* Shared nodes and soft connecting curves linking student milestones with parent encouragement feeds.
- **Refined Premium Polish:** Micro-shadows tinted with ambient indigo, gossamer hairline strokes, and smooth spatial state transitions.

## Colors

The palette balances authoritative deep indigo with restorative lavender and refreshing mint, creating clear cognitive boundaries between task execution, reflection, and parental oversight.

### Role Allocations

- **Primary (`#5146E5` - Deep Indigo):** Anchor color for focused actions, active states, key data metrics, primary interactive triggers, and core student session initiations.
- **Secondary (`#A99BFF` - Soft Lavender):** Atmospheric accent for mindfulness intervals, secondary controls, non-urgent tags, and ambient progress track indicators.
- **Tertiary (`#55D6BE` - Fresh Mint):** High-clarity reward accent designating completed focus streaks, approved family requests, healthy screen time credits, and positive reinforcement.
- **Neutral Primary (`#191B2A`):** High-contrast text and structural elements in light mode; neutral foundation for dark mode surfaces.
- **Neutral Secondary (`#777B90`):** Supporting metadata, subtle border lines, timestamps, and placeholder states.

### Surface System & Mode Roles

- **Light Mode:**
  - Canvas Base: `#F7F8FC`
  - Elevated Container / Cards: `#FFFFFF`
  - Subtle Borders: `#E6E8F2`
  - Text Primary: `#191B2A`
  - Text Secondary: `#777B90`
- **Dark Mode:**
  - Canvas Base: `#11131F`
  - Elevated Container / Cards: `#1B1E2D`
  - Subtle Borders: `#292D42`
  - Text Primary: `#F5F6FA`
  - Text Secondary: `#8D92A9`

### Functional Semantics

- **Success (`#35B98A`):** Unlocked apps, goal achievement, completed assignments.
- **Warning (`#F3B85B`):** Nearing scheduled downtime, focus limit warnings, pending parent requests.
- **Error / Destructive (`#EF6574`):** Hard limit breaches, session cancellations, network disconnections.

## Typography

The typography leverages Inter exclusively across all scales to maintain neutrality, high legibility, and geometric precision. Tight negative letter spacing is applied to large sizes to enhance cohesion, while smaller labels feature expanded tracking for quick legibility on monitoring dashboards and ambient watchfaces.

### Typographic Hierarchy Rules

- **Display & Large Numerics:** Reserved for the Zen Ring session timer (`metric-display`) and primary dashboard onboarding metrics. Always pair timer readouts with tabular figures (`tnum`) to eliminate spatial jitter during active countdowns.
- **Headlines:** Use `headline-xl` down to `headline-sm` with medium and semibold weights to preserve a quiet, authoritative tone without visual aggression.
- **Body:** Standard body reading uses `body-md` set to `#191B2A` (light) or `#F5F6FA` (dark). Long-form educational tips or parental advisory guides transition to `body-lg` for enhanced comfort.
- **Labels & Metas:** `label-sm` utilizes an uppercase transformation with positive letter-spacing (`+0.04em`) specifically for state chips (e.g., "STUDY BLOCKED", "FOCUSING", "REST INTERVAL").

## Layout & Spacing

The layout is structured around an adaptive 12-column grid for desktop workspaces and parent admin hubs, converting to an 8-column layout for tablets and a 4-column column fluid stack for mobile study companions.

### Grid Breakpoints & Behavior

- **Desktop (1200px+):** 12 columns, `margin: 2.5rem`, `gutter: 1.5rem`. Max content container capped at `1280px` centered, ensuring focus dashboards remain compact and scannable without horizontal eye drift.
- **Tablet (768px – 1199px):** 8 columns, `margin-tablet: 1.75rem`, `gutter: 1.25rem`. Two-column split between session management and scheduled parental rules.
- **Mobile (< 768px):** 4 columns, `margin-mobile: 1.25rem`, `gutter-mobile: 1rem`. Full-width fluid components stacked vertically, positioning the primary Zen Ring indicator in the upper focal half of the viewport.

### Spatial Rhythm

- Internal card and container paddings strictly implement `space-lg` (`1.5rem`) on larger screens, relaxing to `space-md` (`1rem`) on small screen cards.
- Vertical sectioning across dashboard modules employs `space-xl` (`2.5rem`) to create resting pauses between student activity streams and parent control sections.

## Elevation & Depth

Visual depth is achieved through **Tonal Surface Layering** paired with ultra-refined **Indigo-Tinted Ambient Shadows**. Heavy, drop-black cast shadows are prohibited to preserve an airy, distraction-free environment.

### Surface Tiers

1. **Base (Level 0):** Canvas `#F7F8FC` (Dark: `#11131F`). Flat, receded ground.
2. **Elevated Surface (Level 1):** Cards and static panels `#FFFFFF` (Dark: `#1B1E2D`). Outlined with a continuous 1px hairline border (`#E6E8F2` / `#292D42`).
3. **Interactive & Floating (Level 2):** Modals, flyouts, and active session pods utilize subtle ambient depth:
   - *Light Mode:* `0 10px 30px -10px rgba(81, 70, 229, 0.08), 0 4px 12px -2px rgba(25, 27, 42, 0.03)`
   - *Dark Mode:* `0 12px 32px -8px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(169, 155, 255, 0.12)`
4. **Active Focus Glow (Signature State):** Active countdown cards and active Zen Rings emit a soft mint or lavender atmospheric halo:
   - `box-shadow: 0 0 40px -8px rgba(85, 214, 190, 0.22)`

## Shapes

The shape system emphasizes friendly, organic calm through soft geometric contours. Sharp corners are avoided entirely to reinforce psychological safety and family harmony.

### Geometry Hierarchy

- **Base Radius (`0.5rem` / 8px):** Form fields, inputs, tooltips, and compact action chips.
- **Large Radius (`rounded-lg` / `1rem` / 16px):** Primary buttons, metric badges, and secondary popovers.
- **Double-Large Radius (`rounded-2xl` / `1.5rem` / 24px):** Standard content modules, task check cards, and control toggles.
- **Triple-Large Radius (`rounded-3xl` / `2rem` / 32px):** Hero containers, major Zen Ring housings, and the Family Bridge connection hub.
- **Circular (Pill / Full):** Progress rings, student avatars, and state badges.

## Components

### Buttons
- **Primary Action (Start Session, Authorize):** Solid `#5146E5` fill, `#FFFFFF` text, `rounded-lg` (16px), height 48px, horizontal padding `space-lg`. Hover state subtly lightens the surface and shifts down via a 1px transition.
- **Secondary (Take a Break, Skip):** Tinted lavender background (10% `#A99BFF`), `#5146E5` text, zero border.
- **Ghost / Tertiary:** Transparent background, `#777B90` text, highlighting to `#191B2A` on hover with a faint `#E6E8F2` border.

### Input Fields & Controls
- **Text Inputs:** Height 48px, `rounded-md` (8px), background `#FFFFFF` (Dark: `#1B1E2D`), 1px solid `#E6E8F2` border. Focus transitions border to `#5146E5` with an ambient `0 0 0 3px rgba(81, 70, 229, 0.12)` ring.
- **Checkboxes & Radios:** `rounded-sm` (4px for checkboxes, full circle for radios). Unselected: 1.5px border `#777B90`. Selected: Solid `#5146E5` with a crisp white tick mark.
- **Switch Toggles (Parental App Locks):** 28px height, 48px width, pill-shaped. Inactive: `#E6E8F2` background with white thumb. Active: Solid `#55D6BE` fill with thumb shifting smoothly to the right.

### Chips & Badges
- **Status Chips:** Height 28px, `rounded-full`, horizontal padding 12px.
  - *Active Study:* Tinted `#5146E5` bg (12% opacity), text `#5146E5`.
  - *Break Session:* Tinted `#55D6BE` bg (15% opacity), text `#238E75`.
  - *Restricted:* Tinted `#EF6574` bg (12% opacity), text `#D63F50`.

### Cards & Modules
- Standard containers utilize `rounded-2xl` (24px) with solid white background in light mode (`#1B1E2D` in dark mode) and a 1px hairline border. No heavy drop-shadows; depth is derived from canvas contrast.

### Specialized Platform Components
- **Zen Ring Widget:** Central focus circular gauge. The static track is 8px wide in `#E6E8F2` (Dark: `#292D42`). The active progress stroke is a continuous gradient between `#5146E5` and `#55D6BE` with rounded caps. The center holds `metric-display` figures paired with a gentle breathing pulse animation.
- **Family Bridge Node:** A bidirectional sync card displaying student milestones on the left, connected via a dashed hairline curve to parent approval/reward actions on the right. Approved requests trigger a soft mint glow across the connection line.