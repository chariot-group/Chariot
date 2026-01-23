# Sidebar Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Component Structure](#component-structure)
3. [State Management](#state-management)
4. [Custom Hooks](#custom-hooks)
5. [Cache Strategy](#cache-strategy)
6. [Development Guide](#development-guide)
7. [Best Practices](#best-practices)

---

## Overview

The sidebar is a context-aware navigation component that adapts based on the user's role (Player/GM) and selected campaign. It manages three main data domains:

- **Campaigns**: List of user's campaigns (GM mode only)
- **Groups**: Active and archived groups within a campaign (GM mode only)
- **Characters**: Characters without groups (Player mode)

### Key Features

- **Context-Aware**: Different UI based on player/GM mode
- **Persistent State**: UI state persisted across page refreshes
- **Infinite Scroll**: Paginated data loading for large lists
- **Optimistic Cache**: Minimizes unnecessary API calls
- **Keyboard Accessible**: Full keyboard navigation support

---

## Component Structure

```
Sidebar/
├── index.tsx                           # Main sidebar container
├── SidebarEnvironment.tsx              # Environment/mode selector
├── SidebarContext.tsx                  # GM navigation (groups)
├── CampaignList.tsx                    # Campaign list with infinite scroll
├── GroupList.tsx                       # Group list with characters
├── CharactersWithoutGroupList.tsx      # Player mode character list
└── ActionButton.tsx                    # Context-dependent action button
```

### Component Hierarchy

```
Sidebar
├── SidebarEnvironment
│   └── CampaignList (GM mode)
├── SidebarContext (GM mode)
│   ├── GroupList (active)
│   └── GroupList (archived)
└── CharactersWithoutGroupList (Player mode)
```

---

## State Management

### Redux Slices

The sidebar uses multiple Redux slices for state management:

#### 1. **sidebarSlice** (UI State)
Manages collapsible sections state.

```typescript
interface SidebarState {
    openEnvironment: boolean;      // Environment selector open
    openActiveGroups: boolean;     // Active groups section open
    openArchivedGroups: boolean;   // Archived groups section open
}
```

**Actions:**
- `setOpenEnvironment(boolean)`: Toggle environment selector
- `setOpenActiveGroups(boolean)`: Toggle active groups section
- `setOpenArchivedGroups(boolean)`: Toggle archived groups section
- `closeAllMenus()`: Close all collapsible sections

**Persistence:** ✅ Persisted via redux-persist

#### 2. **environmentSlice** (Context Mode)
Manages player/GM mode.

```typescript
interface EnvironmentState {
    contextMode: 'player' | 'gm';
}
```

**Persistence:** ✅ Persisted via redux-persist

#### 3. **campaignSlice** (Campaign Data)
Manages campaign list with pagination.

```typescript
interface CampaignState {
    campaigns: Campaign[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    currentPage: number;
    hasMore: boolean;
    total: number;
}
```

**Persistence:** ✅ Persisted via redux-persist (for cache)

#### 4. **groupSlice** (Group Data)
Manages active and archived groups for selected campaign.

```typescript
interface GroupState {
    active: Group[];
    archived: Group[];
    loading: boolean;
    error: string | null;
    openGroupId: string | null;
}
```

**Persistence:** ✅ Persisted via redux-persist

#### 5. **characterSlice** (Character Data)
Manages characters without groups with pagination.

```typescript
interface CharacterState {
    charactersWithoutGroup: Character[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    currentPage: number;
    total: number;
    error: string | null;
}
```

**Persistence:** ✅ Persisted via redux-persist

---

## Custom Hooks

### 1. `useCampaigns`

Manages campaign data with infinite scroll and cache.

#### Usage

```typescript
import { useCampaigns } from '@/hooks/useCampaigns';

function MyComponent() {
    const {
        campaigns,           // Campaign[]
        loading,             // boolean
        loadingMore,         // boolean
        error,               // string | null
        hasMore,             // boolean
        currentPage,         // number
        total,               // number
        fetchCampaigns,      // () => Promise<Campaign[]>
        loadMoreCampaigns,   // () => Promise<Campaign[]>
        refreshCampaigns,    // () => Promise<Campaign[]>
        clearCache,          // () => void
        createCampaign,      // (data) => Promise<Campaign>
        updateCampaign,      // (id, data) => Promise<Campaign>
        deleteCampaign,      // (id) => Promise<void>
    } = useCampaigns({
        autoFetch: true,        // Auto-fetch on mount if cache is empty
        forceRefresh: false,    // Force fetch even with cache
        pageSize: 5,            // Items per page
        autoSelectFirst: true,  // Auto-select first campaign in GM mode
    });
}
```

#### Cache Behavior

- **Auto-fetch**: Only fetches if cache is empty (`campaigns.length === 0`)
- **Cache invalidation**: `createCampaign`, `updateCampaign`, and `deleteCampaign` invalidate cache
- **Manual refresh**: Use `refreshCampaigns()` to force reload
- **Clear cache**: Use `clearCache()` to clear all campaigns

#### Example: Loading More Campaigns

```typescript
const { campaigns, loadMoreCampaigns, hasMore, loadingMore } = useCampaigns();

const handleScroll = () => {
    if (hasMore && !loadingMore) {
        loadMoreCampaigns();
    }
};
```

### 2. `useGroups`

Manages groups for the selected campaign.

#### Usage

```typescript
import { useGroups } from '@/hooks/useGroups';

function MyComponent() {
    const {
        activeGroups,        // Group[]
        archivedGroups,      // Group[]
        loading,             // boolean
        error,               // string | null
        openGroupId,         // string | null
        fetchGroups,         // () => Promise<void>
        toggleGroup,         // (groupId: string) => void
        closeAllGroups,      // () => void
    } = useGroups();
}
```

#### Auto-Loading

- Automatically fetches groups when `selectedCampaignId` changes
- Clears groups when no campaign is selected

#### Group Separation

Groups are separated into active/archived based on the campaign's `groups.active` and `groups.archived` arrays.

```typescript
// Campaign structure
interface Campaign {
    _id: string;
    label: string;
    groups: {
        active: string[];    // Array of active group IDs
        archived: string[];  // Array of archived group IDs
    };
}
```

### 3. `usePlayersWithoutGroup`

Manages characters without groups (Player mode) with infinite scroll.

#### Usage

```typescript
import { usePlayersWithoutGroup } from '@/hooks/useCharacter';

function MyComponent() {
    const {
        characters,          // Character[]
        loading,             // boolean
        loadingMore,         // boolean
        error,               // string | null
        hasMore,             // boolean
        loadMoreCharacters,  // () => Promise<void>
        refetch,             // () => Promise<void>
    } = usePlayersWithoutGroup(10); // pageSize
}
```

#### Cache Behavior

- Auto-fetches if cache is empty
- Persisted in Redux state
- Use `refetch()` to invalidate and reload

### 4. `useCharacter`

Fetches a single character by ID (no cache).

#### Usage

```typescript
import { useCharacter } from '@/hooks/useCharacter';

function CharacterDetail({ characterId }: { characterId: string }) {
    const { character, loading, error, refetch } = useCharacter(characterId);

    if (loading) return <Loader />;
    if (error) return <Error message={error} />;
    if (!character) return null;

    return <div>{character.name}</div>;
}
```

---

## Cache Strategy

### Overview

The sidebar uses a **multi-layer cache strategy**:

1. **Redux State**: In-memory cache (fast access)
2. **Redux Persist**: LocalStorage persistence (survives page refresh)
3. **Smart Invalidation**: Cache invalidation on mutations

### Persistence Configuration

```typescript
// services/web/client/src/store/index.ts
const persistConfig = {
    key: 'chariot',
    storage,
    whitelist: [
        'environment',      // Player/GM mode
        'campaignContext',  // Selected campaign ID
        'sidebar',          // Collapsible states
        'group',            // Groups data + openGroupId
        'actionButton',     // Action button state
        'campaign',         // Campaigns data
        'character',        // Characters data
    ],
};
```

### Cache Invalidation Rules

| Action | Affected Cache | Behavior |
|--------|----------------|----------|
| Create Campaign | Campaigns | Invalidates cache, next fetch reloads |
| Update Campaign | Campaigns | Invalidates cache, next fetch reloads |
| Delete Campaign | Campaigns | Invalidates cache, next fetch reloads |
| Switch Campaign | Groups | Auto-fetches new campaign's groups |
| Mode Switch (Player/GM) | Context | Clears campaign selection if switching to Player |

### Cache Flow Diagram

```
┌─────────────────┐
│   Component     │
│   renders       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Redux     │
│ cache           │◄─────┐
└────────┬────────┘      │
         │                │
    Cache exists?         │
         │                │
    Yes  │  No            │
         │                │
         ▼                │
    Return data           │
                          │
         │                │
         ▼                │
┌─────────────────┐      │
│ Fetch from API  │      │
└────────┬────────┘      │
         │                │
         ▼                │
┌─────────────────┐      │
│ Update Redux    │──────┘
│ (auto-persist)  │
└─────────────────┘
```

### Hydration on Page Load

When the app loads, Redux Persist automatically rehydrates the state from localStorage:

1. Redux Persist loads persisted state
2. Components render with cached data (no loading state)
3. If `autoFetch` is enabled and cache is empty, data is fetched

**This prevents visual "jumps" and provides instant UI rendering.**

---

## Development Guide

### Creating a New Page Using Sidebar Data

#### Example: Campaign Detail Page

```typescript
'use client';

import { useCampaigns } from '@/hooks/useCampaigns';
import { useGroups } from '@/hooks/useGroups';
import { useAppSelector } from '@/store/hooks';
import { selectSelectedCampaignId } from '@/store/slices/campaignContextSlice';

export default function CampaignDetailPage() {
    // Get selected campaign ID from context
    const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
    
    // Get campaigns (with cache)
    const { campaigns, loading } = useCampaigns({
        autoFetch: true,
        pageSize: 20,
    });
    
    // Get groups for selected campaign (auto-loads)
    const { activeGroups, archivedGroups, loading: groupsLoading } = useGroups();
    
    // Find selected campaign
    const campaign = campaigns.find(c => c._id === selectedCampaignId);
    
    if (loading || groupsLoading) return <Loader />;
    if (!campaign) return <NotFound />;
    
    return (
        <div>
            <h1>{campaign.label}</h1>
            <h2>Active Groups ({activeGroups.length})</h2>
            {/* Render groups */}
        </div>
    );
}
```

### Invalidating Cache After Mutation

```typescript
import { useCampaigns } from '@/hooks/useCampaigns';

function CreateCampaignForm() {
    const { createCampaign, refreshCampaigns } = useCampaigns();
    
    const handleSubmit = async (data: CreateCampaignInput) => {
        try {
            // This automatically invalidates the cache
            const newCampaign = await createCampaign(data);
            
            // Optionally refresh to show new campaign
            await refreshCampaigns();
            
            // Navigate to new campaign
            router.push(`/campaigns/${newCampaign._id}`);
        } catch (error) {
            console.error('Failed to create campaign:', error);
        }
    };
    
    return <form onSubmit={handleSubmit}>...</form>;
}
```

### Implementing Infinite Scroll

```typescript
import { useRef, useEffect, useCallback } from 'react';
import { useCampaigns } from '@/hooks/useCampaigns';

function CampaignListWithScroll() {
    const observerTarget = useRef<HTMLDivElement>(null);
    const { campaigns, loadMoreCampaigns, hasMore, loadingMore } = useCampaigns();
    
    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [target] = entries;
            if (target.isIntersecting && hasMore && !loadingMore) {
                loadMoreCampaigns();
            }
        },
        [hasMore, loadingMore, loadMoreCampaigns]
    );
    
    useEffect(() => {
        const element = observerTarget.current;
        if (!element) return;
        
        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '20px',
            threshold: 0,
        });
        
        observer.observe(element);
        
        return () => observer.unobserve(element);
    }, [handleObserver]);
    
    return (
        <div>
            {campaigns.map(campaign => (
                <CampaignCard key={campaign._id} campaign={campaign} />
            ))}
            
            {/* Intersection Observer target */}
            <div ref={observerTarget} className="h-1" />
            
            {loadingMore && <Loader />}
        </div>
    );
}
```

### Accessing Sidebar State in Other Components

```typescript
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
    selectOpenEnvironment,
    setOpenEnvironment,
} from '@/store/slices/sidebarSlice';

function MyComponent() {
    const dispatch = useAppDispatch();
    const isEnvironmentOpen = useAppSelector(selectOpenEnvironment);
    
    const toggleEnvironment = () => {
        dispatch(setOpenEnvironment(!isEnvironmentOpen));
    };
    
    return (
        <button onClick={toggleEnvironment}>
            Toggle Environment
        </button>
    );
}
```

### Switching Context Mode

```typescript
import { useAppDispatch } from '@/store/hooks';
import { setContextMode } from '@/store/slices/environmentSlice';
import { clearSelectedCampaign } from '@/store/slices/campaignContextSlice';

function ModeSwitch() {
    const dispatch = useAppDispatch();
    
    const switchToPlayer = () => {
        dispatch(setContextMode('player'));
        dispatch(clearSelectedCampaign());
        router.push('/');
    };
    
    const switchToGM = () => {
        dispatch(setContextMode('gm'));
        // Campaign selection will be handled by useCampaigns hook
    };
    
    return (
        <>
            <button onClick={switchToPlayer}>Player Mode</button>
            <button onClick={switchToGM}>GM Mode</button>
        </>
    );
}
```

---

## Best Practices

### 1. **Use Hooks for Data Access**

❌ **Don't** fetch data directly in components:

```typescript
// Bad
function MyComponent() {
    const [campaigns, setCampaigns] = useState([]);
    
    useEffect(() => {
        CampaignService.getCampaigns().then(setCampaigns);
    }, []);
}
```

✅ **Do** use the provided hooks:

```typescript
// Good
function MyComponent() {
    const { campaigns, loading } = useCampaigns();
}
```

### 2. **Respect Cache Behavior**

❌ **Don't** force unnecessary refetches:

```typescript
// Bad - refetches on every render
useEffect(() => {
    fetchCampaigns();
}, []);
```

✅ **Do** rely on auto-fetch with cache:

```typescript
// Good - uses cache if available
const { campaigns } = useCampaigns({ autoFetch: true });
```

### 3. **Invalidate Cache After Mutations**

❌ **Don't** forget to invalidate after updates:

```typescript
// Bad - cache becomes stale
const updateMyCampaign = async (id: string, data: any) => {
    await CampaignService.updateCampaign(id, data);
    // Cache is now stale!
};
```

✅ **Do** use the hook's mutation methods:

```typescript
// Good - automatically invalidates cache
const { updateCampaign } = useCampaigns();
await updateCampaign(id, data);
```

### 4. **Handle Loading and Error States**

✅ Always handle loading and error states:

```typescript
function MyComponent() {
    const { campaigns, loading, error } = useCampaigns();
    
    if (loading) return <Loader />;
    if (error) return <ErrorMessage error={error} />;
    if (campaigns.length === 0) return <EmptyState />;
    
    return <CampaignList campaigns={campaigns} />;
}
```

### 5. **Use Selectors for Derived State**

✅ Create reusable selectors:

```typescript
// In slice file
export const selectActiveCampaigns = (state: RootState) =>
    state.campaign.campaigns.filter(c => c.status === 'active');

// In component
const activeCampaigns = useAppSelector(selectActiveCampaigns);
```

### 6. **Optimize Re-renders**

✅ Use memoization for expensive computations:

```typescript
import { useMemo } from 'react';

function CampaignStats() {
    const { campaigns } = useCampaigns();
    
    const stats = useMemo(() => ({
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        archived: campaigns.filter(c => c.status === 'archived').length,
    }), [campaigns]);
    
    return <div>{stats.total} campaigns</div>;
}
```

### 7. **Clean Up on Unmount**

✅ Clean up subscriptions and observers:

```typescript
useEffect(() => {
    const observer = new IntersectionObserver(callback);
    observer.observe(element);
    
    // Clean up
    return () => observer.disconnect();
}, []);
```

---

## Common Patterns

### Pattern 1: Master-Detail Navigation

```typescript
// List page
function CampaignListPage() {
    const { campaigns } = useCampaigns();
    const dispatch = useAppDispatch();
    
    const selectCampaign = (id: string) => {
        dispatch(setSelectedCampaign(id));
        dispatch(setContextMode('gm'));
        router.push(`/campaigns/${id}`);
    };
    
    return (
        <div>
            {campaigns.map(campaign => (
                <button onClick={() => selectCampaign(campaign._id)}>
                    {campaign.label}
                </button>
            ))}
        </div>
    );
}

// Detail page
function CampaignDetailPage({ params }: { params: { id: string } }) {
    const { campaigns } = useCampaigns();
    const campaign = campaigns.find(c => c._id === params.id);
    
    // Campaign is already in cache from list page
    return <div>{campaign?.label}</div>;
}
```

### Pattern 2: Conditional Rendering Based on Mode

```typescript
function ContextAwareComponent() {
    const contextMode = useAppSelector(selectContextMode);
    
    if (contextMode === 'gm') {
        return <GMView />;
    }
    
    return <PlayerView />;
}
```

### Pattern 3: Optimistic UI Updates

```typescript
function ArchiveGroupButton({ groupId }: { groupId: string }) {
    const { updateCampaign } = useCampaigns();
    const campaign = useAppSelector(selectSelectedCampaign);
    const [isArchiving, setIsArchiving] = useState(false);
    
    const handleArchive = async () => {
        setIsArchiving(true);
        
        try {
            // Update campaign to move group from active to archived
            await updateCampaign(campaign._id, {
                groups: {
                    active: campaign.groups.active.filter(id => id !== groupId),
                    archived: [...campaign.groups.archived, groupId],
                },
            });
            
            toast.success('Group archived successfully');
        } catch (error) {
            toast.error('Failed to archive group');
        } finally {
            setIsArchiving(false);
        }
    };
    
    return (
        <button onClick={handleArchive} disabled={isArchiving}>
            {isArchiving ? 'Archiving...' : 'Archive'}
        </button>
    );
}
```

---

## Troubleshooting

### Issue: Data Not Loading

**Symptoms:** Component renders but data is empty.

**Solution:**
1. Check if `autoFetch` is enabled
2. Verify Redux DevTools to see if data is in state
3. Check browser console for API errors
4. Clear localStorage and refresh: `localStorage.clear()`

### Issue: Stale Cache

**Symptoms:** Old data showing after mutation.

**Solution:**
1. Use the hook's mutation methods (`createCampaign`, `updateCampaign`, etc.)
2. Manually call `refreshCampaigns()` or `refetch()`
3. Check if cache invalidation is working in Redux DevTools

### Issue: Infinite Scroll Not Loading

**Symptoms:** Scroll to bottom but no new data loads.

**Solution:**
1. Check if `hasMore` is `true`
2. Verify `loadingMore` is not stuck in `true` state
3. Check if Intersection Observer target is visible in DOM
4. Verify API is returning correct pagination data

### Issue: Redux Persist Hydration Error

**Symptoms:** State resets on page refresh.

**Solution:**
1. Check `persistConfig.whitelist` includes the slice
2. Verify localStorage is not disabled
3. Check browser console for persist errors
4. Try clearing localStorage and testing again

---

## API Reference

### Services

```typescript
// services/web/client/src/services/CampaignService.ts
class CampaignService {
    getCampaigns(params?: { page?: number; offset?: number; sort?: string; label?: string }): Promise<Campaign[]>
    createCampaign(data: CreateCampaignInput): Promise<Campaign>
    updateCampaign(id: string, data: UpdateCampaignInput): Promise<Campaign>
    deleteCampaign(id: string): Promise<void>
}

// services/web/client/src/services/GroupService.ts
class GroupService {
    getGroupsByCampaign(campaignId: string): Promise<Group[]>
    createGroup(data: CreateGroupInput): Promise<Group>
    updateGroup(id: string, data: UpdateGroupInput): Promise<Group>
    deleteGroup(id: string): Promise<void>
}

// services/web/client/src/services/CharacterService.ts
class CharacterService {
    getCharacterById(id: string): Promise<Character>
    getPlayersWithoutGroup(page: number, offset: number): Promise<PaginatedResponse<Character>>
    createCharacter(data: CreateCharacterInput): Promise<Character>
    updateCharacter(id: string, data: UpdateCharacterInput): Promise<Character>
    deleteCharacter(id: string): Promise<void>
}
```

---

## Additional Resources

- [React Redux Documentation](https://react-redux.js.org/)
- [Redux Persist Documentation](https://github.com/rt2zz/redux-persist)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [WCAG Keyboard Accessibility](https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible)

---

**Last Updated:** January 23, 2026  
**Version:** 1.0.0
