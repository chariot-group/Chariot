/**
 * Helpers pour créer des validations Zod avec messages traduits
 * 
 * Ce fichier fournit des helpers pour ajouter facilement des messages d'erreur
 * traduits aux validations Zod courantes via next-intl.
 * 
 */
type TranslationFunction = (key: string, values?: Record<string, unknown>) => string;

export function makeZodMessages(t: TranslationFunction) {
    return {
        /**
         * Message pour un champ requis
         */
        required: () => t('required'),

        /**
         * Message pour type invalide
         */
        invalidType: () => t('invalidTypeReceived'),

        /**
         * Message pour .min() sur une string
         */
        minString: (min: number) => t('tooSmall.string.inclusive', { minimum: min }),

        /**
         * Message pour .max() sur une string
         */
        maxString: (max: number) => t('tooBig.string.inclusive', { maximum: max }),

        /**
         * Message pour .min() sur un number
         */
        minNumber: (min: number) => t('tooSmall.number.inclusive', { minimum: min }),

        /**
         * Message pour .max() sur un number
         */
        maxNumber: (max: number) => t('tooBig.number.inclusive', { maximum: max }),

        /**
         * Message pour .email()
         */
        email: () => t('invalidString.email'),

        /**
         * Message pour .url()
         */
        url: () => t('invalidString.url'),

        /**
         * Message pour .uuid()
         */
        uuid: () => t('invalidString.uuid'),

        /**
         * Message pour .min() sur un array
         */
        minArray: (min: number) => t('tooSmall.array.inclusive', { minimum: min }),

        /**
         * Message pour .max() sur un array
         */
        maxArray: (max: number) => t('tooBig.array.inclusive', { maximum: max }),

        /**
         * Message pour .multipleOf()
         */
        notMultipleOf: (multipleOf: number) => t('notMultipleOf', { multipleOf }),
    };
}