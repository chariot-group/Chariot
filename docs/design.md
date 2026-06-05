# Design Rules Baseline - Chariot Frontend

This document formalizes the design baseline observed in the frontend (`services/web/client/src`).  
It first describes the current state (observable facts), then defines governance rules for future UI changes.

## 1. Scope and Analysis Sources

- Main source: `services/web/client/src/` (pages, components, UI primitives, global styles)
- Token file: `services/web/client/src/app/[locale]/globals.css`
- Core primitives: `components/ui/*` (notably `button`, `tabs`, `sidebar`, `card`, `input`)
- High-density UI domains: Character, Sidebar, Welcome, Profile, Initiative Tracker

## 2. Visual System (Tokens, Colors, Radius)

## 2.1 Global Theme

The project relies on a dark theme with a global background image:

- Global background: `--background: #0c0c0c`
- Main text: `--foreground: #b2b2b2`
- Card/popover surface: `--card: #19191c`
- Primary color: `--primary: #4e00de`
- Secondary/accent color: `--secondary` / `--accent: #aa00ff`

## 2.2 Recurring Custom Palette

Palette defined and reused through custom utilities:

- `--blue: #61ebff`
- `--green: #9ae201`
- `--red: #ff2d2d`
- `--pink: #ffadff`
- `--yellow: #ffc400`
- `--white: #f7f7f7`
- `--gray: #2b2b2b`
- `--gray-middle-light: #27272e`
- `--gray-light: #d6d6d6`
- `--purple: #4e00de`

Dedicated utility classes exist for these colors: `bg-*`, `text-*` (for example `.blue`, `.pink`), and `border-*`.

## 2.3 Observed Color Semantics

- Character tabs and actions:
  - General: `blue`
  - Battle: `red` (white text)
  - Magic: `pink`
  - Inventory: `yellow`
  - History: `green`
- Neutral/surface states:
  - Card and panel backgrounds: `bg-card`, `bg-gray-middle-light`
  - Inactive/neutral states: grays (`bg-gray`, gray variants, transparency)
- Danger/error states:
  - `destructive` and `red` for critical actions

## 2.4 Border Radius and Shape Language

The design system is strongly rounded:

- Root variable: `--radius: 36px`
- Standard button: `rounded-[15px]`
- Tabs trigger: `rounded-[13px]`
- Business cards and badges: `rounded-[15px]` to `rounded-[30px]`
- Pill-shaped controls: `rounded-full`

Implicit rule: prefer strongly rounded corners over square edges.

## 3. Spacing (Padding, Margin, Gaps)

## 3.1 Dominant Scale

A compact Tailwind scale is used most frequently:

- `px-2`, `px-3`, `px-4`, `px-5`, `px-6`, `px-8`, `px-10`
- `py-1.5`, `py-2`, `py-2.5`, `py-3`, `py-4`, `py-5`, `py-8`
- `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`
- Frequent margins: `mt-1`, `mb-2/4/6/8`, `mx-auto`

## 3.2 Observed Layout Patterns

- Horizontal page containers:
  - Mobile: `px-2` or `px-3/4`
  - Tablet: `sm:px-6`
  - Desktop: `md:px-8`, sometimes `md:px-10`
- Scrollable regions:
  - `overflow-y-auto` with custom scrollbar styling (`::-webkit-scrollbar`)
  - recurring `pr-2` to prevent content from sitting under the scrollbar
- Grids:
  - Welcome/Profile: `grid-cols-1`, then `xl:grid-cols-2` or `xl:grid-cols-3`

## 3.3 Vertical Rhythm

- Typical structure:
  - Section header (`h1/h2`)
  - Subtitle or metadata
  - Card/list content
  - Right-aligned action footer
- Vertical spacing increases with breakpoints (`pt-*`, `pb-*`, `sm:`, `md:`, `lg:`).

## 4. Typography and Sizing

## 4.1 Observed Text Hierarchy

- Page titles: `text-xl` to `text-3xl`
- Section subtitles: `text-lg`, `text-xl`, `font-bold`
- Main body text: `text-sm` / `text-base`
- Secondary/meta text: `text-xs`, with opacity variants (`text-white/70`, `text-white/55`)

