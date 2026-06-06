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

## FR-006: User Logout Cache Purge

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

## FR-007: Post-Authentication Navigation Priority

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

---

## FR-008: User Balance and Transaction History

**Rule**: Each user must have a balance tracking system linked to their Keycloak identity, with complete transaction history for audit purposes.

**Requirements**:

**User Schema**:

- `keycloakId`: UUID v4 linking to Keycloak user (required, unique)
- `balance`: Numeric value representing user's current balance (required, default: 0)
- `history`: Array of transaction records

**History Entry Structure**:

- `date`: Timestamp of the transaction (required)
- `campaignName`: Name of the campaign associated with the transaction (required)
- `value`: Numeric value of the transaction, positive or negative (required)

**Validation Rules**:

- `keycloakId` must be a valid UUID v4 format
- `keycloakId` must be unique across all users
- `balance` must be a number
- History entries must contain all three fields: date, campaignName, value
- History is immutable once created (no updates or deletions of history entries)

**Prohibitions**:

- Creating a user without a valid Keycloak ID
- Modifying `keycloakId` after user creation
- Deleting history entries
- Creating history entries without all required fields

**Tests**:

- DTO validation accepts valid User structure with all fields
- Invalid Keycloak ID format is rejected
- Duplicate Keycloak ID is rejected
- History entries can be added to existing users
- Balance updates are properly tracked in history
- Default balance is 0 for new users

**References**:

- `services/adventure/api/src/resources/user/schemas/user.schema.ts`
- `services/adventure/api/src/resources/user/schemas/sub/history.schema.ts`
- `services/adventure/api/src/resources/user/dto/create-user.dto.ts`
- `services/adventure/api/src/resources/user/dto/history.dto.ts`

---

## FR-009: Character Detail View Display

**Rule**: The web application must provide a detailed, tabbed view for displaying both Player and NPC characters with appropriate information differentiation and accessibility compliance.

**Requirements**:

**Page Structure**:

- Full-screen layout with tabbed navigation interface
- Fixed header section containing character identity and navigation tabs
- Content area displaying tab-specific information
- Responsive design adapting to mobile (overlay), tablet, and desktop viewports
- Maximum content width of 480px centered on screen with appropriate padding

**Tab Navigation System**:

- Five mandatory tabs with fixed color scheme:
  - **Général** (General): Blue accent (`bg-blue`)
  - **Combat** (Combat): Red accent (`bg-red`, white text)
  - **Magie** (Magic): Pink accent (`bg-pink`)
  - **Inventaire** (Inventory): Yellow accent (`bg-yellow`)
  - **Histoire** (History): Green accent (`bg-green`)
- Tab state management using React state (`useState`)
- Visual indication of active tab through background color and text color
- Inactive tabs display gray background with hover state
- Tab labels must be internationalized using `next-intl` with key `characterDetail.tabs.{tabName}`

**Character Header Information**:

**For Player Characters**:

- Character name (prominent display)
- Class(es) with level(s) in format: "ClassName Niv X" (e.g., "Guerrier Niv 5 / Magicien Niv 3")
- Multi-class support with "/" separator
- Group label if character belongs to a group (first group only)

**For NPC Characters**:

- Character name (prominent display)
- Challenge Rating (CR) with abbreviated label "ID" and tooltip "Indice de dangerosité"
- Fractional CR display for values < 1:
  - 0.125 → "1/8"
  - 0.25 → "1/4"
  - 0.5 → "1/2"
- Experience Points (XP) in parentheses after CR
- Group label if character belongs to a group (first group only)

**Character Avatar**:

- Placeholder icon (User icon from Lucide) when no image is available
- Fixed dimensions: 16x20 (mobile), 20x24 (sm), 24x28 (md+)
- Rounded corners (`rounded-[18px]`)
- Gray background (`bg-gray`)
- Positioned to the right of character information

**Accessibility Requirements**:

- ARIA role `tablist` on tab container with descriptive `aria-label`
- ARIA role `tab` on each tab trigger with `aria-selected` and `aria-controls` attributes
- ARIA role `tabpanel` on each content panel with corresponding `id` and `aria-labelledby`
- Keyboard navigation: Tab key for focus, arrow keys for tab switching
- Focus management: Visible focus indicators on all interactive elements (ring-2, ring-offset-2)
- Screen reader support: Appropriate ARIA attributes for no-image state
- WCAG AA compliance: Sufficient color contrast for all text elements
- Tab index management for sequential keyboard navigation

**Type Discrimination**:

- TypeScript type guard function `isPlayer()` to differentiate Player from NPC
- Type guard checks for presence of `progression` property
- Proper TypeScript typing for all props and return types

**Internationalization (i18n)**:

- All labels, tabs, and tooltips must use translation keys
- Translation namespace: `characterDetail`
- Supported languages: English (en), Spanish (es), French (fr)
- Translation keys structure:
  - `characterDetail.tabs.{general|combat|magic|inventory|history}`
  - `characterDetail.player.{level|race|class|alignment}`
  - `characterDetail.npc.{type|subtype|challengeRating|challengeRatingAbbr|alignment}`
  - `characterDetail.placeholder.noImage`

**Routing Support**:

- Two routes must display character detail view:
  - Standalone character: `/[locale]/characters/[idCharacters]`
  - Character in campaign: `/[locale]/campaigns/[idCampaign]/groups/[idGroup]/characters/[idCharacter]`
- Both routes use the same `CharacterDetailView` component
- Character data fetched via `useCharacter` hook with character ID
- Loading state displays centered spinner (Lucide `Loader2` component)
- Error state displays centered error message in red

**Component Architecture**:

- **CharacterDetailView**: Main component accepting `Player | NPC` prop
- **TabContentPlaceholder**: Temporary placeholder for tab content implementation
- Uses Shadcn/UI Tabs component for tab functionality
- Client-side component (`"use client"` directive)

**Prohibitions**:

- Displaying NPC-specific fields (challenge rating, XP) for Player characters
- Displaying Player-specific fields (class, level, exhaustion) for NPCs
- Hardcoding labels or text without internationalization
- Missing accessibility attributes on interactive elements
- Inconsistent color schemes across tabs
- Exposing character data without proper loading/error handling
- Creating separate components for Player and NPC views (must use discriminated union)

**Tab Content Status**:

- All five tabs currently display placeholder content
- Final tab content implementation is pending and not covered by this rule
- Placeholder displays tab name in large text with accent color

**Tests**:

- Component renders correctly with Player character data
- Component renders correctly with NPC character data
- Type guard correctly identifies Player vs NPC
- Tab switching updates active state correctly
- Keyboard navigation works (Tab, Enter, Arrow keys)
- ARIA attributes are properly set
- Challenge rating fractions display correctly for NPCs (1/8, 1/4, 1/2)
- Multi-class display formats correctly with "/" separator
- Character without group doesn't display group label
- Loading state displays spinner
- Error state displays error message
- Translations are applied correctly for all three locales
- Focus indicators are visible and meet WCAG standards

**References**:

- `services/web/client/src/components/character/CharacterDetailView.tsx` - Main component
- `services/web/client/src/components/character/TabContentPlaceholder.tsx` - Placeholder component
- `services/web/client/src/app/[locale]/characters/[idCharacters]/page.tsx` - Standalone route
- `services/web/client/src/app/[locale]/campaigns/[idCampaign]/groups/[idGroup]/characters/[idCharacter]/page.tsx` - Campaign route
- `services/web/client/src/types/character.ts` - TypeScript types
- `services/web/client/messages/{en|es|fr}.json` - Internationalization files

---

## FR-010: User Cache Isolation and Session Transition

**Rule**: Each user must have an isolated cache to prevent data leakage and 404 redirect loops when switching accounts or after session expiration.

**Context**: When a session expires and a user reconnects (same or different account), the frontend may attempt to access cached resources from the previous user, causing 404 errors and infinite redirect loops.

**Requirements**:

- **Cache Versioning by User**: Redux persist cache key must include the user ID (`chariot_user_${userId}`)
- **Transition State Management**: Add `userTransitioning` boolean state in `KeycloakContext` to signal user changes
- **Store Recreation**: Automatically recreate Redux store with the correct cache when user changes
- **Event-Based Communication**: Use `chariot:user-changed` custom event to signal user change from Keycloak to Redux
- **Grace Period for Redirects**: Add 500ms delay before redirecting to 404 to avoid premature redirections during cache transition
- **Loading State Respect**: Pages must not redirect while `loading` or `userTransitioning` is true

**Implementation Details**:

1. **Store Configuration**:
  - `makeStore(userId)` accepts optional userId parameter
  - `getCurrentUserId()` retrieves userId from localStorage
  - `makePersistConfig(userId)` creates user-specific persist configuration
  - `isStoreForCurrentUser(userId)` checks if current store matches userId
