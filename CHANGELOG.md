# Changelog

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