## 4.2 Responsive Typography Pattern

Frequent pattern:

- `text-xs sm:text-sm md:text-base` (buttons, labels, items)
- `text-base sm:text-lg md:text-xl` (intermediate titles)
- `text-2xl sm:text-3xl` (main titles)

## 5. Core Primitives and Structural Components

## 5.1 Button

Base (`components/ui/button.tsx`):

- Standard height: `h-9` (`default`)
- Standard padding: `px-4 py-2`
- Radius: `rounded-[15px]`
- Icon + text spacing: `gap-2`

Commonly used variants:

- `default` (primary)
- `outline` (secondary actions)
- `ghost` (UI triggers)
- `link` (text-style navigation)
- `destructive` (critical action)

## 5.2 Tabs

Tabs rely on Radix plus design overrides:

- Trigger: `rounded-[13px]`, `px-5 py-1`, `text-sm` (with responsive scaling where needed)
- Active tab is color-coded by domain (blue/red/pink/yellow/green)
- Inactive tab uses gray styling

## 5.3 Cards and Panels

- Business cards mainly use `bg-card` or `bg-gray-middle-light`
- Internal padding typically ranges from `p-3` to `p-6`
- Pronounced radius (`rounded-[15px]` or higher)
- Shadow is used selectively to reinforce visual focus (`shadow-lg`, `shadow-xl`)

## 6. Responsive Baseline

## 6.1 Breakpoints Actively Used

Breakpoints observed in most UI areas:

- `sm` (>=640): first comfort step (padding, typography, icons, toasts)
- `md`: layout and density progression for tablet
- `lg`: major repositioning (Character headers, heights, footer spacing)
- `xl`: main grid switches (Welcome/Profile)
- `2xl`: marginal usage

## 6.2 Structural Responsive Behaviors

- Sidebar:
  - Desktop: visible from `md`, fixed width `16rem`
  - Mobile: sheet/overlay mode, width `18rem`
- Header:
  - Compact mobile padding (`px-2`) then `sm:px-4`
- Business pages:
  - Local vertical overflow handling (`overflow-y-auto`)
  - Capped content width (`max-w-*`, for example `max-w-7xl`, `max-w-[1520px]`)
- Character pages:
  - Header stacks on mobile, then reorganizes at `lg` (`lg:flex-row-reverse`)
  - Tabs are horizontally scrollable on mobile, then wrap/show fully on desktop

## 6.3 Responsive Behavior in Dense Components

- Profile:
  - Grid switches to 2 columns at `xl`
  - Buttons and text scale progressively (`sm`, `md`)
- Welcome:
  - Cards are 1-column, then 3-column at `xl`
  - CTA height adapts (`min-h-10` -> `sm:min-h-11`)
- Initiative Tracker:
  - Container padding scales (`px-3 sm:px-5 lg:px-8`)
  - Table width is constrained (`max-w-[1520px]`)

## 6.4 Overflow and Text Containment

Responsive layouts must never allow visible text or controls to escape their parent container.

- Dense rows, tables, cards, toolbars, and dialogs must define explicit min/max constraints for each column or region (`minmax(0, 1fr)`, bounded fixed columns, `max-w-full`, `min-w-0`).
- Long names, labels, translated strings, and dynamic user content must use a deliberate strategy per context:
  - `truncate` for single-line scan fields such as table cells, headers, names, groups, and compact metadata.
  - `break-words` or wrapping badges for detail panels, expanded cards, and places where complete content is more important than row height.
  - Icon-only responsive buttons with accessible names when mobile width cannot support visible labels.
- Horizontal scrolling is a last resort for intentionally wide inspection surfaces only. Primary workflows such as combat rows, forms, and action controls must reflow, truncate, or collapse details instead of creating accidental page-level horizontal scroll.
- Responsive verification must include the smallest supported mobile width and tablet widths with long translated labels and long dynamic content.

## 7. Observed Visual Accessibility Patterns

- Visible focus styling exists on interactive primitives (`focus-visible:ring-*`, `focus-visible:border-*`)
- Contrast is reinforced on active states (battle tab with white text, dark surfaces)
- ARIA attributes are used frequently in complex zones (tabs, menus, action buttons)

