import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { Character } from '@/types/character';

interface CharacterState {
    // Characters without group
    charactersWithoutGroup: Character[];
    loadingWithoutGroup: boolean;
    loadingMoreWithoutGroup: boolean;
    errorWithoutGroup: string | null;
    lastFetchWithoutGroup: number | null;
    currentPageWithoutGroup: number;
    hasMoreWithoutGroup: boolean;
    totalWithoutGroup: number;

    // All characters
    allCharacters: Character[];
    loadingAll: boolean;
    errorAll: string | null;
    lastFetchAll: number | null;
}

const initialState: CharacterState = {
    charactersWithoutGroup: [],
    loadingWithoutGroup: false,
    loadingMoreWithoutGroup: false,
    errorWithoutGroup: null,
    lastFetchWithoutGroup: null,
    currentPageWithoutGroup: 1,
    hasMoreWithoutGroup: true,
    totalWithoutGroup: 0,

    allCharacters: [],
    loadingAll: false,
    errorAll: null,
    lastFetchAll: null,
};

const characterSlice = createSlice({
    name: 'character',
    initialState,
    reducers: {
        // Characters without group - initial fetch
        fetchCharactersWithoutGroupStart: (state) => {
            state.loadingWithoutGroup = true;
            state.errorWithoutGroup = null;
        },
        fetchCharactersWithoutGroupSuccess: (state, action: PayloadAction<{ characters: Character[]; total: number }>) => {
            state.charactersWithoutGroup = action.payload.characters;
            state.totalWithoutGroup = action.payload.total;
            state.hasMoreWithoutGroup = action.payload.characters.length < action.payload.total;
            state.loadingWithoutGroup = false;
            state.errorWithoutGroup = null;
            state.lastFetchWithoutGroup = Date.now();
            state.currentPageWithoutGroup = 1;
        },

        // Characters without group - load more (pagination)
        loadMoreCharactersWithoutGroupStart: (state) => {
            state.loadingMoreWithoutGroup = true;
            state.errorWithoutGroup = null;
        },
        loadMoreCharactersWithoutGroupSuccess: (state, action: PayloadAction<{ characters: Character[]; total: number }>) => {
            state.charactersWithoutGroup = [...state.charactersWithoutGroup, ...action.payload.characters];
            state.totalWithoutGroup = action.payload.total;
            state.hasMoreWithoutGroup = state.charactersWithoutGroup.length < action.payload.total;
            state.loadingMoreWithoutGroup = false;
            state.errorWithoutGroup = null;
            state.currentPageWithoutGroup += 1;
        },
        fetchCharactersWithoutGroupFailure: (state, action: PayloadAction<string>) => {
            state.loadingWithoutGroup = false;
            state.loadingMoreWithoutGroup = false;
            state.errorWithoutGroup = action.payload;
        },

        upsertCharacterWithoutGroup: (state, action: PayloadAction<Character>) => {
            const character = action.payload;
            const hasGroups = Array.isArray(character.groups) && character.groups.length > 0;
            const existingIndex = state.charactersWithoutGroup.findIndex((item) => item._id === character._id);

            if (hasGroups) {
                if (existingIndex !== -1) {
                    state.charactersWithoutGroup.splice(existingIndex, 1);
                    state.totalWithoutGroup = Math.max(0, state.totalWithoutGroup - 1);
                }
            } else if (existingIndex !== -1) {
                state.charactersWithoutGroup[existingIndex] = character;
            } else {
                state.charactersWithoutGroup.unshift(character);
                state.totalWithoutGroup += 1;
            }

            state.hasMoreWithoutGroup = state.charactersWithoutGroup.length < state.totalWithoutGroup;
        },

        // All characters
        fetchAllCharactersStart: (state) => {
            state.loadingAll = true;
            state.errorAll = null;
        },
        fetchAllCharactersSuccess: (state, action: PayloadAction<Character[]>) => {
            state.allCharacters = action.payload;
            state.loadingAll = false;
            state.errorAll = null;
            state.lastFetchAll = Date.now();
        },
        fetchAllCharactersFailure: (state, action: PayloadAction<string>) => {
            state.loadingAll = false;
            state.errorAll = action.payload;
        },

        // Clear and invalidate
        clearCharacters: (state) => {
            state.charactersWithoutGroup = [];
            state.lastFetchWithoutGroup = null;
            state.errorWithoutGroup = null;
            state.currentPageWithoutGroup = 1;
            state.hasMoreWithoutGroup = true;
            state.totalWithoutGroup = 0;

            state.allCharacters = [];
            state.lastFetchAll = null;
            state.errorAll = null;
        },
        invalidateCharacterCache: (state) => {
            state.lastFetchWithoutGroup = null;
            state.lastFetchAll = null;
        },
    },
});

export const {
    fetchCharactersWithoutGroupStart,
    fetchCharactersWithoutGroupSuccess,
    loadMoreCharactersWithoutGroupStart,
    loadMoreCharactersWithoutGroupSuccess,
    fetchCharactersWithoutGroupFailure,
    fetchAllCharactersStart,
    fetchAllCharactersSuccess,
    fetchAllCharactersFailure,
    upsertCharacterWithoutGroup,
    clearCharacters,
    invalidateCharacterCache,
} = characterSlice.actions;

// Selectors - Characters without group
export const selectCharactersWithoutGroup = (state: RootState) => state.character.charactersWithoutGroup;
export const selectCharactersWithoutGroupLoading = (state: RootState) => state.character.loadingWithoutGroup;
export const selectCharactersWithoutGroupLoadingMore = (state: RootState) => state.character.loadingMoreWithoutGroup;
export const selectCharactersWithoutGroupError = (state: RootState) => state.character.errorWithoutGroup;
export const selectCharactersWithoutGroupHasMore = (state: RootState) => state.character.hasMoreWithoutGroup;
export const selectCharactersWithoutGroupTotal = (state: RootState) => state.character.totalWithoutGroup;
export const selectCharactersWithoutGroupCurrentPage = (state: RootState) => state.character.currentPageWithoutGroup;

// Selectors - All characters
export const selectAllCharacters = (state: RootState) => state.character.allCharacters;
export const selectAllCharactersLoading = (state: RootState) => state.character.loadingAll;
export const selectAllCharactersError = (state: RootState) => state.character.errorAll;

export default characterSlice.reducer;
