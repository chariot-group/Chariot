# Changelog

## [2.6.1] - 06-06-2026

### Added
- Added free checkout flow for orders at 0 € or below the Stripe minimum charge amount (button "Obtenir gratuitement", no card payment required)
- Added "Cadeau" line in checkout recap when a positive remainder below the Stripe minimum is waived

### Fixed
- Fixed promo codes at 99–100 % being displayed in checkout but charging the full price
- Fixed Stripe Elements context error when applying a 100 % promo code (`CheckoutFreeForm` / `CheckoutPaidForm` split)
- Fixed footer buttons visibility
- Fixed somes sessions bugs

## [1.0.1] - 06-06-2026

### Added
- Added `stripe-charge.utils` to resolve Stripe-chargeable amounts and gift waivers below currency minimum (EUR: 50 centimes)
- Added `POST /stripe/free-order` endpoint to fulfill zero-amount orders without Stripe card payment
- Added FR-013-C functional rule for below-minimum and free checkout orders

### Fixed
- Fixed promo codes at 99–100 % failing to update PaymentIntent amount (Stripe rejects amounts below minimum); order is now routed to the free-order flow instead
- PaymentIntent is cancelled when an order becomes non-chargeable to prevent accidental full-price payment

### Changed
- `createPaymentIntent` and `updatePaymentIntent` now return `isFreeOrder` and use chargeable amount instead of raw discounted amount
- Checkout session metadata includes gift amount in total discount

## [2.6.0] - 06-06-2026

### Added
- Added colored status icons with tooltips in the initiative tracker
- Added visual differentiation for group membership in the initiative tracker (color or equivalent)
- Added automatic initiative sorting in the initiative tracker
- Added minimum HP constraint in the initiative tracker (HP cannot go below 0)
- Added automatic skip for dead combatants in the initiative tracker
- Added dynamic "View Combat" / "Return to Sheet" button for players during active combat (label and destination switch based on current page)
- Added searchable effect/condition picker when adding a status effect, with optional description display and optional duration (seconds, minutes, hours, rounds, or until end of combat; 1 round = 6 seconds)
- Added effect duration display in parentheses
- Added info icon or tooltip to explain what each effect does
- Added GM choice of visible fields when showing an NPC to players (name, AC, HP, etc.)
- Added bulk initiative entry: GM can select multiple characters and enter a single initiative value for all selected
- Added support for negative initiative values
- Added senses to the player mastery category
- Added senses editing in player and NPC forms
- Added Codex integration for senses (monster preview and autofill on monster selection)
- Added character class in parentheses in the sidebar
- Added decimal support for speed values and all relevant numeric fields
- Added in-session inline editing for coins, HP, and notes without entering full edit mode
- Added automatic temporary HP handling in the out-of-form HP quick calculator
- Added sheet access while in session settings
- Added infinite quantity indicator for cantrips
- Added "Cast" button on cantrips (no-op, for UI consistency)
- Added remaining spell slots display in the cast section
- Added recharge legend at the top of the abilities and traits section when at least one ability recharges on short or long rest
- Added sort icon on the actions section to clarify sorting behavior
- Added action counts in parentheses on filter buttons: Action (n), Reaction (n), Bonus Action (n)
- Added "Add inspiration point" control in edit mode and "Use inspiration point" button in show mode
- Added icon for archived groups

### Changed
- Removed "View sheet" row in the initiative tracker; the sheet is accessible by clicking the character
- Made AC field read-only in the initiative tracker
- Reused the HP quick calculator tool in the initiative tracker
- Changed initiative icon to a more representative one
- Renamed NPC "Languages" category to "Masteries" and moved languages and senses there (aligned with player layout)
- Improved burger menu UX
- Refactored rest UX/UI
- Changed session participant display to use usernames only (not first name + last name)
- Moved player-to-character mapping from tooltip to parentheses in the GM player group
- Refactored spells UX/UI:
	- Improved visual feedback on spell cast
	- Changed "tour de magie" translation to "sorts mineurs" (cantrips)
	- Changed spell slot display to count used slots (e.g. 8/8 when 8 slots have been spent, not when 8 remain)
	- Changed selected spells styling from border to ring
- Refactored abilities and traits UX/UI:
	- Removed individual recharge tooltips when section legend is shown
	- Long ability names are no longer cropped when expanded
