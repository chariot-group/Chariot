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

The project relies on a dark theme with a plain background color (no background image):

- Global background: `--background: #0c0c0f`
- Main text: `--foreground: #b7b7bb`
- Card/popover surface: `--card` / `--popover: #17171a`
- Primary color: `--primary: #4e00de`
- Primary light: `--primary-light: #a98bff` (same violet, lightened; `text-primary-light`)
- Secondary/accent color: `--secondary` / `--accent: #aa00ff`

Violet usage rule:

- `primary` (`#4e00de`) is for **fills** only: button backgrounds, badges, selection highlight.
- Violet **text and icons** (links, loaders, accent icons, "your turn" labels, selected-row bar) MUST use `primary-light`: `#4e00de` is unreadable on dark surfaces, while `#a98bff` reaches >= 5:1 on every surface level (background up to hover).

## 2.1.1 Neutral Scale (Grays)

All neutral colors share one hue/chroma (oklch, hue 285, chroma ~0.006: a subtle cool tint matching the violet primary). Pure grays and differently tinted grays must not be mixed.

Surface ladder (dark to light, small regular steps):

| Level | Token | Value | Usage |
| --- | --- | --- | --- |
| 0 | `--background` | `#0c0c0f` | App background, dialogs, sheets |
| 1 | `--card` / `--popover` | `#17171a` | Cards, menus (dropdown, select, popover, combobox), toasts, inactive character tabs. `--popover` aliases `--card`. |
| 2 | `--gray-middle-light` | `#1f1f22` | Raised element inside a card (inputs, selects, rows) |
| 3 | `--gray` | `#27272b` | Hover / selected / highlighted |

Borders (two levels):

- Structural borders (layout sidebar, dialogs, sheets, menus and dropdowns): `--frame: #e5e5e5`, used through the `border-frame` utility.
  This includes region dividers that split a page or a modal into zones: page footer action bars (character sheet, combat banner), modal header/footer/side-panel dividers, list/detail split of the magic tab.
- Minor separators and default `border`: `--border: #353538`, used through `border-border` (no opacity variants). Applies to dividers between items inside a panel (form sections, tracker sub-bars, summaries). Form controls / outline buttons: `--input: #353538`. Sidebar separators: `--sidebar-border`.

Lines and text:

- Focus ring: `--ring`, `--sidebar-ring`: `#a4a4a8`
- Secondary text: `--muted-foreground: #98989c` (>= 4.5:1 on every surface level)
- Surface tokens (`gray`, `gray-middle-light`) are fills only: never use them as text color (`text-gray-middle-light` is invisible on cards); gray text uses `text-muted-foreground`
- Light gray text: `--gray-light: #d7d7db`

Scrollbars: `--scrollbar-track`, `--scrollbar-thumb`, `--scrollbar-thumb-hover`, used through `[&::-webkit-scrollbar-track]:bg-scrollbar-track`, `[&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb` and `[&::-webkit-scrollbar-thumb]:hover:bg-scrollbar-thumb-hover`.

Tailwind `gray-50` ... `gray-950` utilities are redefined in `globals.css` on the same tinted scale.

Rule: never hardcode a neutral color in a component; use these tokens so a palette change is a one-file edit in `globals.css`.

## 2.2 Recurring Custom Palette

Palette defined and reused through custom utilities:

- `--blue: #61ebff`
- `--green: #9ae201`
- `--red: #ff2d2d`
- `--pink: #ffadff`
- `--yellow: #ffc400`
- `--white: #f7f7f7`
- `--gray: #27272b`
- `--gray-middle-light: #1f1f22`
- `--gray-light: #d7d7db`
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
- Buttons, owned by `buttonVariants` (FR-frontend-button-system): `rounded-[13px]` for `default` / `sm` (Player / GM selector included), `rounded-[15px]` for `lg`
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
  - Exception: navigation lists and bars hide their scrollbar with the `scrollbar-none` utility (`globals.css`); wheel, touch and keyboard scrolling still work. Applies to the layout sidebar, the character sheet tab bar and the community library result list.