2. **User Change Detection** (KeycloakProvider):
  - Compare `kc.tokenParsed.sub` with stored `chariot_user_id`
  - If different, set `userTransitioning = true`
  - Dispatch `chariot:user-changed` event with new userId
  - Reset `userTransitioning = false` after 300ms
3. **Store Recreation** (ReduxProvider):
  - Listen to `chariot:user-changed` events
  - Purge old persistor
  - Create new store with new userId
  - Force re-render with updated store
4. **404 Redirect Protection**:
  - Check `loading` state before redirecting
  - Use `setTimeout` with 500ms grace period
  - Fallback to welcome page instead of generic 404 when appropriate

**Benefits**:

- ✅ Eliminates 404 redirect loops on user change
- ✅ Prevents data leakage between users
- ✅ No need to manually purge cache (automatic isolation)
- ✅ Improved UX during session transitions
- ✅ Graceful handling of expired sessions

**Prohibitions**:

- Using `window.location.href` for redirects without grace period
- Redirecting during `loading` or `userTransitioning` states
- Sharing cache between different users
- Ignoring user change events
- Hard-coding user IDs in cache keys
- Using single global cache key for all users

**Tests**:

- User A logs in → cache uses `chariot_user_${userA_id}`
- User A logs out, User B logs in → cache switches to `chariot_user_${userB_id}`
- User A's cached data is not accessible by User B
- Session expiration followed by relogin does not cause 404 loop
- `userTransitioning` state prevents premature redirects
- Store is recreated when `chariot:user-changed` event fires
- Grace period (500ms) allows cache to load before 404 redirect
- Anonymous users use `chariot_anonymous` cache key
- Multiple browser tabs maintain correct user isolation

**References**:

- `services/web/client/src/store/index.ts` - Redux store with user versioning
- `services/web/client/src/providers/KeycloakProvider.tsx` - User transition state management
- `services/web/client/src/providers/ReduxProvider.tsx` - Store recreation on user change
- `services/web/client/src/app/[locale]/profile/page.tsx` - Protected redirect example
- `services/web/client/src/app/[locale]/characters/[idCharacters]/page.tsx` - Grace period implementation
- `services/web/client/src/app/[locale]/campaigns/[idCampaign]/groups/[idGroup]/characters/[idCharacter]/page.tsx` - Grace period implementation

---

## FR-011: User Password Change

**Rule**: Authenticated users must be able to change their password through Keycloak SSO integration with validation, error handling, and internationalization.

**Context**: Password changes require secure interaction with Keycloak Admin API. The frontend must provide a user-friendly form with validation, and the backend must handle Keycloak API errors gracefully.

**Requirements**:

**Backend API**:

- Route: `PUT /users/me/password`
- Request body: `{ currentPassword: string, newPassword: string }`
- Authentication: JWT token with Keycloak user ID
- Validation:
  - Current password is required
  - New password must be at least 8 characters
  - New password must meet Keycloak realm password policy (complexity)
- Error handling with specific error codes:
  - 400: Invalid input (validation failed)
  - 401: Current password incorrect
  - 403: New password does not meet complexity requirements
  - 500: Keycloak API error
- Winston logging (FR-001):
  - `info`: Successful password change with user ID (no password logged)
  - `error`: Failed password change with error type and user ID
  - Never log passwords or tokens

**Frontend Hook**:

- Hook: `usePasswordForm()` in `src/hooks/usePasswordForm.ts`
- Form state management with react-hook-form and Zod validation
- States:
  - `isLoading`: boolean (true while submitting)
  - `error`: string | null (error message from API)
  - `success`: boolean (true after successful change)
  - `form`: react-hook-form instance
- Functions:
  - `onSubmit(data)`: Submits password change to API
  - `onReset()`: Resets form to initial state
- Zod validation schema:
  - `currentPassword`: required, non-empty string
  - `newPassword`: required, min 8 characters
  - `confirmPassword`: required, must match newPassword
- Toast notifications:
  - Success: Display translated success message
  - Error: Display translated error message based on error type
- Translated validation messages (i18n):
  - `validation.currentPasswordRequired`: "Current password is required"
  - `validation.newPasswordMin`: "Password must be at least 8 characters"
  - `validation.confirmPasswordRequired`: "Please confirm your password"
  - `validation.passwordMismatch`: "Passwords do not match"

**Keycloak Integration**:

- Backend service: `KeycloakService.changeUserPassword(keycloakId, currentPassword, newPassword)`
- API endpoint: `adminClient.users.resetPassword()` (requires valid current password verification first)
- Verify current password by attempting authentication before changing
- Handle Keycloak-specific errors:
  - Invalid current password
  - Password policy violations (complexity, history, etc.)
  - Account locked or disabled

**User Experience**:

- User remains authenticated after successful password change
- Form resets after successful submission
- Toast notification displays for 3 seconds
- Error messages are specific and actionable (not generic "failed to change password")
- Password visibility toggle for all password fields

**Security Requirements**:

- Passwords never logged in plain text
- Passwords never stored in Redux or localStorage
- No password sent in GET requests or URL parameters
- HTTPS required for all password-related requests (enforced by API)

**Benefits**:

- ✅ Secure password change through Keycloak
- ✅ User-friendly validation with clear error messages
- ✅ Internationalized error messages
- ✅ Centralized password change logic in custom hook
- ✅ No passwords leaked in logs or client-side storage

**Prohibitions**:

- Storing passwords in Redux, localStorage, or any client-side cache
- Logging passwords in Winston logs (even on error)
- Allowing password change without current password verification
- Using weak validation (less than 8 characters)
- Displaying generic error messages that don't help users
- Changing password without checking Keycloak realm policy

**Tests**:

**Backend Tests**:

- DTO validation accepts valid password change data
- DTO validation rejects invalid data (empty, too short, etc.)
- Controller returns 401 when current password is incorrect
- Controller returns 403 when new password doesn't meet policy
- Controller returns 200 and success message when password changed
- Service logs error when Keycloak API fails
- Service logs success when password changed (without password in log)

**Frontend Tests**:

- Hook validates form data with Zod schema
- Hook rejects passwords shorter than 8 characters
- Hook rejects mismatched password confirmation
- Hook calls API with correct payload
- Hook displays toast on success
- Hook displays specific error message on failure
- Hook returns react-hook-form instance

**References**:

- `services/adventure/api/src/resources/user/dto/change-password.dto.ts` - Backend DTO
- `services/adventure/api/src/resources/user/user.controller.ts` - PUT /users/me/password route
- `services/adventure/api/src/resources/user/user.service.ts` - Password change business logic
- `services/adventure/api/src/resources/user/keycloak.service.ts` - Keycloak password change
- `services/web/client/src/hooks/usePasswordForm.ts` - Frontend password change hook
- `services/web/client/src/types/user.ts` - PasswordChangeDto type
- `services/web/client/src/services/UserService.ts` - API client method
- `services/web/client/messages/{en|fr|es}.json` - Internationalization

---

## FR-012: User Profile Update via Keycloak

**Rule**: Users must be able to update their personal information (firstName, lastName, email) through a dedicated API endpoint that synchronizes changes with Keycloak. Profile updates apply to the authenticated user only and must be traceable.

**Requirements**:

**Backend (Adventure API)**:

- Endpoint `PUT /users/me` accepts partial updates to user profile
- DTO `UpdateUserProfileDto` with optional fields: `firstName`, `lastName`, `email`
- Validation rules:
  - `firstName`: Optional string, minimum 2 characters when provided
  - `lastName`: Optional string, minimum 2 characters when provided
  - `email`: Optional valid email format when provided
- Updates are applied to Keycloak via `KeycloakService.updateUser(keycloakId, userData)`
- Winston logging for all update operations (success and errors) - respects FR-001
- Returns updated `UserInfoDto` with all current user information
- Authentication required via Keycloak JWT Guard

**Frontend (Web Client)**:

- Hook `useProfileForm()` centralizes profile update logic
- React Hook Form with Zod resolver for client-side validation
- Zod schema validation:
  - `firstName`: Required, min 2 characters
  - `lastName`: Required, min 2 characters
  - `email`: Required, valid email format
- Form states: `isLoading`, `isSaving`, `error`, `success`
- Returns form instance for component integration
- Automatically loads initial data via `useUser` hook
- Function `onUpdate(data)` calls `PUT /users/me` and updates Redux cache
- Function `onCancel()` resets form to initial values
- Toast notifications (success/error) with i18n messages
- Network error handling with translated messages

**Validation Rules**:

- All field updates are optional (partial update)
- Empty strings are rejected (must be min 2 characters or omitted)
- Email format must be standard RFC 5322
- Username is **NOT** editable (immutable field)
- Avatar is **NOT** managed by this endpoint (separate feature)
- Updates are applied atomically in Keycloak

