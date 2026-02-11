import { useCallback, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import UserService from '@/services/UserService';
import { useToast } from '@/hooks/useToast';
import { useTranslations } from 'next-intl';
import { PasswordChangeDto } from '@/types/user';

// Type definition for password form data
type PasswordFormData = {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
};

/**
 * Custom hook for password change form management
 * Handles validation, API calls, and user feedback
 * @see FR-009: User Password Change
 * @returns Form state, functions, and form instance
 */
export function usePasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const toast = useToast();
    const t = useTranslations('ProfilePage.changePassword');

    // Zod schema with translated validation messages
    const passwordSchema = useMemo(() => z.object({
        currentPassword: z.string().min(1, { message: t('validation.currentPasswordRequired') }),
        newPassword: z.string().min(8, { message: t('validation.newPasswordMin') }),
        confirmNewPassword: z.string().min(1, { message: t('validation.confirmPasswordRequired') }),
    }).refine((data) => data.newPassword === data.confirmNewPassword, {
        message: t('validation.passwordMismatch'),
        path: ['confirmNewPassword'],
    }), [t]);

    const form = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        },
    });

    /**
     * Handles form submission and password change
     */
    const onSubmit = useCallback(async (data: PasswordFormData) => {
        try {
            setIsLoading(true);
            setError(null);
            setSuccess(false);

            const passwordData: PasswordChangeDto = {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            };

            await UserService.changePassword(passwordData);

            // Reset form after success
            form.reset({
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            });

            setSuccess(true);
            toast.success(t('successMessage'));

            // Reset success state after 3 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            let errorMessage = t('errorMessage');

            // Handle specific error types
            if (err instanceof Error) {
                if (err.message.includes('incorrect')) {
                    errorMessage = t('incorrectPassword');
                } else if (err.message.includes('complexity')) {
                    errorMessage = t('complexityError');
                } else if (err.message.includes('Network') || err.message.includes('fetch')) {
                    errorMessage = t('networkError');
                }
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [form, toast, t]);

    /**
     * Resets form to initial empty state
     */
    const onReset = useCallback(() => {
        form.reset({
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        });
        setError(null);
        setSuccess(false);
    }, [form]);

    return {
        form,
        onSubmit,
        onReset,
        isLoading,
        error,
        success,
    };
}
