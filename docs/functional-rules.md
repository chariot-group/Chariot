# Functional Rules - Chariot Project

This document centralizes all functional rules for the Chariot project.  
Each rule has a unique identifier and must be tested.

---

## FR-001: Logging System Standardization

**Rule**: Use Winston logger exclusively with NestJS injection and explicit context.

**Requirements**:
- Injection via `private readonly logger = new Logger(ClassName.name)`
- Appropriate levels: `debug`, `info`, `warn`, `error` (with stack trace)
- Log critical events: auth, startup, errors

**Prohibitions**:
- Use `console.log`, `console.error`, `console.warn`, `console.debug`
- Log passwords, complete tokens, or sensitive data

**References**: `services/adventure/api/src/logger/winston.logger.ts` | `docs/logger.md`

---

## FR-002: Character Universal Fields

**Rule**: All character types (Player, NPC, etc.) must include shared narrative and economic fields at the base `Character` level.

**Requirements**:
- `appearance`: age, height, weight, eyes, skin, hair, description
- `background`: personalityTraits, ideals, bonds, flaws, alliesAndOrgs, backstory
- `treasure`: cp, sp, ep, gp, pp, notes
- Exposed in Swagger on all endpoints that accept `Character` derivatives

**Prohibitions**:
- Duplicating these fields in discriminators (e.g., `Player`, `NPC`) when they already exist on `Character`

**Tests**:
- DTO validation accepts these nested structures on `CreateCharacterDto`
- Invalid types in nested DTOs are rejected

**References**:
- `services/adventure/api/src/resources/character/core/schemas/character.schema.ts`
- `services/adventure/api/src/resources/character/core/dto/create-character.dto.ts`

---

## FR-003: D&D Conditions Management

**Rule**: All characters must support D&D 5e standard conditions tracking. Player characters additionally support exhaustion levels.

**Requirements**:

**Standard Conditions** (boolean) - Available for ALL characters (Player & NPC):
- `blinded`: Character is blinded
- `charmed`: Character is charmed
- `deafened`: Character is deafened
- `frightened`: Character is frightened
- `grappled`: Character is grappled
- `incapacitated`: Character is incapacitated
- `invisible`: Character is invisible
- `paralyzed`: Character is paralyzed
- `petrified`: Character is petrified
- `poisoned`: Character is poisoned
- `prone`: Character is prone
- `restrained`: Character is restrained
- `stunned`: Character is stunned
- `unconscious`: Character is unconscious

**Exhaustion** (Player-specific only):
- Type: `exhaustionLevel` (integer, 0-6)
- Only available on Player characters, NOT on NPCs
- Level 0: No exhaustion (default)
- Level 1: Disadvantage on ability checks
- Level 2: Speed halved
- Level 3: Disadvantage on attack rolls and saving throws
- Level 4: Hit point maximum halved
- Level 5: Speed reduced to 0
- Level 6: Death

**Validation Rules**:
- All standard conditions default to `false`
- Standard conditions are available on both Player and NPC
- `exhaustionLevel` is ONLY available on Player schema
- `exhaustionLevel` must be an integer between 0 and 6 (inclusive)
- `exhaustionLevel` defaults to 0 for Players
- Invalid exhaustion levels must be rejected

**Prohibitions**:
- Setting exhaustion level on NPCs
- Setting exhaustion level outside 0-6 range
- Using non-boolean values for standard conditions

**Tests**:
- DTO validation accepts valid conditions structure for all characters
- Player DTO accepts exhaustionLevel
- NPC DTO does NOT accept exhaustionLevel
- Invalid exhaustion levels are rejected for Players
- Conditions can be created, updated, and retrieved
- Default values are correctly applied

**References**:
- `services/adventure/api/src/resources/character/core/schemas/conditions/conditions.schema.ts`
- `services/adventure/api/src/resources/character/core/dto/conditions/conditions.dto.ts`
- `services/adventure/api/src/resources/character/player/schemas/player.schema.ts`
- `services/adventure/api/src/resources/character/player/dto/create-player.dto.ts`

---

## FR-004: Sidebar Navigation and Redux State Management

**Rule**: The web/client application must provide a contextual sidebar navigation with centralized Redux state management. The sidebar adapts its content based on user context (Player vs Game Master), which is controlled by a global state toggle, not URL patterns.

**Requirements**:

**Sidebar Structure**:
- Fixed sidebar on the left with 280px width
- Collapsible/expandable functionality stored in Redux
- User profile section at the bottom
- Context-specific navigation items that change based on current mode
- Responsive design with overlay mode on mobile
- Navigation items reference Figma design specifications

