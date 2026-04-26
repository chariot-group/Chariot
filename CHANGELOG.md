# Changelog

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