**Prohibitions**:

- Updating username via this endpoint
- Updating other users' profiles (only `user.keycloakId` from JWT)
- Bypassing Keycloak for user data persistence
- Accepting updates without authentication
- Logging sensitive data (email content is acceptable, passwords are not)
- Allowing empty or whitespace-only values for required fields in frontend form
- Missing toast feedback after save attempt

**Error Handling**:

- 400 Bad Request: Invalid data format or validation failure
- 401 Unauthorized: Missing or invalid JWT token
- 404 Not Found: User not found in Keycloak
- 500 Internal Server Error: Keycloak communication failure or unexpected error
- Frontend displays translated error messages via toast system
- Logs include full error stack trace (backend) for debugging

**Frontend Hook Behavior** (`useProfileForm`):

- Loads user data on mount via `useUser({ autoFetch: true })`
- Resets form when user data changes
- `onUpdate`: Validates → API call → Redux update → Toast → Form reset to new values
- `onCancel`: Resets form to last loaded values without API call
- `isSaving`: True during API request
- `isLoading`: True while initial user data is loading
- `error`: Contains validation or API error message
- `success`: True after successful update (resets after 3s or new action)

**TypeScript Types**:

- Backend: `UpdateUserProfileDto` (PartialType with firstName, lastName, email)
- Frontend: `UpdateUserDto` mirrors backend DTO structure
- Both use strict TypeScript without `any` types

**Internationalization (i18n)**:

- Translation namespace: `ProfilePage.editProfile`
- Required keys in `messages/{en|fr|es}.json`:
  - `editProfile.successMessage`: "Profile updated successfully"
  - `editProfile.errorMessage`: "Failed to update profile"
  - `editProfile.networkError`: "Network error. Please try again."
  - `editProfile.validationError`: "Please check the form fields"
  - `editProfile.firstName`: "First name"
  - `editProfile.lastName`: "Last name"
  - `editProfile.email`: "Email address"
  - `editProfile.save`: "Save changes"
  - `editProfile.cancel`: "Cancel"

**Tests**:

- **Backend**:
  - Unit: UserService calls KeycloakService with correct parameters
  - Unit: Validation rejects firstName/lastName < 2 characters
  - Unit: Validation rejects invalid email format
  - Unit: Winston logger called on success and error
  - E2E: PUT /users/me returns 401 without authentication
  - E2E: PUT /users/me returns 200 with valid data and updates Keycloak
  - E2E: PUT /users/me returns 400 with invalid data
  - E2E: Partial update (only firstName) works correctly
  - Mock: KeycloakService.updateUser is called with merged data
- **Frontend**:
  - Unit: useProfileForm validates form data with Zod
  - Unit: useProfileForm calls UserService.updateCurrentUser
  - Unit: useProfileForm updates Redux user state on success
  - Unit: useProfileForm shows success toast with i18n message
  - Unit: useProfileForm shows error toast on API failure
  - Unit: onCancel resets form to initial values
  - Integration: Form submission with valid data updates user in Redux
  - Integration: Form submission with invalid email shows validation error
  - Integration: Network error displays translated error message

**References**:

- `services/adventure/api/src/resources/user/user.controller.ts` - PUT /users/me endpoint
- `services/adventure/api/src/resources/user/user.service.ts` - updateUser method
- `services/adventure/api/src/resources/user/keycloak.service.ts` - updateUser method
- `services/adventure/api/src/resources/user/dto/update-user-profile.dto.ts` - DTO definition
- `services/web/client/src/hooks/useProfileForm.ts` - Profile form hook
- `services/web/client/src/services/UserService.ts` - updateCurrentUser method
- `services/web/client/src/types/user.ts` - UpdateUserDto type
- `services/web/client/messages/{en|fr|es}.json` - i18n translations

---

## FR-013: Stripe Checkout, Webhook Access Control, and Referral System

**Rule**: Stripe checkout creation must be restricted to authenticated users, while webhook processing must be publicly accessible only through Stripe signature validation. The payment service handles all Stripe interactions and applies a referral discount system (parrainage) automatically at checkout.

---

### FR-013-A: Checkout and Webhook Access Control

**Requirements**:

- All checkout endpoints (`POST /stripe/checkout`, `POST /stripe/checkout/embedded`, `POST /stripe/payment-intent`) require authenticated user context from Keycloak guard
- `userId` must be sourced from `request.user.keycloakId` only
- `userId` must not be provided in checkout request body DTO
- Endpoint `POST /stripe/webhook` must be marked public (`@Public()`) to allow Stripe callbacks
- Webhook requests must be validated with Stripe signature header and webhook secret before processing
- The payment service (port 9003) handles all Stripe operations; the gateway proxies `/payment/*` routes to it

**Checkout Modes**:
- **Standard session** (`POST /stripe/checkout`): redirects to Stripe-hosted checkout page
- **Embedded session** (`POST /stripe/checkout/embedded`): returns a `clientSecret` for in-app rendering
- **PaymentIntent** (`POST /stripe/payment-intent`): for single-page PaymentElement flow; amount updatable via `PATCH /stripe/payment-intent/:id`

**Prohibitions**:

- Accepting `userId` from checkout body payload
- Requiring user JWT authentication on webhook endpoint
- Processing webhook event without Stripe signature validation

**Tests**:

- Controller unit test verifies checkout calls service with `request.user.keycloakId`
- Controller unit test verifies webhook route is marked public
- Controller unit test verifies missing raw body is rejected

---

### FR-013-B: Referral System (Parrainage)

**Rule**: A tier-based referral discount system automatically applies discounts at checkout for both the referrer (parrain) and the referee (filleul). Referral discounts apply only when no promo code or affiliation code is provided.

#### Referee (Filleul) Rules

- A user becomes a filleul by registering with a referral code during account initialization
- The filleul receives a **15% discount** on their next order
- This discount is **one-time use**: once used at checkout, it is permanently consumed
- A filleul is considered **validated** (and credited to their parrain) only after completing their **first payment**
- A user cannot use their own referral code

#### Referrer (Parrain) Tier System

- The parrain earns **1 tier per validated filleul** (i.e., a filleul who has completed at least one payment)
- Tiers and corresponding discounts:

  | Tier | Validated filleuls | Discount |
  |------|--------------------|----------|
  | 0    | 0                  | 0% (no discount) |
  | 1    | 1                  | 10% |
  | 2    | 2                  | 15% |
  | 3    | 3                  | 20% |
  | …    | …                  | … (+5% per tier) |
  | max  | ≥ 9                | 50% (capped) |

- The discount represents a **reduction on the next order** only
- After the parrain uses their discount at checkout, their tier **resets to 0** (pending count reset to 0)
- Pending filleuls who have not yet made a purchase do not contribute to the discount tier

#### Discount Application Rules

- Referral discounts are applied **automatically** — no code entry required by the user
- Referral discount applies **only when no promo code and no affiliation code is provided** in the checkout request
- If a user simultaneously qualifies as both parrain (referrer) and filleul (referee), **only the highest discount is applied** (not cumulative)
- Referral discounts apply to the total unit price after no other discount is in effect

#### Discount Resolution Priority (full order)

1. **Affiliation code** — applied first to the original unit price
2. **Promo code** — applied on top of the affiliation discount (on the remaining amount)
3. **Referral discount** — applied automatically, but **only if neither a promo code nor affiliation code is provided**

**Prohibitions**:
- Applying referral discount when a promo or affiliation code is present
- Cumulating parrain and filleul discounts simultaneously
- Counting a filleul toward the parrain's tier before the filleul's first payment is completed
- Allowing a user to use their own referral code
- Applying a parrain discount without resetting the tier to 0 afterward
- Applying the filleul discount more than once

**Tests**:
- Filleul receives 15% discount on next order after registering with a valid code
- Filleul discount is consumed after first use and not applied again
- Parrain with 1 validated filleul receives 10% discount
- Parrain with 2 validated filleuls receives 15% discount
- Parrain with ≥ 9 validated filleuls is capped at 50%
- Unvalidated filleuls (no payment yet) do not contribute to parrain tier
- After parrain uses discount, tier resets to 0
- User qualifying as both parrain and filleul receives only the highest discount
- Referral discount is NOT applied when a promo or affiliation code is provided
- User cannot register with their own referral code
- `checkUserReferralDiscount` returns null when no discount is available
- `checkUserReferralDiscount` fails gracefully (returns null) without blocking checkout

**References**:

- `services/payment/api/src/resources/stripe/stripe.controller.ts`
- `services/payment/api/src/resources/stripe/stripe.service.ts`
- `services/payment/api/src/resources/stripe/dto/checkout.dto.ts`
- `services/payment/api/src/resources/referral/referral.service.ts`
- `services/payment/api/src/resources/referral/referral.controller.ts`
- `services/payment/api/src/resources/affiliation/affiliation.service.ts`
- `services/payment/api/src/resources/promo-code/promo-code.service.ts`