- Refactored actions UX/UI:
	- "Actions" is now the default sort
	- Removed tooltips when no actions, reactions, or bonus actions exist
- Changed all form icons to white to match the new background color
- Blocked death saving throws outside active sessions
- Aligned "Cast spell" button and prepared/unprepared badge on the same line
- Blocked inspiration point edits outside active sessions
- Refactored characteristics, saving throws, and skills cards to integrate into the title card like other page elements
- Made button hovers consistent:
	- Removed pink hover on black secondary buttons
	- Removed purple hover on the yellow "Return to session" button
- When a session is launched, the "Launch session" button is replaced by "Close session"
- Improved session display layout when 4 or more players are connected
- Changed "Close session" button color to red to signal a non-trivial action
- Set Codex search language default to the page language (spells and monsters)
- When searching spells/monsters with the "all languages" filter, multilingual entries now appear as separate results (one per language) instead of a single result with an inline language switcher
- Moved language selector from search results to the spell/monster preview panel
- Changed number input spinner arrows appearance

### Fixed
- Fixed session closure flow: players are now kicked out of the session when the GM closes it, with the same fluidity as session launch (they could previously still use rest actions)
- Fixed responsive layout for the HP entry menu (current, temporary, and max HP)
- Fixed visual crop of damage types and action types in forms on laptop viewport only
- Fixed responsive layout for all three action types on NPCs
- Fixed prepared spells not appearing in the magic tab for preparation-based spellcasters before saving
- Fixed prepared spell description card text color (white instead of gray)
- Fixed combat tab display breaking when adding full abilities/traits or full actions
- Fixed Codex language-based search

## [2.5.1] - 09-05-2026

### Added

### Changed

### Fixed
- Fixed prisma generate

## [2.5.0] - 08-05-2026

### Added
- Added a release ticket template
- Added a `Refacto` label
- Added a dedicated "My Players" section above groups for GMs during sessions
- Added icons to visually differentiate "My Groups" and "My Players" sections
- Added access to player sheets for GMs with permission available only during sessions
- Added real-time participant disconnect toasts visible to all session participants
- Added "Load more" button in active groups
- Added "Load more" button in archived groups
- Added "Load more" button in group characters
- Added "Load more" button in "My Characters"
- Added "Load more" button in campaigns

### Changed
- Replaced Renovate with Dependabot
- Changed CI/CD end message behavior to send notifications only when a pipeline problem occurs
- Made ticket context optional

### Fixed
- Fixed visual lag issues


## [2.4.0] - 01-05-2026

### Added
- Added a back button on the profile page
- Added a disabled state for "Join a Session" when no character exists in "My Characters", with a tooltip explaining why
- Added spell preparation support for preparation-based spellcasters
- Added prepared spell highlighting (green) and blocked casting of unprepared spells for classes that must prepare spells
- Added spell casting flow with default casting at the spell's base level and slot consumption tracking per spell level
- Added upcast support from the cast action (dropdown option), including level selection among available higher spell slots
- Added upcast constraints:
	- No upcast for cantrips (level 0 spells)
	- No upcast for level 9 spells
	- No upcast when the character has no access to higher spell levels
- Added long rest mechanics:
	- Reset all spent spell slots to 0 used
	- Reset limited-use counters (for spell and non-spell abilities)
	- Restore current HP to max HP
	- Reset temporary HP to 0
	- Reduce exhaustion by 1 when exhaustion is above 0
	- Added "Long Rest" and "Sleep and Change Prepared Spells" options for eligible spellcasters
- Added short rest mechanics:
	- Players can spend hit dice
	- Warlocks recover all spell slots
	- Abilities and traits marked as short-rest reset are restored
- Added support for limited-use counters on abilities and traits (for example Barbarian Rage, Fighter Second Wind)
- Added reset policy options on abilities and traits:
	- Reset on short rest
	- Reset on long rest
- Added a tooltip on the session timer explaining token validity (8 hours, as long as the session is not left for too long)
- Added a way to voluntarily leave a session
- Added a way to see who is currently in the session
- Added explicit session lifecycle handling to prevent being forced back into a previously active session when trying to start a new one

