export interface User {
    keycloakId: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    balance: number;
    history: History[];
}

export interface History {
    date: Date;
    campaignName: string;
    value: number;
}

export interface UserState {
    user: User | null;
    loading: boolean;
    error: string | null;
    lastFetch: number | null;
}

export interface PasswordChangeDto {
    currentPassword: string;
    newPassword: string;
}