---

### FR-013-C: Below-Minimum and Free Checkout Orders

**Rule**: When the final discounted order amount is zero or below the Stripe minimum charge for the currency, the order must be fulfilled without a card payment. Any positive remainder below the Stripe minimum must appear as a complimentary "Cadeau" line in the checkout recap.

**Requirements**:

- Stripe minimum charge amounts must be enforced server-side before creating or updating a PaymentIntent (EUR minimum: 50 centimes)
- When `chargeableAmount === 0`, checkout must use `POST /stripe/free-order` instead of Stripe PaymentElement confirmation
- The existing PaymentIntent must be cancelled when the order becomes non-chargeable, to prevent accidental full-price payment
- Free-order fulfillment must produce the same side effects as a successful Stripe webhook: payment recorded as `COMPLETED`, promo/affiliation usage tracked, referral side effects applied, tokens credited
- When `0 < discountedAmount < stripeMinimum`, the checkout recap must display a **Cadeau** line equal to the remainder waived (gift amount), in addition to any promo/affiliation/referral discount lines
- The pay button must remain disabled while PaymentIntent synchronization fails (`piError` present)

**Prohibitions**:

- Attempting to create or update a Stripe PaymentIntent with an amount below the Stripe minimum (except 0 handled by free-order flow)
- Allowing card payment when the displayed total is 0 €
- Omitting the Cadeau line when a positive remainder below the Stripe minimum exists

**Tests**:

- `resolveChargeableAmount` returns gift waiver for amounts between 1 and minimum-1 centimes
- `resolveChargeableAmount` returns no gift for amount exactly at Stripe minimum
- `resolveChargeableAmount` returns zero charge for fully discounted orders
- Free-order endpoint rejects requests where `chargeableAmount > 0`

**References**:

- `services/payment/api/src/resources/stripe/stripe-charge.utils.ts`
- `services/payment/api/src/resources/stripe/stripe.service.ts`
- `services/web/client/src/lib/checkout-utils.ts`
- `services/web/client/src/components/checkout/CheckoutForm.tsx`

---

## FR-014: Admin Sidebar External Navigation Links

**Rule**: The admin client sidebar must expose configurable external links to third-party administration consoles (Keycloak, Stripe). URLs must be defined per environment via environment variables and must not be hardcoded.

**Requirements**:

**Configuration**:
- Keycloak admin URL via `NEXT_PUBLIC_KEYCLOAK_ADMIN_URL`
- Stripe dashboard URL via `NEXT_PUBLIC_STRIPE_DASHBOARD_URL`
- Variables are defined in the admin service `.env` and injected at build time for Next.js client components
- `NEXT_PUBLIC_KEYCLOAK_URL` remains reserved for SSO authentication and must not be reused for the sidebar admin link

**Navigation Behavior**:
- External links open in a new browser tab (`target="_blank"`, `rel="noopener noreferrer"`)
- A sidebar item is displayed only when its corresponding URL is defined and non-empty
- External links do not use internal active-route highlighting
- Internal navigation items (payment module routes) keep using Next.js `Link` with existing active-state logic

**Accessibility Requirements**:
- External links include an accessible indication that they open a new tab (`aria-label` with supplementary text)
- Visible focus indicators on all interactive sidebar elements
- Keyboard navigation remains functional for all displayed items

**Prohibitions**:
- Hardcoding Keycloak or Stripe dashboard URLs in component source code
- Using `NEXT_PUBLIC_KEYCLOAK_URL` as the sidebar Keycloak admin link
- Rendering external links without `rel="noopener noreferrer"`
- Displaying broken links when URL configuration is missing

**Tests**:
- Sidebar renders Keycloak link when `NEXT_PUBLIC_KEYCLOAK_ADMIN_URL` is set
- Sidebar renders Stripe link when `NEXT_PUBLIC_STRIPE_DASHBOARD_URL` is set
- Sidebar omits external links when corresponding env variable is empty or undefined
- External links use `target="_blank"` and `rel="noopener noreferrer"`
- Internal routes continue to render and highlight active state correctly

**Deployment Configuration**:
- Local/dev: values are read from `services/admin/.env` via `compose.dev.yml`
- Integration/production: values are injected at Docker build time from GitHub secrets (`INTEG_*` / `PROD_*` counterparts of the same variables)

**References**:
- `services/admin/client/src/components/layout/Sidebar.tsx`
- `services/admin/client/src/config/navigation.ts`
- `services/admin/.env.example`
- `services/admin/compose.dev.yml`
- `services/admin/client/Dockerfile.prod`
- `.github/workflows/ci.yml` (job `deploy-admin`)

---

## FR-015: Admin Table Deep Links to Keycloak and Stripe

**Rule**: In the admin payment module tables, displayed Keycloak user IDs and Stripe order IDs must be clickable deep links to the corresponding resource in the Keycloak admin console and Stripe dashboard.

**Requirements**:

**URL Construction**:
- Keycloak user URL built from `NEXT_PUBLIC_KEYCLOAK_ADMIN_URL`, `NEXT_PUBLIC_KEYCLOAK_REALM`, and the user UUID
- Stripe order URL built from `NEXT_PUBLIC_STRIPE_DASHBOARD_URL` and the order identifier (`cs_*` → checkout session, `pi_*` → payment intent)
- URLs must not be hardcoded; reuse the same environment variables as FR-014
- When a required env variable is missing, the identifier is rendered as plain non-clickable text

**Navigation Behavior**:
- Deep links open in a new browser tab (`target="_blank"`, `rel="noopener noreferrer"`)

**Accessibility Requirements**:
- Links include an accessible indication that they open a new tab (`aria-label` with supplementary text)
- Visible focus indicators on all interactive link elements

**Scope**:
- Paiements: user Keycloak ID and Stripe order ID
- Parrainage: user Keycloak ID
- Affiliations: creator Keycloak ID when `creatorUserId` is present
- Codes promo: no Keycloak ID column in list view (not in scope unless a user ID column is added)

**Prohibitions**:
- Hardcoding Keycloak or Stripe dashboard URLs in page components
- Rendering broken links when URL configuration is missing
- Using `NEXT_PUBLIC_KEYCLOAK_URL` instead of `NEXT_PUBLIC_KEYCLOAK_ADMIN_URL` for admin deep links

**Tests**:
- URL builder returns correct Keycloak user deep link for configured admin URL and realm
- URL builder returns null when Keycloak admin URL is missing
- URL builder returns correct Stripe checkout session and payment intent paths
- URL builder falls back to Stripe dashboard search for unknown ID prefixes
- URL builder returns null when Stripe dashboard URL is missing

**References**:
- `services/admin/client/src/lib/external-links.ts`
- `services/admin/client/src/components/KeycloakUserId.tsx`
- `services/admin/client/src/components/StripeOrderId.tsx`
- `services/admin/client/src/components/ExternalDashboardLink.tsx`
- `services/admin/client/src/app/payments/page.tsx`
- `services/admin/client/src/app/referrals/page.tsx`
- `services/admin/client/src/app/affiliations/page.tsx`

---

## FR-016: Admin Affiliation Activation Lifecycle

**Rule**: Admin users can deactivate and reactivate affiliation programs without soft-deleting them. Deactivation stops the code from being usable at checkout while preserving history and stats.

**Requirements**:
- Deactivation sets `isActive` to `false` via `PATCH /affiliations/:id/deactivate`
- Reactivation sets `isActive` to `true` via `PATCH /affiliations/:id` with body `{ isActive: true }`
- Deactivated affiliations remain visible when the admin list filter "Inclure inactifs" is enabled
- Deactivated affiliations are excluded from the default list view (`includeInactive=false`)
- Inactive affiliation codes must not apply discounts at checkout (enforced by payment service)
- Admin UI provides a deactivate action only for active affiliations, with user confirmation before the request
- Admin UI provides a reactivate action only for inactive affiliations, with user confirmation before the request
- Deactivate and reactivate actions must expose an accessible label (`aria-label`) on the control
- All clickable admin buttons must use `cursor-pointer`

**Prohibitions**:
- Using `DELETE /affiliations/:id` for deactivation (that endpoint performs soft delete via `deletedAt`)
- Allowing checkout with an inactive affiliation code

**Tests**:
- Deactivate path builder returns `PATCH /affiliations/:id/deactivate` for a valid UUID
- Reactivate path builder returns `PATCH /affiliations/:id` with `{ isActive: true }`
- Default affiliation list excludes inactive records
- List with `includeInactive=true` includes inactive but not soft-deleted records

