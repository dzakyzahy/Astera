# ASTERA — Component Specification & Design System

Version: 1.0
Last updated: 1 Sep 2026
Implements: [DESIGN.md](file:///C:/Users/o_o/Documents/Astera/docs/DESIGN.md) v3 (Cloud + Sienna light-mode system)

---

## 1. Design tokens

### 1.1 Color tokens

All colors use hex values. CSS custom properties are defined in `:root` and consumed throughout the app via `var()`. No hardcoded hex values in component CSS — always reference tokens.

```css
:root {
  /* ── Surfaces ── */
  --surface-base:      #F5F5F5;   /* Cloud — app background */
  --surface-raised:    #FFFFFF;   /* Paper — cards, panels */
  --surface-secondary: #FAFAFA;   /* Fog — alt table rows, secondary panels */
  --surface-overlay:   #FFFFFF;   /* Modals, popovers (+ shadow for depth) */

  /* ── Borders ── */
  --border-subtle:     #EBEBEB;   /* Mist — hairlines, card edges */
  --border-strong:     #D4D4D4;   /* Stone — inputs, focused dividers */

  /* ── Text ── */
  --text-primary:      #171717;   /* Ink — headings, primary data */
  --text-secondary:    #404040;   /* Graphite — body, labels */
  --text-tertiary:     #737373;   /* Slate — timestamps, disabled */

  /* ── Accent ── */
  --accent:            #92400E;   /* Sienna — primary actions, active nav */
  --accent-hover:      #B45309;   /* Sienna Light — hover/pressed */
  --accent-wash:       #FEF3C7;   /* Sienna Wash — selected rows, active BGs */
  --accent-foreground: #FFFFFF;   /* Text on accent fills */

  /* ── Status (semantic, small use only) ── */
  --status-critical:   #B91C1C;   /* Garnet — critical severity */
  --status-warning:    #B45309;   /* Marigold — caution/SLA */
  --status-good:       #15803D;   /* Sage — healthy/approved */
  --status-info:       #1D4ED8;   /* Steel — informational/AI */

  /* ── Shadows ── */
  --shadow-sm:    0 1px 2px rgb(0 0 0 / 5%);
  --shadow-card:  0 1px 3px rgb(0 0 0 / 6%), 0 1px 2px rgb(0 0 0 / 4%);
  --shadow-modal: 0 20px 60px rgb(0 0 0 / 12%), 0 4px 16px rgb(0 0 0 / 6%);

  /* ── Radius ── */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-pill: 999px;
}
```

### 1.2 Typography tokens

Font: Geist Sans (primary), Geist Mono (IDs/codes). Fallback: system-ui, -apple-system, sans-serif.

| Token | Size | Weight | Tracking | Line height | Use |
|---|---|---|---|---|---|
| `--type-display` | 32–38px | 570 | -0.04em | 1.1 | Page headings ("Good afternoon, Principal") |
| `--type-heading` | 17–18px | 560 | -0.02em | 1.25 | Section headings, card titles |
| `--type-subhead` | 14px | 540 | -0.01em | 1.3 | Subsection headings |
| `--type-body` | 13px | 400 | 0 | 1.55 | Body text, descriptions |
| `--type-caption` | 11px | 400 | 0 | 1.45 | Metadata, help text |
| `--type-micro` | 9–10px | 600 | 0.06–0.11em | 1.3 | Eyebrow labels, status text |
| `--type-data` | 17px | 570 | -0.02em | 1.2 | KPI numbers, quote prices |
| `--type-mono` | 9px | 400 | 0.02em | 1.3 | Incident IDs, asset codes |

**Numeric discipline:** `font-variant-numeric: tabular-nums` on all elements containing monetary values, dates, counts, or measurements.

### 1.3 Spacing scale

Based on 4px grid. Available values: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48, 64.

| Context | Value |
|---|---|
| Card inner padding | 20–24px |
| Section gap (vertical) | 18px |
| Grid gap | 12–18px |
| Element gap (within a group) | 6–8px |
| Content max width | 1480px |
| Workspace horizontal padding | clamp(18px, 3vw, 48px) |

### 1.4 Breakpoints

| Name | Width | Behavior |
|---|---|---|
| Mobile | < 720px | Single column, bottom sheet overlays, hidden side rail |
| Tablet | 720–1050px | Simplified grids, stacked layouts |
| Desktop | > 1050px | Full command grid, side-by-side panels |

---

## 2. Component specifications

### 2.1 App shell

```
┌─────────────────────────────────────────┐
│                 Topbar                   │
├──────┬──────────────────────────────────┤
│ Side │          Workspace               │
│ Rail │                                  │
│      │                                  │
└──────┴──────────────────────────────────┘
```

**Topbar** (76px height desktop, 68px mobile)
- Left: Brand wordmark (Geist, caps, tracking +0.24em) + subtitle
- Center: Estate switcher dropdown
- Right: Private workspace badge, search, notifications, role avatar
- Background: `var(--surface-raised)` with `var(--shadow-sm)` bottom border
- Border: 1px `var(--border-subtle)` bottom
- Sticky, z-index: 30

**Side rail** (92px width, hidden below 720px)
- Vertical icon navigation: Overview, Incidents, Assets, Vendors, Audit, Privacy
- Active state: `var(--accent-wash)` background, `var(--accent)` text, left 2px `var(--accent)` inset border
- Default: `var(--text-tertiary)` icons
- Background: `var(--surface-raised)`, right border `var(--border-subtle)`

**Workspace**
- Max width: 1480px, centered
- Padding: clamp(18px, 3vw, 48px) horizontal, 22px top, 40px bottom

### 2.2 Cards

Base card container for all elevated content (estate pulse, incident detail, metrics, sections).

| Property | Value |
|---|---|
| Background | `var(--surface-raised)` |
| Border | 1px `var(--border-subtle)` |
| Border radius | `var(--radius-xl)` (20px) for main cards, `var(--radius-lg)` (14px) for nested |
| Shadow | `var(--shadow-card)` |
| Padding | 20–24px |

**Card heading pattern:**
- Eyebrow: `--type-micro`, `var(--text-tertiary)`, uppercase, tracking 0.11em, with optional icon
- Title: `--type-heading`, `var(--text-primary)`
- Right side: badge or action

### 2.3 Buttons

#### Primary button
| Property | Value |
|---|---|
| Background | `var(--accent)` |
| Color | `var(--accent-foreground)` (white) |
| Height | 42px |
| Padding | 0 16px |
| Border radius | `var(--radius-md)` |
| Font | 13px, weight 680 |
| Hover | `var(--accent-hover)` background |
| Active | scale(0.98) transform |
| Disabled | opacity 0.46, no shadow |
| Focus | 2px `var(--accent)` outline, 3px offset |

#### Secondary button
| Property | Value |
|---|---|
| Background | transparent |
| Border | 1px `var(--border-strong)` |
| Color | `var(--text-secondary)` |
| Height | 42px |
| Hover | `var(--surface-secondary)` background |

#### Ghost / text action
| Property | Value |
|---|---|
| Background | transparent |
| Color | `var(--accent)` |
| Font size | 10–11px |
| Hover | underline |

### 2.4 Status indicators

Status is always communicated as **dot + label**, never color alone.

| Status | Dot color | Label color | Background (pill) |
|---|---|---|---|
| Critical / High priority | `var(--status-critical)` | `#991B1B` | `#FEF2F2` |
| Warning / Attention | `var(--status-warning)` | `#92400E` | `#FFFBEB` |
| Good / Healthy | `var(--status-good)` | `#166534` | `#F0FDF4` |
| Info / AI suggestion | `var(--status-info)` | `#1E40AF` | `#EFF6FF` |
| Scheduled | `var(--accent)` | `var(--accent)` | `var(--accent-wash)` |

**Dot:** 6px circle, border-radius 50%
**Pill badge:** height 22–24px, border-radius `var(--radius-pill)`, 8px horizontal padding

### 2.5 Data tables

**Asset table / vendor list pattern:**

| Property | Value |
|---|---|
| Container | 1px `var(--border-subtle)` border, `var(--radius-lg)` radius, overflow hidden |
| Header row | `var(--surface-secondary)` background, `--type-micro` uppercase, `var(--text-tertiary)` |
| Data row | 12px 14px padding, `var(--border-subtle)` bottom border |
| Row hover | `var(--surface-secondary)` background |
| Row text | `--type-caption` for labels, `--type-body` weight 560 for primary values |
| Status dot | inline before condition text |
| Chevron | 12px, `var(--text-tertiary)`, right-aligned |

**Alternating rows:** use `var(--surface-secondary)` on even rows (optional, only when table is dense).

### 2.6 Metric cards

Four-column grid on desktop, two-column on mobile.

| Property | Value |
|---|---|
| Layout | Flex row, icon left, content right |
| Icon container | 35px square, `var(--radius-md)`, tinted per metric tone |
| Title | `--type-micro`, uppercase, `var(--text-tertiary)` |
| Value | `--type-data`, `var(--text-primary)`, tabular-nums |
| Subtitle | `--type-mono`, `var(--text-tertiary)` |

**Tone mapping** (icon background + icon color):

| Tone | Icon BG | Icon color |
|---|---|---|
| amber (warning) | `#FFFBEB` | `var(--status-warning)` |
| emerald (good) | `#F0FDF4` | `var(--status-good)` |
| sienna (primary) | `var(--accent-wash)` | `var(--accent)` |
| steel (info) | `#EFF6FF` | `var(--status-info)` |

### 2.7 Overlays (modals, popovers)

| Property | Value |
|---|---|
| Backdrop | `rgb(0 0 0 / 30%)`, blur(8px) |
| Panel background | `var(--surface-overlay)` |
| Panel border | 1px `var(--border-subtle)` |
| Panel radius | `var(--radius-xl)` |
| Panel shadow | `var(--shadow-modal)` |
| Panel width | min(520px, 100%) default; min(960px, 100%) for wide |
| Close button | 34px square, `var(--border-subtle)` border, `var(--text-tertiary)` icon |
| Mobile | Full-width bottom sheet, radius top only |
| Animation | Fade in 160ms ease-out |
| Focus trap | Mandatory |
| Escape | Closes overlay |
| Body scroll | Locked while overlay is open |

### 2.8 Form elements

| Element | Property | Value |
|---|---|---|
| Input/textarea | Border | 1px `var(--border-strong)` |
| | Background | `var(--surface-raised)` |
| | Padding | 12px |
| | Radius | `var(--radius-lg)` |
| | Focus | `var(--accent)` border, 3px `var(--accent-wash)` ring |
| | Placeholder | `var(--text-tertiary)` |
| Label | Position | Above input |
| | Style | `--type-caption`, weight 540, `var(--text-primary)` |
| Error | Position | Below input |
| | Style | `var(--status-critical)`, `--type-micro` |

### 2.9 AI recommendation block

| Property | Value |
|---|---|
| Border | 1px `#DBEAFE` (light blue tint) |
| Background | `#EFF6FF` (very light blue) |
| Radius | `var(--radius-lg)` |
| Layout | Grid: 34px icon column + content |
| Icon | `var(--status-info)` on `#DBEAFE` background, `var(--radius-md)` |
| Label | `--type-micro`, uppercase, `var(--status-info)` |
| Body | `--type-caption`, `var(--text-secondary)` |
| Link | `var(--status-info)`, underline on hover |

### 2.10 Audit timeline

| Property | Value |
|---|---|
| Layout | Vertical list, 29px icon column + content |
| Connector | 1px vertical line, `var(--border-subtle)`, left 14px |
| Event icon | 29px square, `var(--border-subtle)` border, `var(--radius-sm)` |
| New event icon | `#F0FDF4` background, `var(--status-good)` border + icon color |
| Title | `--type-caption`, weight 540, `var(--text-primary)` |
| Metadata | `--type-mono`, `var(--text-tertiary)` |

### 2.11 Toast notifications

| Property | Value |
|---|---|
| Position | Fixed, bottom-right, 22px inset |
| Background | `var(--surface-raised)` |
| Border | 1px `var(--status-good)` at 20% opacity |
| Radius | `var(--radius-lg)` |
| Shadow | `var(--shadow-modal)` |
| Layout | Grid: icon + message + close |
| Animation | Slide up 12px + fade, 220ms ease-out |

### 2.12 Estate constellation (overview map)

The constellation is a visual representation of the estate portfolio. In light mode:

| Property | Value |
|---|---|
| Background | `var(--surface-raised)` with subtle grid pattern using `var(--border-subtle)` |
| Orbit lines | `var(--border-subtle)`, 1px |
| Connection lines | Linear gradient from transparent to `var(--border-strong)` to `var(--accent-wash)` |
| Node core (healthy) | `#F0FDF4` background, `var(--status-good)` border, `var(--status-good)` icon |
| Node core (alert) | `#FFFBEB` background, `var(--status-warning)` border, `var(--status-warning)` icon |
| Node core (assigned) | `var(--accent-wash)` background, `var(--accent)` border, `var(--accent)` icon |
| Node label | `var(--surface-raised)` background, `var(--border-subtle)` border |
| Node pulse | Same color as node, animated opacity |

### 2.13 Quote comparison panel

| Property | Value |
|---|---|
| Layout | Grid: 245px summary + flexible options column |
| Quote option | `var(--surface-raised)` background, `var(--border-subtle)` border |
| Selected state | `var(--accent)` left inset border (3px), `var(--accent-wash)` background |
| Price | `--type-data` at 20px, `var(--accent)`, weight 560, tabular-nums |
| Comparison grid | 3-column within each quote, `var(--border-subtle)` dividers |
| Recommended label | `var(--accent-wash)` background, `var(--accent)` text |

### 2.14 Demo notice badge

| Property | Value |
|---|---|
| Border | 1px `var(--accent-wash)` |
| Background | `var(--accent-wash)` at 40% opacity |
| Color | `var(--accent)` |
| Dot | 5px circle, `var(--accent)` with glow shadow |
| Font | `--type-micro`, tracking 0.025em |
| Radius | `var(--radius-pill)` |

---

## 3. Layout patterns

### 3.1 Command grid (main overview)

```
Desktop (> 1050px):
┌────────────────────────┬──────────────┐
│     Estate pulse       │   Incident   │
│     (1.55fr)           │   (0.9fr)    │
├────────────────────────┴──────────────┤
│  Metric 1  │  Metric 2  │  Metric 3  │  Metric 4  │
├───────────────────────────────────────┤
│            Operations section          │
├────────────────────────┬──────────────┤
│     Vendors (1.35fr)   │ Audit (0.75) │
└────────────────────────┴──────────────┘

Mobile (< 720px): Single column stack
```

### 3.2 Section pattern

Every operational section follows:

```
┌─ Eyebrow (--type-micro, uppercase) ─────────────────────┐
│  Heading (--type-heading)              [Action / Badge]  │
├──────────────────────────────────────────────────────────┤
│  Content area                                            │
└──────────────────────────────────────────────────────────┘
```

- Section background: `var(--surface-raised)`
- Section border: 1px `var(--border-subtle)`
- Section radius: `var(--radius-xl)`
- Section padding: 20px
- Scroll margin top: 92px (accounts for sticky topbar)

---

## 4. Interaction patterns

### 4.1 State transitions

Every interactive element must define all states:

| State | Visual treatment |
|---|---|
| Default | As specified per component |
| Hover | Subtle background shift or border highlight |
| Active/pressed | scale(0.98) or translate-y(-1px) |
| Focus-visible | 2px `var(--accent)` outline, 3px offset |
| Disabled | opacity 0.46, cursor not-allowed |
| Loading | Skeleton matching final layout shape, or spinner |

### 4.2 Focus management

- All overlays trap focus
- Escape closes the active overlay
- Tab order follows visual reading order
- Skip-link for main content
- Interactive elements have accessible names

### 4.3 Animation

- **Entry:** fade + translate-y(12px), 160ms ease-out
- **Overlay:** fade backdrop + panel, 160ms ease-out
- **Toast:** translate-y(12px) + fade, 220ms ease-out
- **State pulse:** 2.8s ease-out infinite (node health indicator)
- **Reduced motion:** all non-essential animation disabled via `prefers-reduced-motion: reduce`

---

## 5. Responsive behavior

### 5.1 Mobile adaptations (< 720px)

| Component | Adaptation |
|---|---|
| App shell | Single column, no side rail |
| Topbar | Two-column (brand + actions), no estate switcher |
| Side rail | Hidden, replaced by mobile nav overlay |
| Primary action | Icon-only (42px square) |
| Secondary action | Hidden |
| Command grid | Single column stack |
| Metric grid | 2-column |
| Asset table | 2-column (name + status) |
| Vendor row | 3-column (monogram + name + verification) |
| Overlays | Bottom sheet, full-width, top radius only |
| Incident facts | Single column stack |
| Quote workspace | Single column stack |
| Dispatch steps | 2-column grid |

### 5.2 Tablet adaptations (720–1050px)

- Command grid: single column
- Metric grid: 2-column
- Lower grid: single column
- Quote workspace: single column with horizontal summary

---

## 6. Export/print template

For PDF/CSV reports (family-office summaries):

| Property | Value |
|---|---|
| Background | `#FFFFFF` (pure white) |
| Text | `var(--text-primary)` on white |
| Accent | `var(--accent)` for rules and headers |
| Typography | Same Geist family, dark text |
| Layout | Clean tables, header with estate/date/prepared-by |
| No UI chrome | No buttons, hover states, or interactive affordances |

---

*Cross-references: [DESIGN.md](file:///C:/Users/o_o/Documents/Astera/docs/DESIGN.md) for visual direction and color rationale, [PRD.md](file:///C:/Users/o_o/Documents/Astera/docs/PRD.md) for feature requirements, [ARCHITECTURE.md](file:///C:/Users/o_o/Documents/Astera/docs/ARCHITECTURE.md) for technical boundaries.*