## 8. Design Governance Rules (for New Frontend Features)

1. Reuse existing `components/ui/*` primitives first before introducing new visual patterns.
2. Follow the existing custom palette for domain colors; avoid new hardcoded colors without an explicit decision.
3. Follow the dominant spacing scale (`2/3/4/5/6/8/10`) and keep a mobile-first approach.
4. Preserve the established typography hierarchy (`text-xs` to `text-3xl`) with progressive breakpoint scaling.
5. Preserve the rounded corner language (`rounded-[13px]`/`rounded-[15px]`) for interactive controls.
6. For every new page/feature, explicitly define responsive behavior across `sm`, `md`, `lg`, and `xl` when relevant.
7. Prevent horizontal overflow and text escape by design: define column bounds, use `min-w-0`, apply `truncate`/wrapping intentionally, and verify long content at mobile and tablet widths.
8. If a deliberate deviation from this baseline is required, document the exception in this file before generalizing it.

## 9. Frontend Accessibility Baseline (Mandatory for Every Front Ticket)

Accessibility must be considered a default requirement for all frontend work (new feature, update, or refactor impacting UI behavior).

## 9.1 Minimum Accessibility Checklist

Every frontend ticket must include, at minimum:

1. Keyboard operability:
   - All interactive elements are reachable with `Tab`.
   - Activation works with keyboard (`Enter` and/or `Space`) when relevant.
   - No keyboard trap is introduced.
2. Visible focus:
   - Every interactive control has a visible focus style (`focus-visible:*` patterns).
   - Focus remains visible on dark surfaces and high-density UI.
3. Semantic structure:
   - Proper semantic elements are used when possible (`button`, `a`, `main`, headings in logical order).
   - ARIA is added only when native semantics are insufficient.
4. Naming and ARIA:
   - Interactive controls have an accessible name (visible label or `aria-label`).
   - State attributes are present when needed (`aria-expanded`, `aria-selected`, `aria-current`, `aria-busy`, etc.).
5. Contrast and readability:
   - Text and interactive states remain readable against background colors.
   - Color is not the only channel to convey critical meaning.
6. Forms and validation:
   - Inputs are associated with labels.
   - Errors are perceivable and linked (`aria-invalid`, `aria-describedby`).
7. Dynamic UI feedback:
   - Loading and async states are communicated (`aria-busy`, status regions, or equivalent patterns).
   - Important status changes are announced accessibly where needed.

## 9.2 Expected Ticket-Level Verification

For each frontend ticket, implementation should include explicit accessibility verification before completion:

- Keyboard pass on impacted screens/components.
- Focus visibility check in all modified interactive controls.
- Screen-reader naming/state sanity check for newly added interactions.
- Quick contrast sanity check for changed color combinations.

## 9.3 Reuse First

To reduce regressions, prefer existing project primitives that already embed accessibility behavior:

- `components/ui/button.tsx`
- `components/ui/tabs.tsx`
- `components/ui/sidebar.tsx`
- `components/ui/dialog.tsx`
- `components/ui/select.tsx`
- `components/ui/input.tsx`

If custom behavior is required, match the same accessibility level as these primitives.

## 10. Frontend Definition of Done (DoD) - Quick Template

Use this checklist as a completion gate for every frontend ticket.

- [ ] **Design baseline respected**: spacing, colors, typography, and responsive behavior align with this document.
- [ ] **Keyboard navigation validated**: all impacted controls are reachable and operable via keyboard.
- [ ] **Focus visibility validated**: visible focus exists on all impacted interactive elements.
- [ ] **Semantics and ARIA validated**: accessible names/states are present and coherent.
- [ ] **Form/error a11y validated** (if forms are touched): labels, error linking, and invalid states are correctly exposed.
- [ ] **Contrast sanity check done**: updated UI remains readable in its target contexts.
- [ ] **Responsive sanity check done**: behavior verified at relevant breakpoints (`sm`, `md`, `lg`, `xl` when applicable).

Recommended final note format in ticket completion:

`Frontend DoD passed: design baseline, accessibility checks, and responsive validation completed.`
