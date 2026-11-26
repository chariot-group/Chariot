export interface User {
    keycloakId: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    balance: number;
    history: History[];
    preferredLocale?: 'fr' | 'en' | 'es';
    preferredMeasurementUnit?: 'metric' | 'imperial';
    showBothUnits?: boolean;
    /** Account gate conditions computed by the API (FR-user-profile-keycloak). */
    accountStatus?: AccountStatus;
}

export type PersonNameField = 'firstName' | 'lastName';

export interface AccountStatus {
    /** Name fields that violate the person name rules and block the account. */
    invalidFields: PersonNameField[];
}

export interface History {
    date: Date;
    campaignName: string;
    value: number;
}

export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    preferredLocale?: 'fr' | 'en' | 'es';
    preferredMeasurementUnit?: 'metric' | 'imperial';
    showBothUnits?: boolean;
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