**Redux Architecture**:
- Redux Toolkit with TypeScript for complete type safety
- Three state slices:
  - `uiSlice`: UI state (sidebar collapsed state, theme preferences)
  - `userSlice`: User profile, roles, and **current context mode** (player/GM toggled via navbar button)
  - `navigationSlice`: Current route, breadcrumbs, navigation history
- Typed hooks: `useAppDispatch`, `useAppSelector` for type-safe state access
- Redux DevTools enabled in development mode only
- Memoized selectors using `createSelector` for performance

**Context Mode Management**:
- Context is **NOT** determined by URL patterns or prefixes
- Context mode (Player/GM) is stored in `userSlice.contextMode`
- Context switch triggered by a navbar button that dispatches Redux action
- Each route in the application is inherently either Player-accessible or GM-accessible (but without URL indication)
- Keycloak roles must validate context authorization before allowing mode switch
- Context mode persists across route changes until explicitly toggled

**Accessibility Requirements**:
- Keyboard navigation support: Tab for focus navigation, Escape to close sidebar
- ARIA attributes: `role="navigation"`, `aria-label="Main navigation"`, `aria-expanded`, `aria-current="page"`
- Focus trap when sidebar is open in overlay mode (mobile viewport)
- WCAG AA contrast compliance (4.5:1 for normal text, 3:1 for large text)
- Screen reader announcements for context mode changes
- Visible focus indicators for all interactive elements

**SSR and Next.js Compatibility**:
- All Redux-connected components must use `'use client'` directive
- Store initialization compatible with Next.js App Router SSR
- No hydration mismatches between server and client Redux state
- Redux Provider wrapped in client component before injection in layout

**Navigation Structure** (examples based on context mode):
- Player mode: Campaigns list, Campaign groups, Battle selection, Character sheets
- GM mode: Campaign management, NPC management, Encounter builder, World settings
- Shared: User profile, Settings, Logout

**Prohibitions**:
- Using global variables or React Context for navigation state (Redux is mandatory)
- Hardcoding user roles or context mode without Keycloak validation
- Detecting context from URL patterns or prefixes
- Missing accessibility attributes on interactive elements
- Client-side only routing without proper SSR handling
- Using `console.log` in production code (respect FR-001)

**Tests**:
- Redux slices unit tests (actions, reducers, selectors with all edge cases)
- Context mode toggle action and state updates
- Sidebar component rendering in both Player and GM contexts
- Keyboard navigation and accessibility compliance
- Focus trap functionality in mobile overlay mode
- SSR hydration without Redux state mismatches

**References**:
- `services/web/client/src/store/` (Redux architecture)
- `services/web/client/src/components/layout/Sidebar/` (Sidebar components)
- `services/web/client/src/app/[locale]/layout.tsx` (Redux Provider integration)

---

## FR-005: Player Characters Without Group

**Rule**: Player characters can be created and exist without being assigned to any group. A paginated route must be available to retrieve all player characters that are not currently assigned to any group and that were created by the authenticated user.