### Changed
- Reordered Home cards: "Join a Session" and "Create a Character"
- Updated spell deletion button placement in the add-spells UI for better usability
- Added explicit unit guidance for character size input
- Removed bold styling on selected and hovered values in mastery combobox inputs
- Updated form background gray to the new shared Tailwind color token and applied it across forms using the old gray
- Prevented exhaustion level edits outside active sessions
- Updated Chariot logo redirection behavior in GM space to keep navigation consistent with the GM context
- Improved responsive behavior for mastery combobox suggestion lists with auto-scroll into view
- Reviewed and aligned additional edge cases related to session and rest flows

### Fixed
- Fixed duplicate workspace toast notifications triggered when opening the sidebar on mobile
- Fixed profile page cropping and non-scrollable behavior on all non-large desktop viewports
- Fixed mastery combobox option click selection while preserving keyboard navigation behavior
- Fixed XP vs level warning not clearing after entering the expected value
- Fixed passive perception warning not clearing after entering the expected value
- Fixed half-proficiency and expertise labels appearing clickable without toggling their checkbox; label click now toggles the checkbox
- Fixed missing hover state on the inspiration checkbox
- Fixed mastery combobox suggestion panel opening outside the visible page area

## [2.3.5] - 26-04-2026

### Added

### Changed

### Fixed

- Fix CI to use the correct environment variables for the session service


## [2.3.4] - 26-04-2026

### Added

### Changed

### Fixed

- Fix prisma migration in session service

## [2.3.3] - 26-04-2026

### Added

### Changed

### Fixed

- Fix a deploy bug about the prisma generate in the session service that caused the service to crash when start

## [2.3.2] - 26-04-2026

### Added

### Changed

### Fixed

- Fix a bug in the session service that caused the service to crash when deployed in production mode due to a bad path for the build output file


## [2.3.1] - 26-04-2026

### Added

### Changed

### Fixed

- Fix a deploy bug about the prisma client in the session service that caused the service to crash when deployed in production mode

## [2.3.0] - 26-04-2026

### Added
- Addition of an automated deployment tool (Watch Tower)
- Add a tooltip to the spellcaster class
- Hover effects and modify the pointers
- Add the app version to the footer
- Adding a development tool (Linter)
- Session service
- Be able to access all translations via Codex

### Changed
- Make sure the exhaustion level titles are no longer bold
- Make the checkmarks in the app's dropdown menus white
- Place the icons for speed, size, initiative, AC, etc., to the left of the value
- Change the appearance of the button that expands/collapses the list of abilities and traits if that list is empty; also change the tooltip so that the button does not appear clickable (disabled)
- Ensure that when a custom spell is added, the effect type defaults to "utility" to match the first value in the list
- Resize the sidebar collapse button to fit the full width of the page
- 

### Fixed

## [2.2.2] - 10-04-2026

### Added

### Changed

### Fixed
- Submit form for codex innate spellcaster

## [2.2.1] - 10-04-2026

### Added

### Changed

### Fixed
- Fix integ banner


## [2.2.0] - 10-04-2026

### Added
- Added visual environment indicators for integration on Web (for example, red logo variant)
- Added visual environment indicators for integration on SSO (same concept as Web)
- Added visual environment indicators for integration on Keycloak
- Added a visual indicator to clearly show which workspace/space the user currently belongs to
- Added a confirmation modal when switching workspace/space
- Added reusable HP quick calculator controls for character forms(max HP, current HP, temporary HP):
	- `+` to add HP to current value
	- `-` to subtract HP from current value
	- `=` to set an exact value
- Added Challenge Rating input assistance for sub-1 values with fraction presets: `1/2`, `1/4`, `1/8`
- Added keyboard shortcuts for NPC and character forms:
	- `Enter` to submit
	- `Escape` to cancel
- Added keyboard shortcuts for delete dialogs:
	- `Enter` to confirm
	- `Escape` to cancel
- Added multiline support in textarea so `Shift+Enter` and `Ctrl+Enter` create a new line
- Added placeholders across all input fields
- Added PR checklist items for both reviewer and developer:
	- "I tested project responsiveness from my browser"
	- "I tested project responsiveness from my phone"
- Added pre-production integration checks with a target list of desktop and mobile browsers to validate releases
- Added a follow-up track to evaluate automation options for cross-browser/cross-device integration validation
- Added support for marking actions as "bonus action"
- Added support for displaying and sorting `action` vs `bonus action` in action tables
- Added support for multiple damage/healing entries per action (for example `1d6 piercing` + `1d4 poison`) as typed lists