- Grids:
  - Welcome/Profile: `grid-cols-1`, then `xl:grid-cols-2` or `xl:grid-cols-3`
  - Character General tab: bento grid 2 / 4 / 12 columns (section 5.3.1)

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

All buttons go through `components/ui/button.tsx` (`Button`, or `buttonVariants` for links and custom triggers such as the Player / GM selector). Rule: FR-frontend-button-system. Consumers set layout (`w-full`, `flex-1`, `min-w-0`, padding tweaks) but never the fill, text color, hover, height or radius.

Main types:

| Type | Props | Rest | Hover | Usage |
| --- | --- | --- | --- | --- |
| Primary white | `variant="primary"` | `bg-white` + `border-frame`, `text-black` | `bg-gray-300` (slightly darker) | Main action of a screen, sheet footer « Modifier le personnage » / « Sauvegarder », sidebar create buttons, active segmented option |
| Primary colored | `variant="accent"` + `tone` | domain color, `text-black` | `bg-{tone}-hover` (lighter) | Color-coded context: sheet creation submit (tab tone), sidebar session action, combat turn controls |
| Primary violet | default (`accent` + `tone="violet"`) | `bg-primary`, `text-primary-foreground` | `bg-primary-hover` (lighter) | Dialog validations, welcome / shop calls to action. Only colored tone with light text |
| Secondary | `variant="secondary"` | `bg-gray-middle-light` + `border-input`, `text-white` | `bg-gray` (lighter) | Alternative actions: cancel, export, back, inactive segmented option |

Hover tokens (`--{tone}-hover`, `--primary-hover`) live in `globals.css` (`color-mix` with white), so a palette change stays a one-file edit. Every hover has a `disabled:hover:` reset.

Utility types (minority): `ghost` (transparent, `hover:bg-white/10`), `link`, `destructive`, icon-only sizes.

Sizes:

- `lg`: `h-12`, `rounded-[15px]`, `text-lg`, icons `size-6` (sidebar session action)
- `default`: `h-9`, `rounded-[13px]`, `text-sm` (create character, dialog and sheet footers)
- `sm`: `h-8`, `rounded-[13px]` (dense toolbars and rows)
- `icon` / `icon-sm` / `icon-lg`: `size-9` / `size-8` / `size-12` (radius of the matching text size)

Content and alignment:

- Centered by default; `align="start"` left-aligns (sidebar create buttons)
- Optional icon on the **left** of the label only (`gap-2`, `gap-3` in `lg`); the only trailing glyphs allowed are a menu disclosure chevron and the forward arrow of a "next" action
- Focus: `focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background` on every type

Toggles (`aria-pressed`), never a violet fill:

- Segmented selector (one option among a few: Player / GM, attack ability suggestion, codex preview language): active = `primary`, inactive = `secondary`
- On/off filter toggle (Action / Bonus action / Reaction priority, prepared spells edit mode, tracker selection modes): `secondary` + `toggleButtonPressedClassName` when pressed (`border-frame bg-white/15 font-semibold text-white`)

## 5.2 Tabs

Tabs rely on Radix plus design overrides:

- Trigger: `rounded-[13px]`, `px-5 py-1`, `text-sm` (with responsive scaling where needed)
- Active tab is color-coded by domain (blue/red/pink/yellow/green)
- Inactive tab uses gray styling

## 5.2.1 Character Sheet Tabs (Button Group)

The character sheet tab bar (General, Battle, Magic, Inventory, History) is one joined button group, not separate pills:

- Frame: `rounded-[13px] border border-frame bg-card overflow-hidden` (light structural border, like the layout), no gap between triggers
- Triggers: square inner corners, `border-l border-frame` dividers (none on the first), `py-1.5`
- Active trigger: domain color fill (section 2.3) with dark text `text-black` on every tab, Battle included (black on red: 5.7:1), except Companions (violet `purple` fill: white text); inactive: transparent, white text, `hover:bg-white/10`
- Focus: keyboard only (`focus-visible`), drawn inside the trigger (`ring-2 ring-inset ring-ring`); no outline on mouse click
- Error state (FR-form-field-validation): inset `ring-red/80` plus the alert icon (never color alone)
- Mobile: the group scrolls horizontally inside a `scrollbar-none` wrapper; the rounded frame (`w-max`) scrolls with the tabs, so the rounded ends stay on the first (General) and last (History) tabs. Never put `overflow-x-auto` on the frame itself. Because the scrollbar is hidden, `useHorizontalWheelScroll` maps the vertical mouse wheel to horizontal scrolling; touch, trackpad and keyboard focus scroll natively.

## 5.3 Cards and Panels

- Business cards mainly use `bg-card` or `bg-gray-middle-light`
- Internal padding typically ranges from `p-3` to `p-6`
- Pronounced radius (`rounded-[15px]` or higher)
- Shadow is used selectively to reinforce visual focus (`shadow-lg`, `shadow-xl`)
- A section card holds its heading **and** its content (e.g. saving throws, skills), for PCs and NPCs alike; rows inside a card are plain rows (`rounded-[10px]`, `hover:bg-gray-middle-light/50`), never nested cards
- Free text (history, descriptions) wraps between words: `whitespace-pre-wrap wrap-break-word`; `break-all` is forbidden on text containers

## 5.3.1 Character General Tab Bento Grid

The General tab (PC and NPC, read and edit) is one bento grid (FR-character-general-bento-layout), defined in `tabContents/general/shared/generalBentoLayout.ts`:

- Grid: `grid-cols-2` → `sm:grid-cols-4` → `xl:grid-cols-12`, one gap `gap-3 md:gap-4` on both axes
- Every card is a direct grid child with a slot class (`col-span-*` / `row-span-*`); no flex columns, no duplicated mobile/desktop markup, no `order-*` or dense packing
- Grid children never use `h-fit`: they stretch to their track so a row has no visual hole
- A stretched card must not show a blank bottom: every card spreads its content over its height. Value grids (ability scores, saving throws) use `flex-1 content-evenly`; lists and label/value stacks (character, statistics, skills, proficiencies) use `flex-1 justify-between` / `flex-1 content-between`; tiles push their value / session note to the bottom (`justify-between`, `mt-auto`). Placement keeps bands balanced so the added spacing stays small
- No inner scroll on General cards, except the abilities list (read and edit) (`AbilitiesSection boundedList`: `max-h-[28rem] overflow-y-auto`, focusable `role="group"` labelled by the card heading, project scrollbar tokens)
- Read mode short values use `GeneralTile` (label on top, value pushed to the bottom); sections use `GeneralSectionCard` (region + own heading)
- `GeneralSectionCard` is a size container (`@container`): long inner lists (skills) use container variants (`@sm:grid-cols-2 @xl:grid-cols-3`) so they follow the card width, not the viewport
- Skills keep the same column steps in read and edit modes (`@sm:grid-cols-2 @xl:grid-cols-3`)
- The sheet avatar block (`MediaAvatarUpload size="sheet"`) is as wide as the avatar (`w-min`): its requirements hint wraps under the avatar instead of widening the « Personnage » card
- « Personnage » edit card: the name fields (`CharacterNameFields`, shared PC/NPC) sit next to the avatar under the heading, like the read-mode identity list; they stack in a narrow column and go side by side from `@sm`
- A new card MUST get a slot in every layout of `generalBentoLayout.ts` and keep the placement test (no empty cell at 2 / 4 / 12 columns) green

## 5.3.2 Character Combat Tab Bento Grid

The Combat tab reuses the General tab grid and card primitives (FR-character-battle-bento-layout), with its slots in `tabContents/battle/shared/battleBentoLayout.ts`:

- Fixed-size cards (statistics, saving throws, death saves, affinities) share the first band; unbounded lists (each action section, abilities and traits) get their own full-width band
- Action items wrap (`flex-wrap`, `grow basis-72`; edit `basis-[28rem]`): as many per row as the card width allows, and the items of the last row grow to complete it (no hole). Items are top-aligned so an expanded item grows alone
- Empty affinities show an explicit "none" line (`characterDetail.battle.noAffinities`)
- Read and edit modes: each action section's item list uses `BENTO_BOUNDED_LIST_CLASS` (shared with the abilities list): max height + inner scroll, header controls outside the scroll area, focusable `role="group"` labelled by the section heading
- List cards are paired side by side from `xl` (6 + 6); affinity values start on the label line

## 5.3.3 List Card (Actions, Abilities and Traits)

Every character list uses `tabContents/shared/listCard/ListCard` + `ListRow` (FR-character-list-card), in read and edit modes:

- One card: header (accent title, muted item count, Add in edit, expand/collapse all; optional toolbar line such as the usage-type filter or rest legend) then plain rows (`border-b`, `rounded-[10px]` hover) — never a card per item or per field
- Collapsed row: name + one muted summary line joined with `·` (action: usage · attack/DC · damage · range; ability: rest icons · remaining uses)
- Header count: small rounded badge (`bg-gray-middle-light`, `text-xs`) vertically centered on the title
- Expanded row: the open row is tinted (`bg-gray-middle-light/30`); read → description + inline definition list; edit → `ListFormSection` groups (uppercase muted `h3` + divider): actions General / Attack / Damage / Description, abilities General / Uses; damage entries one line each with labels on the first entry only
- Rows are bounded in read and edit modes (`BENTO_BOUNDED_LIST_CLASS`; edit adds `max-h-[min(40rem,70dvh)]`), header outside the scroll area; form dropdowns are portalled; invalid rows get `ring-2 ring-destructive`

## 5.3.4 Statistics Card

`tabContents/shared/StatsSummary` (FR-character-statistics-card), used by the PC and NPC statistics cards:

- Armor class, initiative and size: one `grid-cols-3` row of equal cells (`bg-gray-middle-light/50`, `rounded-[10px]`), small uppercase muted label + bold value with a Lucide icon (`currentColor`, readable on dark surfaces)
- Speeds: a single wrapping text line `Vitesses : icon value · icon value`, only non-zero speeds, secondary unit in muted small text
- No white pills, no "?" tooltip buttons: the visible label carries the meaning, accessible names keep the full wording

## 5.3.5 Character Inventory Tab Bento Grid

The Inventory tab reuses the General tab grid and `GeneralSectionCard` (FR-character-inventory-bento-layout), with its slots in `tabContents/inventory/shared/inventoryBentoLayout.ts`:

- Coins: full-width strip; read mode shows five equal cells on one row (`grid-cols-5`, `bg-gray-middle-light/50`, `rounded-[10px]`): icon + short uppercase muted label, then the bold value (abbreviated ≥ 1 000, full value in the accessible name and an `InfoTooltip` outside session). In session, cells are buttons (`hover:bg-gray`) opening the coin dialog
- Coins edit: one labelled input per line in a narrow card, one row of five from `@2xl` (card width)
- Equipment and Treasure: paired half width from `sm` (6 + 6 at `xl`); read text uses `BENTO_BOUNDED_LIST_CLASS`, empty state is a muted line; edit textareas fill the card (label `sr-only`, the heading names the field)
- In-session edit button sits at the end of the heading line (`GeneralSectionCard headerAction`)

## 5.3.6 Character History Tab Bento Grid

The History tab reuses the General tab grid and `GeneralSectionCard` (FR-character-history-bento-layout), with its slots in `tabContents/history/shared/historyBentoLayout.ts`:

- Bands at `xl`: Appearance (5) · Description (7); Personality traits, Ideals, Bonds, Flaws (3 each); Allies and organizations (4) · Backstory (8). From `sm` the first two bands go two by two, the last one full width
- Appearance: tinted label/value cells (`bg-gray-middle-light/50`, `rounded-[10px]`), 2 columns, 3 from `@sm`; the card stretches like any bento card and spreads its cells (`flex-1 content-evenly`); empty values show a muted `—`; the size category shows its full name next to the height (no raw tooltip)
- Text cards: `BENTO_BOUNDED_LIST_CLASS` in read mode, muted `notSpecified` line when empty; edit textareas fill the card with an `sr-only` label
- No positive `tabIndex`: tab order follows the DOM

