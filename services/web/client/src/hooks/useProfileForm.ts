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
import { makeZodMessages } from '@/lib/zodErrorMap';

// Type definition for profile form data
export type ProfileFormData = {
    firstName: string;
    lastName: string;
    email: string;
};

export function useProfileForm() {
    const { user, loading: isLoading } = useUser({ autoFetch: true });
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const toast = useToast();
    const t = useTranslations('ProfilePage.editProfile');
    const tZod = useTranslations('zodErrors');

    // Créer les messages Zod traduits
    const zm = makeZodMessages(tZod);

    // Zod schema with translated validation messages via zodErrorMap
    const profileSchema = useMemo(() => z.object({
        firstName: z.string({ message: zm.required() }).min(2, { message: zm.minString(2) }),
        lastName: z.string({ message: zm.required() }).min(2, { message: zm.minString(2) }),
        email: z.string({ message: zm.required() }).email({ message: zm.email() }),
    }), [zm]);

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

            setIsUpdating(false);
            toast.success(t('successMessage'));
        } catch (err) {
            // Check for specific error messages
            if (err instanceof Error) {
                // Email already in use
                if (err.message.includes('email') && (err.message.includes('already') || err.message.includes('use'))) {
                    // Set error on email field
                    form.setError('email', {
                        type: 'manual',
                        message: t('emailAlreadyInUse'),
                    });
                }
                // Network error
                else if (err.message.includes('Network') || err.message.includes('fetch')) {
                    toast.error(t('networkError'));
                }
                // Generic error
                else {
                    toast.error(t('errorMessage'));
                }
            } else {
                toast.error(t('errorMessage'));
            }
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
            setIsUpdating(false);
        }
    }, [user, form]);

    return {
        form,
        isLoading,
        isUpdating,
        setIsUpdating,
        onUpdate,
        onCancel,
    };
}