**Requirements**:
- Player characters can have an empty `groups` array (`[]`)
- `groups` field is optional (not required) for all character types
- A dedicated endpoint `GET /characters/players/without-group` must return paginated results of player characters with empty `groups` array created by the authenticated user
- Only player characters created by the requesting user (`createdBy` matches user's `keycloakId`) are returned
- Only player characters are returned (NPCs are excluded)
- Standard authentication and authorization rules apply
- Deleted characters (`deletedAt !== null`) are excluded from results
- Supports pagination with query parameters `page` and `offset` (defaults: page=1, offset=10)
- Returns `IPaginatedResponse` with `pagination` metadata (page, offset, totalItems)

**Validation Rules**:
- Creating a player character with `groups: []` is valid
- Creating a player character without specifying `groups` defaults to `[]`
- The route must filter by discriminator `kind: 'player'`, `groups: []`, and `createdBy: userId`
- Page parameter must be >= 1
- Offset parameter must be between 1 and 100

**Prohibitions**:
- Including NPC characters in the without-group endpoint
- Returning soft-deleted characters (`deletedAt !== null`)
- Returning characters created by other users
- Allowing group assignment validation to fail when `groups` is empty

**Tests**:
- Player can be created with empty groups array
- Player can be created without specifying groups (defaults to empty)
- Route returns paginated players with empty groups created by the authenticated user
- Route excludes players created by other users
- Route excludes NPCs
- Route excludes deleted players
- Default pagination values are applied when not provided
- Correct skip/limit calculation for different pages
- Service method correctly queries MongoDB for players without groups filtered by createdBy

**References**:
- `services/adventure/api/src/resources/character/core/schemas/character.schema.ts`
- `services/adventure/api/src/resources/character/player/player.controller.ts`
- `services/adventure/api/src/resources/character/player/player.service.ts`

---

## FR-005: User Logout Cache Purge

**Rule**: On user logout, all persisted application state (Redux Persist) must be completely purged to prevent data leakage between different user sessions.

**Context**: When a user logs out and another user logs in on the same browser/device, any persisted data from the previous user could cause:
- Permission errors (403) when the new user tries to access cached data they don't have rights to
- Data contamination between user sessions
- Security and privacy violations

**Requirements**:
- On logout action, Redux Persist state **must be purged** before the Keycloak logout redirect
- The purge operation must be awaited to ensure completion before redirect
- Purge must clear all whitelisted slices: `environment`, `campaignContext`, `sidebar`, `group`, `actionButton`, `campaign`, `character`
- Any error during purge must be logged but not block the logout process

**Expected Behavior**:
1. User clicks logout
2. Redux persisted state is purged from localStorage
3. Keycloak logout is triggered
4. User is redirected to login page
5. On new login, application starts with empty state (no cached data from previous user)

**Prohibitions**:
- Skipping the purge step during logout
- Allowing persisted state to survive across different user sessions
- Assuming cache data belongs to the current user without validation

**Tests**:
- Manual test: Logout with user A, login with user B, verify no cached data from user A remains
- Verify localStorage key `persist:chariot` is removed on logout
- Verify no 403 errors on new user login due to cached data

**References**:
- `services/web/client/src/store/index.ts` - `purgePersistedState()` function
- `services/web/client/src/providers/KeycloakProvider.tsx` - logout function with purge

---

## FR-006: Post-Authentication Navigation Priority

**Rule**: Upon successful authentication, the application must automatically redirect the user to the most relevant page based on their existing data. The redirection follows a strict priority hierarchy to ensure optimal user experience.

**Priority Hierarchy**:
1. **First Priority - Characters Without Group**: If the user has at least one player character without any group assignment, redirect to that character's page
2. **Second Priority - Characters in Campaigns**: If no characters without group exist, but the user has at least one character within a campaign/group, redirect to the first character found in any campaign
3. **Fallback - Welcome Page**: If the user has no characters at all, redirect to the welcome page (`/welcome`)

**Requirements**:
- Redirection logic executes **only once** immediately after successful authentication (`authenticated === true`)
- Must check characters without group first by calling `GET /characters/players/without-group`
- If no characters without group, fetch campaigns with `GET /campaigns` and extract the first character from the first campaign's first group
- Redirection must preserve locale prefix in URL (e.g., `/fr/characters/...`)
- Navigation must not trigger on every page load, only on the initial post-authentication event
- Must use Next.js router for navigation to maintain proper history
- Loading state should be maintained during data fetching to avoid flickering

**URL Patterns**:
- Character without group: `/{locale}/characters/{characterId}`
- Character in campaign: `/{locale}/campaigns/{campaignId}/groups/{groupId}/characters/{characterId}`
- Welcome page: `/{locale}/welcome`

**Validation Rules**:
- Only consider player characters (exclude NPCs)
- Only consider characters created by the authenticated user (`createdBy` matches `keycloakId`)
- Only consider non-deleted characters (`deletedAt === null`)
- Skip redirection if user is already on a character or campaign page

**Prohibitions**:
- Redirecting on every route change (must be post-authentication only)
- Ignoring locale prefix in redirect URLs
- Hardcoding redirect URLs without considering user data
- Causing infinite redirect loops
- Exposing navigation logic errors to the user (must fail gracefully to welcome page)

**Tests**:
- User with characters without group redirects to first character without group
- User with only characters in campaigns redirects to first character in campaign
- User with no characters redirects to welcome page
- Authenticated user already on a valid page does not get redirected
- Locale is preserved in all redirect URLs
- Navigation logic executes only once per authentication

**References**:
- `services/web/client/src/providers/KeycloakProvider.tsx` - Authentication flow
- `services/web/client/src/services/CharacterService.ts` - Character data fetching
- `services/web/client/src/services/CampaignService.ts` - Campaign data fetching