### Changed
- Changed creation flow when no character exists in "My Characters" to allow creating a new character directly without forcing navigation through Home
- Changed ability trait creation UX to auto-expand the newly added trait and auto-scroll into view when needed
- Changed character page header layout to reduce top-area footprint and refocus attention on tab content (image placement/visibility/size adjusted)
- Changed mobile character footer layout for better usability of Edit/Save/Cancel actions
- Changed challenge rating display to use fractions instead of decimal values for sub-1 CR entries
- Changed issue template wording from "je souhaite" to "Je souhaite"
- Changed welcome page assets to use royalty-free images only
- Changed and unified LP/Chariot favicons for better browser rendering and search appearance
- Changed attack and healing bonus fields to support dynamic binding to character sheet values (similar to ability counter dynamics)
- Changed spell action usage to consume dynamic save DC and attack bonus values

### Fixed
- Fixed numeric input behavior for non-null number fields that incorrectly auto-prefill `0` and block user typing scenarios
- Fixed redirection bug after saving from non-General tabs (user should remain on current tab); validated across all player and NPC tabs
- Fixed NPC skill display issue where the correct value appeared only as form placeholder but not in rendered view
- Fixed character list filtering so characters from other workspaces/spaces are never displayed
- Fixed NPC and character validation flow for `Enter` and cancellation flow for `Escape`
- Fixed random behavior where clicking multi-collapse controls in read-only mode showed toast notifications instead of expanding content
- Fixed unique combobox fields in player/NPC update forms that opened suggestions by default without user interaction
- Fixed missing display of resistances and vulnerabilities in player and monster character sheets
- Fixed dependency-related security vulnerabilities
- Fixed NPC spellcasting model assumptions: NPCs do not require player-style spellcasting class
- Fixed monster spell slot handling for creatures using per-day spell usage (for example Green Slaad: `2/day Fear`, `1/day Fireball`) instead of player-like slot-per-level model
- Fixed Codex spellcaster monster hydration to fetch full spell list details when only spell IDs are returned by `findAll` by resolving details via `findOne`
- Improved CI performance and reliability


## [2.1.1] - 18-03-2026

### Added

### Changed

### Fixed
- Fixed visibility issues with the Edit button at the bottom of the page on mobile browsers
- Fixed display issues for certain fields in NPC view/form edit mode when the screen is split into two sections
- Fixed a bug when creating NPCs via Codex
- Fixed a bug in NPC display within the Codex creation list
- Fixed missing class field in the player character form
- Fixed sidebar name not updating after saving a player or non-player character
- Fixed input handling in combobox fields that prevented entering custom values

## [2.1.0] - 06-03-2026

### Added
- Added route to manage Stripe purchases
- Ability to create an entity from Codex
- Form for adding and modifying entities

### Changed
- Adjustment of the overall UX for better user understanding
- Optimization of development tools

### Fixed

## [2.0.0] - 07-02-2026

### Added
- Setup Next.js 15 frontend service with Tailwind CSS v4, shadcn/ui and Keycloak SSO integration
- Add Swagger API documentation with OpenAPI specification
- Add internationalization (i18n) with SSO user preference synchronization (FR, EN, ES)
- Add global error and loading pages with internationalization support
- Add contextual sidebar navigation with Redux state management
- Add welcome page with guided onboarding for new users
- Add reusable character/NPC page layout with panel system
- Add user profile page with Keycloak integration and token history
- Add character history and background display section (Player and NPC)
- Add treasure and currency display section (Player and NPC)
- Add general information display section (Player and NPC)
- Add combat information display section (Player and NPC)
- Add spellcasting and magic display section (Player and NPC)

### Changed
- Standardize Winston logger usage throughout the application
- Restructure microservices architecture: extract monitoring to separate repository and reorganize services (adventure, frontend, sso)
- Align API response format with Codex-API standard (RFC 9457 for errors)
- Add centralized API Gateway for routing, authentication, rate limiting and monitoring
- Simplify Campaign and Group schemas: remove description fields, merge main/npc into active groups
- Harmonize NPC and Player schemas: add conditions, background, treasure and inventory support
- Improve UX/UI: collapsible elements management, visual hierarchy, and mobile optimization

### Fixed

## [1.0.0] - 08-12-2025

### Added


### Changed
- Update to Tailwind V4 (#552)
- Update JWT library (#500)
- Update Stripe (#428)

### Fixed
- Docker vulnerabilities (#542)