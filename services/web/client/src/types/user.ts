export interface User {
    keycloakId: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
}

export interface UserState {
    user: User | null;
    loading: boolean;
    error: string | null;
    lastFetch: number | null;
}