**References**:
- `services/payment/api/src/resources/affiliation/affiliation.controller.ts`
- `services/payment/api/src/resources/affiliation/affiliation.service.ts`
- `services/payment/api/src/resources/payment/payment.service.ts`
- `services/admin/client/src/app/affiliations/page.tsx`
- `services/admin/client/src/services/AffiliationService.ts`

---

## FR-017: Admin Promo Code Activation Lifecycle

**Rule**: Admin users can deactivate and reactivate promo codes without soft-deleting them. Deactivation stops the code from being usable at checkout while preserving usage history.

**Requirements**:
- Deactivation sets `isActive` to `false` via `PATCH /promo-codes/:id/deactivate`
- Reactivation sets `isActive` to `true` via `PATCH /promo-codes/:id` with body `{ isActive: true }`
- Deactivated promo codes remain visible when the admin list filter "Inclure inactifs" is enabled
- Deactivated promo codes are excluded from the default list view (`includeInactive=false`)
- Inactive promo codes must not apply discounts at checkout (enforced by payment service)
- Admin UI provides a deactivate action only for active promo codes, with user confirmation before the request
- Admin UI provides a reactivate action only for inactive promo codes, with user confirmation before the request
- Deactivate and reactivate actions must expose an accessible label (`aria-label`) on the control
- All clickable admin buttons must use `cursor-pointer`

**Prohibitions**:
- Using `DELETE /promo-codes/:id` for deactivation (that endpoint performs soft delete via `deletedAt`)
- Allowing checkout with an inactive promo code

**Tests**:
- Deactivate path builder returns `PATCH /promo-codes/:id/deactivate` for a valid UUID
- Reactivate path builder returns `PATCH /promo-codes/:id` with `{ isActive: true }`
- Default promo code list excludes inactive records
- List with `includeInactive=true` includes inactive but not soft-deleted records

**References**:
- `services/payment/api/src/resources/promo-code/promo-code.controller.ts`
- `services/payment/api/src/resources/promo-code/promo-code.service.ts`
- `services/admin/client/src/app/promo-codes/page.tsx`
- `services/admin/client/src/services/PromoCodeService.ts`

---

## FR-018: Combat Module - Configuration and Initiative Tracker

**Rule**: The combat module must provide a stable Game Master workflow from battle setup to turn-by-turn tracking, with recoverable local state and explicit guardrails on turn rollback.

**Scope**:

- GM flow only for setup and tracker control (players consume session and character views)
- Two sub-modules: **battle configuration dialog** and **initiative tracker**
- Source of truth on frontend: `session` Redux slice (persisted)

**Preconditions**:

- User is in GM context
- A session exists and is launched
- At least one campaign group (or session participant) provides at least one combatant

**Battle Configuration (InitBattleDialog)**:

- Available when session is launched and battle is not initialized
- Builds selectable groups from campaign active groups and adds a mandatory virtual group for current session participants
- Session participants group is always forced in selected groups when it has members
- GM can:
  - select/deselect eligible groups
  - expand/collapse groups to inspect members
  - include/exclude members per group
- Validation is allowed only if:
  - at least one non-participant group is selected
  - each selected group still has at least one included member
- On validation:
  - selected members are transformed into tracker rows
  - each row starts with initiative `0`, `visible: true`, empty conditions, and HP/AC from character stats
  - battle state is initialized (not started), and user is redirected to `/{locale}/initiativeTracker`

**Draft Persistence (Setup UX continuity)**:

- Setup choices are persisted in `session.initBattleDraft`:
  - `selectedGroupIds`
  - `expandedGroupIds`
  - `excludedMembersByGroup`
  - `showAllOpponents`
- Draft is restored when reopening configuration
- Invalid/stale group references are sanitized during restore

**Initiative Tracker - Core Behavior**:

- Tracker list is always displayed sorted by:
  1. initiative descending
  2. group label ascending (tie-breaker)
- Before combat start:
  - initiatives are editable
  - grouped initiative edit mode is available (bulk apply to selected rows)
- On combat start:
  - active turn is set to first row in sorted order
  - initiatives become locked
  - grouped initiative mode is disabled

**Turn and Round Lifecycle**:

- `next`:
  - moves to next row
  - if last row finished, wraps to first row and increments round by 1
- `previous` (undo progression) is allowed only if:
  - a previous turn exists
  - current turn has no recorded tracker action
  - global round index does not affect eligibility by itself
- Clarification of scope:
  - `turn` = current character turn in initiative order
  - `round` = global cycle incremented after all characters have played
  - rollback eligibility is evaluated on current character turn state, not on global round state
- Any tracker edit during combat (HP, AC, visibility, conditions, etc.) marks current turn as having actions and can lock rollback

**Conditions Management**:

- Supported conditions follow the D&D list used by tracker constants
- Per character:
  - add/remove one condition
  - clear all conditions
  - one active entry per condition key (re-adding replaces previous entry)
- Optional duration on add:
  - `seconds`, `minutes`, `hours`, `rounds`, `untilCombatEnd`
- Duration runtime behavior:
  - stored as `remainingSeconds` except `untilCombatEnd`
  - decremented by one full round on round advance
  - restored by one full round when valid rollback crosses a round boundary
  - removed automatically when `remainingSeconds <= 0`
  - all `untilCombatEnd` conditions are removed on combat end

**HP Session Interaction**:

- In-session tracker HP cell opens session health dialog
- Saving HP updates both backend character state (through session flow) and tracker row mirror (`hitPoints`, `maxHitPoints`, `tempHitPoints`)

**Mid-Combat Roster (GM)**:

- While a battle is initialized, the GM MUST be able to **add combatants** from the initiative tracker page:
  - any campaign group not yet represented in the roster, and/or
  - individual members from groups already in the roster whose `characterId` is not yet present.
- New rows follow the same generation rules as battle configuration (stats, visibility defaults, dedupe by `characterId`).
- Adding combatants MUST NOT reset turn engine state (`battleStarted`, active turn, round, action locks) except when the add mutates the roster during started combat (registers a tracker action on the active turn per FR-018).
- The GM MUST be able to **remove a row** (“leave initiative”) without ending the whole battle:
  - if the removed row was the active turn, advance to the next alive row in sorted order (or clear active turn if none remain);
  - purge turn-action keys tied to the removed row;
  - if no rows remain, clear `battleInitialized` and reset turn engine.

**Reset and End States**:

- `End combat`:
  - is available to the GM only
  - MUST first open a confirmation dialog written in functional, non-technical language
  - dialog intent MUST clearly state that leaving combat returns everyone to their character sheet and that combat progress will no longer be available
  - dialog copy SHOULD stay concise; recommended confirmation message: `Are you sure you want to leave combat? If you confirm, everyone will return to their character sheet and combat progress will no longer be available.`
  - on confirmation, returns the GM to the last consulted character sheet path of the current session
  - on confirmation, returns each player to their session character sheet
  - clears all tracker rows
  - clears battle configuration draft (`initBattleDraft`)
  - clears initialized/started combat state and resets turn engine (`battleStarted=false`, round 1, no active row, no action locks)
  - removes conditions scoped to `untilCombatEnd`
  - requires a brand new battle configuration before another combat can start
- `Reset` (sidebar action on tracker page):
  - clears all tracker rows
  - clears initialized/started combat state
  - requires a new battle configuration

**Persistence and Recovery**:

- Tracker rows and combat state are persisted per user in Redux persist (`session` slice)
- On rehydration:
  - legacy condition formats are normalized
  - missing HP derivative fields are repaired (`maxHitPoints`, `tempHitPoints`)

**Functional Guardrails / Current Limitations**:

- `showAllOpponents` is persisted in setup draft but currently has no functional impact on tracker generation
- Validation currently enforces at least one selected non-participant group, even if session participants exist
- Turn rollback lock is based on tracker actions only, not on external game events

**Prohibitions**:

- Starting combat with zero tracker rows
- Allowing turn rollback when current turn has registered tracker actions
- Keeping `untilCombatEnd` conditions after combat is ended

**Tests**:

- Setup validation matrix (group/member selections, mandatory participant group behavior)
- Row generation integrity (identity, stats fallback, visibility, dedupe behavior)
- Turn lifecycle (start, next wrap, round increment, previous constraints)
- Action lock behavior on rollback after row update
- Condition lifecycle for each duration type and combat end cleanup
- Persist/rehydration normalization of session tracker state

**References**:

- `services/web/client/src/components/dialogs/InitBattleDialog.tsx`
- `services/web/client/src/app/[locale]/initiativeTracker/page.tsx`
- `services/web/client/src/components/initiativeTracker/`
- `services/web/client/src/store/slices/sessionSlice.ts`
- `services/web/client/src/store/index.ts`

---

## FR-019: Frontend Design Governance and Responsive Baseline

