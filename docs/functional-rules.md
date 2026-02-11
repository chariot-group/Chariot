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

---

## FR-006: User Balance and Transaction History

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

## FR-007: Character Detail View Display

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

## FR-008: User Cache Isolation and Session Transition

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

## FR-009: User Password Change

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