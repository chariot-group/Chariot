const STORAGE_KEY = 'chariot_redux_state';

/**
 * List of state keys to persist in localStorage
 * Only persisting UI state, not data (campaigns, groups, etc.)
 */
const PERSISTED_KEYS = [
    'environment',      // contextMode (player/GM)
    'campaignContext',  // selectedCampaignId
    'sidebar',          // openEnvironment, openActiveGroups, openArchivedGroups
    'group',            // openGroupId
] as const;

/**
 * Load persisted state from localStorage
 */
export const loadState = (): Record<string, any> | undefined => {
    try {
        if (typeof window === 'undefined') return undefined;

        const serializedState = localStorage.getItem(STORAGE_KEY);
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch (err) {
        console.error('Failed to load state from localStorage:', err);
        return undefined;
    }
};

/**
 * Save state to localStorage
 */
export const saveStateToLocalStorage = (state: any) => {
    try {
        if (typeof window === 'undefined') return;

        // Only persist specific keys
        const stateToPersist: Record<string, unknown> = {};
        PERSISTED_KEYS.forEach((key) => {
            if (state[key]) {
                stateToPersist[key] = state[key];
            }
        });

        const serializedState = JSON.stringify(stateToPersist);
        localStorage.setItem(STORAGE_KEY, serializedState);
    } catch (err) {
        console.error('Failed to save state to localStorage:', err);
    }
};