**Rule**: The frontend must maintain a documented design baseline built from the implemented UI, and any new frontend feature must be aligned with that baseline before implementation.

**Requirements**:

- A dedicated design rules document must exist under `docs/` and centralize:
  - spacing conventions (padding, margin, gaps)
  - recurring color tokens and usage patterns
  - typography and sizing patterns used in UI components
  - responsive behaviors and breakpoints observed in the application
- The document must be produced from a project-wide analysis of existing frontend code (components, pages, layout primitives, shared styles)
- The document must describe current conventions as observable facts before proposing standardization guidance
- Agent workflow rules (`AGENTS.md`) must explicitly require consulting the design rules document before any frontend feature implementation
- The design document should be updated when major UI conventions change

**Prohibitions**:

- Implementing new frontend features without checking documented design conventions first
- Introducing ad-hoc spacing/color patterns that conflict with documented baseline without explicit decision
- Keeping design governance rules only implicit or oral (must be written and versioned)

**Tests**:

- Manual verification that the design rules document exists and covers spacing, colors, and responsive behavior
- Manual verification that `AGENTS.md` includes an explicit pre-implementation consultation gate for frontend features

**References**:

- `services/web/client/src/` (frontend source of truth)
- `docs/` (design governance documentation)
- `AGENTS.md` (agent workflow gate)

---

## FR-020: Initiative Tracker - Automatic Dead and Unconscious States

**Rule**: Each initiative tracker row must reflect the character's vital status (alive, unconscious, dead) automatically derived from current HP and (for player characters) death save failures. Visual treatment, accessible name, and turn-order behavior depend on this status.

**Scope**:

- Applies to the GM Initiative Tracker (FR-018) only.
- Source of truth on frontend: `session.initiativeTrackerRows`.
- Complements FR-018 without overriding any of its existing behaviors (turn lifecycle, conditions, persistence).

**Status Derivation**:

- `dead`:
  - NPC row when `hitPoints <= 0`
  - Player row when `hitPoints <= 0` AND player's `deathSaves.failures >= 3`
- `unconscious`:
  - Player row when `hitPoints <= 0` AND player's `deathSaves.failures < 3`
- `alive`: any row that does not match `dead` or `unconscious`.

**Tracker Row Data Requirements**:

- Each row must carry the character `kind` (`player` | `npc`) so the tracker can apply the right rule.
- For player rows, the row must mirror `deathSaves.failures` (`deathSavesFailures: number`, default `0`) so the status can be evaluated without re-fetching the character.
- Mirror values must be initialized when the battle is configured (from the latest character snapshot).
- Mirror values must be refreshed:
  - When the underlying character is updated through the session HP dialog (HP edit also pulls fresh death saves).
  - On real-time character sheet sync (FR-022 `characterSheetRemoteVersions`) when the affected row is a player AND its current `hitPoints <= 0` (death saves are only meaningful at 0 HP, so we avoid refetching for cosmetic sheet edits).
- Persisted shape must be backwards compatible (rehydration adds `kind: 'npc'` and `deathSavesFailures: 0` to legacy rows lacking these fields).

**Visual Treatment (FR-019 compliance)**:

- Dead row:
  - Background: explicit red surface using the project palette (`--red`, e.g. `bg-red/35` with `ring-2 ring-red/60` on the row container) preserving WCAG AA contrast against white text.
  - A `Skull` icon (lucide-react) is rendered immediately after the HP value inside the HP cell of the tracker row, with `aria-hidden="true"`. Status text is exposed at the row level for screen readers.
- Unconscious row:
  - Background: explicit yellow/amber surface using the project palette (`--yellow`, e.g. `bg-yellow/30` with `ring-2 ring-yellow/60`) preserving WCAG AA contrast against white text.
  - A `HeartCrack` icon (lucide-react) is rendered immediately after the HP value inside the HP cell of the tracker row, with `aria-hidden="true"`. Status text is exposed at the row level.
- Alive row keeps the current visual baseline (no extra icon).
- Active turn highlight (current FR-018 styling) MUST remain visible on top of dead/unconscious states (combined ring/background, never replaced).
- Status MUST never be conveyed by color alone: an icon (skull/heart-crack) and an accessible label are mandatory companion channels.

**Turn Order Behavior**:

- `nextBattleTurn` and `previousBattleTurn` MUST skip rows in the `dead` state.
  - Skipping over a dead row MUST NOT register a tracker action on the skipped row (FR-018 turn-lock semantics unchanged for non-skipped rows).
  - When advancing past the last alive row, the round counter increments by 1 exactly once and condition durations tick by one round (FR-018 condition lifecycle preserved).
  - When all rows are dead, the active turn becomes `null` and no advancement happens.
- `unconscious` rows are NOT skipped; they keep their normal place in the initiative order.
- Eligibility for `previousBattleTurn` (turn-lock guard from FR-018) is unchanged; among eligible rollbacks, dead rows are skipped.

**Accessibility (FR-019)**:

- Dead/unconscious status MUST be exposed via accessible text on the row (e.g. visually hidden status label inside the row container) so screen readers announce the state.
- Color contrast for the new red and yellow backgrounds against the existing white text MUST meet WCAG AA for normal text (4.5:1).
- Skull/HeartCrack icons MUST be `aria-hidden="true"`; semantic information is carried by the textual status.
- Keyboard navigation behavior of the row is unchanged (no new focusable elements introduced by status indicators).

**Prohibitions**:

- Marking a player as dead solely on `hitPoints <= 0` without checking death save failures.
- Skipping unconscious players in the turn rotation.
- Using color alone as the only signal for dead or unconscious states (icon + accessible text mandatory).
- Hardcoding new colors outside the documented palette (FR-019).
- Polling the character API to refresh death saves (must rely on session HP dialog updates and `characterSheetRemoteVersions` events; refetch only for player rows currently at `hitPoints <= 0`).

**Tests**:

- Status derivation:
  - NPC at 0 HP -> `dead`
  - Player at 0 HP with `failures < 3` -> `unconscious`
  - Player at 0 HP with `failures >= 3` -> `dead`
  - Any character with HP > 0 -> `alive` (regardless of failures)
- Turn rotation:
  - `nextBattleTurn` skips a dead row in the middle of the order
  - `nextBattleTurn` skips a dead row at the end and increments round once
  - `nextBattleTurn` returns active row to `null` when all rows are dead
  - Unconscious rows are visited normally
  - `previousBattleTurn` skips dead rows symmetrically while respecting FR-018 turn-lock rules
- Visual:
  - Dead row renders red background and `Skull` icon after HP
  - Unconscious row renders yellow background and `HeartCrack` icon after HP
  - Alive row renders neither icon
  - Active turn highlight is preserved on top of dead/unconscious states

**References**:

- `services/web/client/src/store/slices/sessionSlice.ts` (turn engine, row shape, persistence transform)
- `services/web/client/src/components/initiativeTracker/InitiativeTrackerRow.tsx`
- `services/web/client/src/components/initiativeTracker/utils.ts` (sort, turn helpers, status helper, HP mirror)
- `services/web/client/src/components/dialogs/InitBattleDialog.tsx` (row construction with kind + deathSaves mirror)
- `services/web/client/src/components/initiativeTracker/InitiativeTrackerHealthDialog.tsx` (sync after HP edit)
- `services/web/client/src/app/[locale]/initiativeTracker/page.tsx` (remote sync refresh for player rows at 0 HP)

---

## FR-021: Session Combat Navigation and Player Initiative Visibility

**Rule**: During an active session combat, Game Masters and players must have contextual sidebar navigation between character sheets and the initiative tracker. The GM controls per-row and per-field visibility broadcast to players in real time via the session WebSocket.

**Scope**:

- Applies when a session is launched and a battle is initialized (`battleInitialized === true`).
- Complements FR-018 (GM tracker control) and FR-020 (vital status) without overriding turn lifecycle or GM-only controls.
- Player initiative view is read-only; turn controls remain GM-only.

**Sidebar Navigation — Game Master**:

- When the GM is on the initiative tracker page and a battle is initialized or started, the sidebar footer MUST show **Return to Character Sheet** (not **Reset**).
- **Return to Character Sheet** navigates to the last character sheet path consulted by the GM during the current session (`lastConsultedSheetPath`). If none is recorded, the button is disabled with an explanatory tooltip.
- When the GM is on a character sheet and a battle is initialized or started, the sidebar footer MUST show **Return to Battle**, navigating to `/{locale}/initiativeTracker`. Styling: red background, white text, swords icon.
- **Reset** (clear tracker rows) MUST NOT appear in the sidebar while a battle is initialized or started. Reset remains available only through in-page GM controls when applicable (FR-018).

**Sidebar Navigation — Player**:

- Before the GM has actually started combat, players MUST NOT have access to the initiative tracker.
- While combat is initialized but not started, the sidebar footer for players MUST NOT show **Return to Battle**.
- Once combat has started, when the player is not on the initiative tracker page, the sidebar footer MUST show **Return to Battle** (same label, icon, and styling as the GM), navigating to `/{locale}/initiativeTracker`.
- Once combat has started, when the player is on the initiative tracker page, the sidebar footer MUST show **View Character Sheet**, navigating to their session character sheet.
- If the player has no assigned character, **View Character Sheet** is disabled with an explanatory tooltip.
- Once combat has been ended by the GM, the player MUST be redirected to their session character sheet and MUST no longer have access to **Return to Battle** for that finished combat.

**Last Consulted Sheet Tracking**:

- `lastConsultedSheetPath` is stored in the `session` Redux slice (persisted per user).
- Updated when the GM navigates to any character detail route during an active session.
- Cleared when the session ends (`clearCurrentSession`).

**Player Visibility Model**:

Each initiative tracker row carries:

- `visible: boolean` — whether the row is shown to players at all.
- `playerFieldVisibility` — granular field flags:
  - `initiative`, `name`, `hitPoints`, `armorClass`, `conditions`, `groupLabel` (all boolean).

**Default visibility on battle configuration**:

- **NPC rows**: `visible: true`; field defaults — `name: true`, all other fields `false` (initiative, HP, AC, conditions, group hidden).
- **Player rows in the session participants group** (`__session_participants__`): `visible: true`; all fields `true`; not maskable by the GM.
- **Other player rows** (PJ outside session group): same defaults and maskability as NPC rows; `visible` can be set to `false`.

**GM Visibility Tool**:

- On the GM initiative tracker, the **Show** column opens a per-row configuration dialog (not a simple checkbox).
- The dialog allows toggling row visibility and each field flag independently.
- Changes apply immediately to the GM view and are broadcast to connected players.

**Player Display Name (alias)**:

- Each row carries `playerDisplayName` used when the real name is hidden from players (FR-021).
- On row creation (battle setup or mid-combat add), the default MUST be the character’s real tracker name (`firstname` / `lastname` / `surname` rule).
- Legacy rows with an empty alias MUST be normalized to that default on load.
- Saving the visibility dialog with an empty alias MUST persist the real name as the alias.
- On the **GM** tracker, the real name is shown prominently; when the alias differs from the real name, the alias is also shown in subdued typography so the GM sees what players will read when the name field is hidden.

**Player Initiative Tracker View**:

- Same route as GM: `/{locale}/initiativeTracker`.
- Players can access this route only once combat has started (`battleStarted === true`).
- If a player tries to access the route before combat starts, they MUST be redirected back to their session character sheet.
- Read-only: no HP edit dialog, no condition edit, no initiative edit, no turn controls, no visibility column.
- Rows filtered to `visible === true`, plus any row in the session participants group (always shown to connected players).
- Field values masked when the corresponding `playerFieldVisibility` flag is `false` (display placeholder `—`; hidden name displays a generic hidden label).
- Active turn highlight and round indicator reflect GM broadcast state.
- Vital status visuals (FR-020) apply on visible HP when HP is shown.

**Real-Time Sync (WebSocket)**:

- GM emits `session:battle-state-updated` with a snapshot: `initiativeTrackerRows`, `battleInitialized`, `battleStarted`, `activeTurnRowId`, `currentRound`.
- Gateway validates emitter is session GM, then broadcasts to other participants (`client.to`).
- Players apply via `applyRemoteBattleState` (does not register GM turn-lock actions).
- The initiative snapshot MUST become available to players only once combat has started; a merely initialized combat is GM-only.
- On `session:request-battle-state`, the gateway relays to the session room; GM clients respond by emitting the current snapshot (handles late join / reconnect).
- GM also rebroadcasts after `session:participant-joined` when a battle is active.

**Prohibitions**:

- Showing GM-only controls (turn engine, reset, visibility editor) to players.
- Exposing an initialized-but-not-started combat to players.
- Persisting player-local edits to battle state (players are consumers only).
- Broadcasting battle state from non-GM participants.
- Using sidebar **Reset** during an initialized or started battle.
- Reopening a new combat with rows, setup choices, or turn progress carried over from a previous ended combat.

**Tests**:

- Sidebar state matrix (GM/player × page × battle state).
- Default `playerFieldVisibility` per kind (NPC vs player).
- Player view filters hidden rows and masks hidden fields.
- `applyRemoteBattleState` replaces battle fields without touching `turnsWithActions`.
- Rehydration adds default `playerFieldVisibility` to legacy rows.

**References**:

- `services/web/client/src/components/layout/Sidebar/ActionButton.tsx`
- `services/web/client/src/components/initiativeTracker/InitiativeTrackerVisibilityDialog.tsx`
- `services/web/client/src/lib/sessionBattleSyncBridge.ts`
- `services/web/client/src/store/slices/sessionSlice.ts`
- `services/session/api/src/resources/session/session.gateway.ts`

---

## FR-022: Session Combat Real-Time Synchronization Between Initiative Tracker and Character Sheets

**Rule**: During an active session combat, initiative tracker rows and session character sheets must stay synchronized in real time for all connected participants who are allowed to view the affected data. A change made from either surface must be reflected on the other without requiring a manual page reload.

**Scope**:

- Applies only while a session is active and a combat is initialized or started.
- Covers synchronization between:
  - GM initiative tracker
  - player read-only initiative tracker view
  - session character sheets opened by the GM or by players
- Complements FR-018, FR-020, and FR-021 without changing their visibility or turn-control rules.

**Synchronization Model**:

- The character sheet remains the source of truth for persisted character data.
- The initiative tracker row remains the source of truth for battle-only UI state:
  - initiative value
  - tracker-only visibility flags
  - tracker-only condition entries and durations
  - active turn / round state
- When a persisted character field displayed in the tracker changes from a character sheet, all matching tracker rows must refresh in real time.
- When a tracker action changes persisted character data, all open character sheets for that character must refresh in real time.

**Fields Required to Sync in Real Time**:

- From character sheet to initiative tracker:
  - current HP state used by the tracker (`hitPoints`, `maxHitPoints`, `tempHitPoints`)
  - armor class
  - display identity used by the tracker (`firstname`, `lastname`, `surname`, `avatar`)
  - player death save failures when applicable
- From initiative tracker to character sheet:
  - any persisted HP update performed through the session health flow
- Tracker-only data MUST NOT be pushed into the character sheet as persisted character edits:
  - initiative
  - tracker conditions and durations
  - row visibility and player field visibility
  - active turn / round state

**Propagation Rules**:

- A real-time sheet update event emitted for a session character must be processed by:
  - the emitting client locally
  - the GM if the GM is not the emitter
  - all other connected participants allowed to read that character in the session
- The tracker refresh on sheet updates must not be limited to characters at 0 HP; identity, AC, avatar, and HP changes must propagate for any tracked character.
- The character-sheet refresh on tracker-originated persisted HP updates must apply to all open viewers of that character in the session, including the editor.
- If multiple tracker rows reference the same character, all of them must refresh consistently.

**Authorization and Visibility**:

- Only session participants may receive synchronization events for characters on the current session roster.
- Real-time synchronization must respect existing access rules:
  - player tracker view remains filtered and masked per FR-021
  - GM-only tracker controls remain GM-only
  - players must not gain access to hidden tracker-only fields through sheet synchronization
- NPC sheet updates made by the GM during session combat must also refresh the initiative tracker in real time when that NPC is on the roster.

**Performance and Robustness**:

- Sync events should carry only the minimum routing payload needed to identify the updated character/session; consumers may refetch the authoritative character payload when necessary.
- Duplicate or burst updates for the same character should be coalesced on the client when feasible to avoid redundant fetch storms.
- Reconnect and late-join behavior must converge to the latest valid state without requiring a full browser reload.
- A failed refresh for one character must not block sync handling for other characters.

**Prohibitions**:

- Requiring a manual refresh to see a tracker-relevant character sheet change during active combat.
- Limiting tracker refresh to player rows only when an NPC sheet change is relevant to the roster.
- Limiting tracker refresh to the `hitPoints <= 0` case.
- Broadcasting tracker-only private state into persisted character records.
- Broadcasting session character updates for characters that are not on the active session roster.

**Tests**:

- Character sheet -> tracker:
  - Player HP update refreshes the matching tracker row in real time for GM and players
  - Player identity/AC update refreshes the matching tracker row in real time
  - NPC sheet update refreshes the matching tracker row in real time
  - Multiple rows mapped to the same character refresh consistently
- Tracker -> character sheet:
  - HP edit from tracker refreshes the open session character sheet in real time
  - Local editor also observes the refresh path without waiting for a remote echo
