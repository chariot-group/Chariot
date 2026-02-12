import { useCallback, useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/hooks/useUser';
import UserService from '@/services/UserService';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/userSlice';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';
import { UpdateUserDto } from '@/types/user';

// Type definition for profile form data
export type ProfileFormData = {
    firstName: string;
    lastName: string;
    email: string;
};

export function useProfileForm() {
    const { user, loading: isLoading } = useUser({ autoFetch: true });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const dispatch = useAppDispatch();
    const toast = useToast();
    const t = useTranslations('ProfilePage.editProfile');

    // Zod schema with translated validation messages
    const profileSchema = useMemo(() => z.object({
        firstName: z.string().min(2, { message: t('validation.firstNameMin') }),
        lastName: z.string().min(2, { message: t('validation.lastNameMin') }),
        email: z.string().email({ message: t('validation.emailInvalid') }),
    }), [t]);

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
        },
    });

    // Reset form when user data is loaded
    useEffect(() => {
        if (user) {
            form.reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
            });
        }
    }, [user, form]);

    /**
     * Handles form submission and updates user profile
     */
    const onUpdate = useCallback(async (data: ProfileFormData) => {
        try {
            setIsSaving(true);
            setError(null);
            setSuccess(false);

            const updateData: UpdateUserDto = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
            };

            const updatedUser = await UserService.updateCurrentUser(updateData);

            // Update Redux store with new user data
            dispatch(updateUser(updatedUser));

            // Reset form with new values
            form.reset({
                firstName: updatedUser.firstName || '',
                lastName: updatedUser.lastName || '',
                email: updatedUser.email || '',
            });

            setSuccess(true);
            toast.success(t('successMessage'));

            // Reset success state after 3 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errorMessage');
            setError(errorMessage);

            // Check if it's a network error
            if (err instanceof Error && (err.message.includes('Network') || err.message.includes('fetch'))) {
                toast.error(t('networkError'));
            } else {
                toast.error(t('errorMessage'));
            }
        } finally {
            setIsSaving(false);
        }
    }, [dispatch, form, toast, t]);

    /**
     * Resets form to initial values (last loaded user data)
     */
    const onCancel = useCallback(() => {
        if (user) {
            form.reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
            });
            setError(null);
            setSuccess(false);
        }
    }, [user, form]);

    return {
        form,
        isLoading,
        isSaving,
        error,
        success,
        onUpdate,
        onCancel,
    };
}
