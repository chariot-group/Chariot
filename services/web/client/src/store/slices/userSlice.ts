import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { User, UserState } from '@/types/user';

const initialState: UserState = {
    user: null,
    loading: false,
    error: null,
    lastFetch: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        fetchUserStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchUserSuccess: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.loading = false;
            state.error = null;
            state.lastFetch = Date.now();
        },
        fetchUserFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        clearUser: (state) => {
            state.user = null;
            state.error = null;
            state.lastFetch = null;
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
    },
});

// Export actions
export const {
    fetchUserStart,
    fetchUserSuccess,
    fetchUserFailure,
    clearUser,
    updateUser,
} = userSlice.actions;

// Selectors
export const selectUser = (state: RootState) => state.user.user;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

// Export reducer
export default userSlice.reducer;