- Access and resilience:
  - Hidden player tracker fields remain masked after a sync event
  - Non-roster character update is ignored
  - A failed refetch for one character does not break subsequent sync events

**References**:

- `services/web/client/src/lib/sessionCharacterSyncBridge.ts`
- `services/web/client/src/components/SessionCharacterSyncClient.tsx`
- `services/web/client/src/hooks/useCharacter.ts`
- `services/web/client/src/app/[locale]/initiativeTracker/page.tsx`
- `services/web/client/src/store/slices/sessionSlice.ts`
- `services/session/api/src/resources/session/session.gateway.ts`

---

## FR-023: Initiative Tracker - Bulk Display Configuration

**Rule**: The Game Master initiative tracker must support bulk selection of tracker rows from the display-configuration area so shared display parameters can be applied to multiple combatants at once, including during an active combat.

**Requirements**:

- The bulk display-configuration control must be available to the GM whenever a battle is initialized or started.
- The GM can select multiple tracker rows and apply shared player-facing display parameters in one action.
- Bulk display configuration must support the same player-facing visibility fields as the per-row display configuration defined in FR-021.
- Bulk display configuration must support assigning a shared player-facing name/alias to all selected rows.
- The shared name/alias input is empty by default and must be clearly identified as applying the same name to all selected characters.
- If the shared name/alias input is left empty, existing row aliases must not be overwritten.
- Bulk actions that remove rows from initiative must follow the "leave initiative" behavior from FR-018 and must not end the battle.
- When bulk changes are applied during started combat, the current turn must be marked as having a tracker action according to FR-018 rollback-lock semantics.
- Player-facing broadcasts and masking must continue to follow FR-021.

**Accessibility Requirements**:

- Bulk-selection controls must be keyboard reachable and operable.
- The bulk action button must have an explicit accessible name and state when selection mode is active.
- Selected row state must be perceivable visually and to assistive technologies.
- Dialog fields must have associated labels, and validation or empty-selection errors must be announced accessibly.

**Prohibitions**:

- Disabling the bulk display-configuration control only because combat has started.
- Editing locked initiative scores during started combat through this bulk display-configuration workflow.
- Overwriting existing aliases with an empty shared-name value.
- Exposing GM-only display controls to player tracker views.

**Tests**:

- Bulk display configuration is available before combat starts and after combat starts.
- Applying visibility settings updates all selected rows and leaves unselected rows unchanged.
- Leaving the shared name/alias field empty preserves existing aliases.
- Entering a shared name/alias applies that same alias to all selected rows.
- Bulk leave-initiative removes selected rows without ending combat.
- Applying a bulk change during started combat registers a tracker action on the current turn.
- Keyboard, focus, accessible names, selected-state, and dialog-label behavior are covered.

**References**:

- `services/web/client/src/app/[locale]/initiativeTracker/page.tsx`
- `services/web/client/src/components/initiativeTracker/`
- `services/web/client/src/store/slices/sessionSlice.ts`

---

## FR-024: Session Participant Human-Readable Display Names

**Rule**: Whenever the application displays the identity of a connected session participant to another user (Game Master or player), it MUST show a human-readable label derived from the participant profile. Technical identifiers and private contact data MUST NOT be used as display labels.

**Scope**:

- Session lobby participant list (`/{locale}/campaigns/{campaignId}/session/{code}`)
- GM sidebar session players section (`Joueurs (session)`)
- GM character sheet context when showing who plays a character (`playedBy`)
- Session toasts that name a joining, leaving, or disconnected participant
- Applies whenever `isInSession === true` and a roster entry references a `userId`

**Label Resolution Priority**:

1. `username` (Keycloak / user profile), when present and not a Keycloak UUID
2. `firstName` + `lastName` (trimmed, space-separated), when `username` is absent or unusable
3. Loading placeholder `...` while the label is not yet resolved

**Data Sources** (non-exclusive; client may merge the first valid result):

- WebSocket `session:participant-joined` payload field `username` (`preferred_username` from JWT)
- Authenticated API `GET /user/{keycloakId}`
- Redux `session.participantDisplayNames`, cleared on `clearCurrentSession` and pruned when a participant leaves the roster

**Display Requirements**:

- The same participant MUST use the same resolved label across lobby, sidebar, and toasts for the current session context.
- A resolved label MUST NOT be replaced by a Keycloak UUID if a better source becomes available later (WebSocket username or successful profile fetch).
- While resolution is pending, UI surfaces MUST show `...`, not the raw `userId`.

**Prohibitions**:

- Displaying a participant email as their session label
- Displaying a Keycloak `sub` / UUID (`userId`) as a fallback label
- Treating a UUID-shaped `username` or WebSocket `username` as a valid display label
- Persisting `participantDisplayNames` across sessions (labels are ephemeral per active session)

**Tests**:

- Nominal: user with `username` shows that username in lobby and GM sidebar
- Edge: user without `username` but with `firstName` + `lastName` shows the full name
- Edge: WebSocket join provides a valid `username` before API fetch completes; label is shown without flashing UUID
- Edge: initial API failure followed by WebSocket username still updates the displayed label
- Error: profile fetch failure shows `...`, never UUID or email
- Regression: `username` equal to Keycloak UUID falls back to `firstName` + `lastName` or `...`

**References**:

- `services/web/client/src/lib/formatSessionParticipantUserLabel.ts`
- `services/web/client/src/lib/sessionParticipantDisplayNames.ts`
- `services/web/client/src/store/slices/sessionSlice.ts` (`participantDisplayNames`)
- `services/web/client/src/hooks/useSessionData.ts`
- `services/web/client/src/hooks/useSessionSocket.ts`
- `services/web/client/src/components/SessionCharacterSyncClient.tsx`
- `services/web/client/src/components/layout/Sidebar/GmSessionPlayersSidebarSection.tsx`
- `services/web/client/src/app/[locale]/campaigns/[idCampaign]/session/[code]/page.tsx`
- `services/web/client/src/components/character/CharacterDetailView.tsx`
- `services/session/api/src/resources/session/session.gateway.ts`

---

## FR-023: In-Session Logo and Session Lobby Sidebar Navigation

**Rule**: While a user is connected to an active session, clicking the application logo in the header and the sidebar action button on the session lobby page must provide contextual navigation back to character sheets instead of the generic welcome redirect or an irrelevant session action.

**Scope**:

- Applies when `isInSession === true` and the session record is available in Redux.
- Complements FR-021 (combat navigation) without overriding combat-specific sidebar rules on other pages.
- The session lobby page is `/{locale}/campaigns/{campaignId}/session/{sessionCode}`.

**Header Logo — Player**:

- When a connected player clicks the logo, they MUST be redirected to their session character sheet: `/{locale}/characters/{characterId}?sessionCode={sessionCode}` when a character is assigned.
- If the player has no assigned character, the logo click MUST fall back to `/{locale}/welcome`.

**Header Logo — Game Master**:

- When the connected GM clicks the logo, they MUST be redirected to the first character of the first active group in the session campaign, using the same resolution order as `NavigationService.determineSpaceDestination` (active groups first, then archived groups with characters).
- If no character exists in the campaign, the logo click MUST fall back to `/{locale}/welcome`.

**Header Logo — Outside Session**:

- When the user is not in a session, logo click behavior is unchanged: redirect to `/{locale}/welcome`.

**Sidebar Action Button — Player on Session Lobby**:

- When the session is launched (`sessionStatus === "launched"`) and the player is on the session lobby page:
  - If combat has not started, the sidebar footer MUST show **Return to Character Sheet**, navigating to the player's session character sheet.
  - If combat has started, the sidebar footer MUST show **Return to Battle** (same behavior as FR-021 when the player is outside the initiative tracker).
- If the player has no assigned character, **Return to Character Sheet** is disabled with an explanatory tooltip.

**Accessibility**:

- The logo button MUST expose an accessible name describing its destination context (home vs character sheet navigation).

**Tests**:

- Nominal: launched session, player on session lobby without combat sees **Return to Character Sheet**.
- Nominal: player in session clicks logo and lands on their session character sheet URL with `sessionCode`.
- Nominal: GM in session clicks logo and lands on first character of first campaign group.
- Edge: player without assigned character cannot use **Return to Character Sheet**; logo falls back to welcome.
- Edge: combat started, player on session lobby sees **Return to Battle**.
- Regression: user not in session still redirects logo to welcome.

**References**:

- `services/web/client/src/components/layout/Header.tsx`
- `services/web/client/src/components/layout/Sidebar/ActionButton.tsx`
- `services/web/client/src/components/layout/SessionTimer.tsx`
- `services/web/client/src/services/NavigationService.ts`
- `services/web/client/src/lib/sessionInAppNavigation.ts`