## 5.3.7 Character Magic Tab

The Magic tab (FR-character-magic-list-card) uses the bento grid with full-width slots in `tabContents/magic/shared/spellList.ts`:

- Block selector (`SpellcastingSelector`, segmented toggle, primary white / secondary): its own grid row above the Spellcasting card, only with several blocks (edit: also when a class can be added, « Add » at the end)
- Spellcasting: compact band — key stat cells (`KeyStat`: ability, attack, DC, prepared) on one line when the width allows; edit: class, ability, DC, attack on one row (`@3xl:grid-cols-4`) with their sync hints. No slot list here
- Spells: one `ListCard` (bounded). Each level (or uses-per-day) group starts with `SpellGroupHeader`: tinted bar (`bg-gray-middle-light`), sticky at the top of the scroll area, level name in the accent color, slots on the right — read `SpellSlotsBadge` (pips + `remaining/total`, cantrips `∞`), edit the slot `total` input
- Collapsed row: name + `school · casting time · range · effect`; trailing concentration tag, prepared pill (`SpellPreparedPill`), delete (edit)
- Expanded row: read → `SpellDetails` (description + inline definition list + in-session cast controls); edit → `SpellEditForm` (`ListFormSection`: General / Casting / Effects / Description)
- Edit keeps the list order inside a group (no re-sorting while typing); group headers and rows are siblings of one `Accordion`, so a level change moves the row without remounting it
- Add a spell (`primary`, `sm`) and Codex (`secondary`, `sm`) are both visible in the card header

## 5.4 Menus (Dropdown, Context Menu, Select, Combobox)

Every floating menu shares one style, defined once in `components/ui/menu-styles.ts` and applied by the primitives (`dropdown-menu`, `context-menu`, `select`, `searchable-select`, `multi-select`, `combobox-input`, `tag-input`). The GM space menu of the sidebar is the visual reference.

- Surface: `bg-popover border-frame rounded-[14px] p-1.5`
- Row: `rounded-[10px] px-3 py-2 text-sm text-white`, hover and keyboard highlight `bg-white/10`
- Selected/checked row: `bg-white/15 font-medium`, check icon in white
- Leading icons: `size-4`, `text-white/60`; destructive rows: `text-destructive`, hover `bg-destructive/10`
- Separator: `mx-1 my-1 h-px bg-white/10`

Consumers must not restyle menu rows or surfaces locally (sizing such as `w-*`, `max-h-*`, `z-*` is fine).

Sidebar context menus and touch overflow menus show an icon per action (FR-sidebar-context-actions). Default icons are mapped by action id in `components/layout/Sidebar/shared/sidebarActionIcons.ts`.

## 5.5 Sidebar Rows

- Selected character row: `bg-white/15` (same gray as selected menu rows), white bold text, no left bar and no label shift; hover `bg-white/10`
- Group header: no resting background (hover `bg-white/10`), label always bold. The label lines up with its characters: header `pl-1` + `size-4` chevron + `gap-2` = characters `ml-4` + `px-3` (28px)
- Create buttons (character, group): `buttonVariants({ variant: "primary", align: "start" })`, full width, icon on the **left** of the label

## 5.6 Numeric Inputs

All numeric fields use `components/ui/number-input.tsx` (`Input type="number"` delegates to it):

- `startAdornment` (icon) and `endAdornment` (unit) render inside the field
- The frame (`inputFrameClassName`) owns background, radius, focus and invalid state, so the focus frame wraps the whole field (icon + input + unit + stepper), not only the native input
- `className` styles the frame (width, height, radius, background); typography is inherited by the input
- Custom stepper without border or divider, flush against the right edge, out of the tab order (keyboard uses arrow keys)
- `StoredUnitNumberInput` and `StoredUnitFeetRangeInput` build on the same frame

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
