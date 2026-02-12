import { useEffect, useState } from 'react';
import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useCharacter } from '@/hooks/useCharacter';
import { useToast } from '@/hooks/useToast';
import CharacterService from '@/services/CharacterService';
import { Player, NPC } from '@/types/character';
import { createPlayerSchema, createNpcSchema } from '@/schemas/character';
import { makeZodMessages } from '@/lib/zodErrorMap';

/**
 * Type de personnage supporté
 */
export type CharacterType = 'players' | 'npcs';

/**
 * Props du hook useCharacterForm
 */
interface UseCharacterFormProps<TFormValues extends FieldValues = any> {
    /** ID du personnage (null pour création) */
    characterId: string | null;
    /** Type de personnage (players ou npcs) */
    type: CharacterType;
    /** Valeurs par défaut pour la création */
    defaultValues?: Partial<TFormValues>;
    /** Callback après succès de sauvegarde */
    onSuccess?: (data: Player | NPC) => void;
}

/**
 * Retour du hook useCharacterForm
 */
interface UseCharacterFormReturn<TFormValues extends FieldValues = any> {
    /** Instance react-hook-form */
    form: UseFormReturn<TFormValues>;
    /** État de chargement initial */
    isLoading: boolean;
    /** État de sauvegarde */
    isSaving: boolean;
    /** Erreur de chargement */
    error: string | null;
    /** Indicateur de succès */
    success: boolean;
    /** Fonction de mise à jour */
    onUpdate: (data: TFormValues) => Promise<void>;
    /** Fonction de création */
    onCreate: (data: TFormValues) => Promise<void>;
    /** Fonction d'annulation (reset) */
    onCancel: () => void;
    /** Fonction de soumission (détecte automatiquement create/update) */
    onSubmit: (data: TFormValues) => Promise<void>;
}

/**
 * Hook personnalisé générique pour gérer l'édition des personnages
 * 
 * Centralise la logique commune à tous les onglets de formulaire (General, Combat, Magic, Inventory, History).
 * 
 * ⚠️ IMPORTANT : Ce hook doit être appelé UNE SEULE FOIS au niveau du composant parent
 * qui gère les onglets. L'instance `form` retournée doit être PARTAGÉE entre tous les onglets
 * via props. Ne PAS appeler ce hook dans chaque onglet séparément.
 * 
 * Les modifications faites dans différents onglets s'accumulent dans le formulaire unique.
 * La validation et la soumission concernent le formulaire COMPLET, pas par section.
 * 
 * @example
 * // ✅ CORRECT : Appel unique au niveau parent (schéma déduit automatiquement)
 * function CharacterPage({ characterId }) {
 *   const { form, onSubmit } = useCharacterForm({
 *     characterId: characterId,
 *     type: 'players', // Le schéma CreatePlayerSchema est déduit automatiquement
 *   });
 * 
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       {activeTab === 'general' && <GeneralTab form={form} />}
 *       {activeTab === 'combat' && <CombatTab form={form} />}
 *       <button type="submit">Save All Changes</button>
 *     </form>
 *   );
 * }
 * 
 * @example
 * // ✅ AVEC schéma custom (optionnel, pour validation spécifique)
 * const CustomSchema = CreatePlayerSchema.pick({ firstname: true, lastname: true });
 * const { form } = useCharacterForm({
 *   characterId: '123',
 *   type: 'players',
 *   schema: CustomSchema, // Surcharge le schéma par défaut
 * });
 * 
 * @example
 * // ❌ INCORRECT : Ne PAS appeler dans chaque onglet
 * function GeneralTab() {
 *   const { form } = useCharacterForm(...); // ❌ Crée un formulaire séparé
 *   // Les modifications seront perdues au changement d'onglet
 * }
 * 
 * @template TFormValues - Type des valeurs du formulaire
 * @param props - Configuration du hook
 * @returns Objet contenant les états et fonctions de gestion du formulaire
 */
export function useCharacterForm<TFormValues extends FieldValues = any>({
    characterId,
    type,
    defaultValues = {} as Partial<TFormValues>,
    onSuccess,
}: UseCharacterFormProps<TFormValues>): UseCharacterFormReturn<TFormValues> {
    // États
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Hooks
    const { character, loading: isLoading, error, refetch } = useCharacter(characterId);
    const toast = useToast();
    const t = useTranslations('characterForm');
    const tZod = useTranslations('zodErrors');

    // Créer les messages Zod traduits
    const zm = makeZodMessages(tZod);

    // Déduction automatique du schéma selon le type si non fourni
    const resolvedSchema = (type === 'players' ? createPlayerSchema(zm) : createNpcSchema(zm));

    // Initialisation du formulaire avec react-hook-form et zodResolver
    const form = useForm<TFormValues>({
        resolver: zodResolver(resolvedSchema as any),
        defaultValues: defaultValues as any,
        mode: 'onChange',
    });

    // Chargement des données existantes
    useEffect(() => {
        if (character && characterId) {
            form.reset(character as any);
        }
    }, [character, characterId, form]);

    /**
     * Fonction de création d'un nouveau personnage
     */
    const onCreate = async (data: TFormValues): Promise<void> => {
        try {
            setIsSaving(true);
            setSuccess(false);

            console.log('🔍 [useCharacterForm] Données AVANT envoi à l\'API:', JSON.stringify(data, null, 2));

            const createdCharacter = await CharacterService.createCharacter(type, data as any);

            toast.success(t('createSuccess'));
            setSuccess(true);

            if (onSuccess) {
                onSuccess(createdCharacter);
            }

            // Réinitialiser le formulaire avec les données créées
            form.reset(createdCharacter as any);
        } catch (err) {
            console.error('Error creating character:', err);
            const errorMessage = err instanceof Error ? err.message : t('createError');
            toast.error(errorMessage);
            setSuccess(false);
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Fonction de mise à jour d'un personnage existant
     */
    const onUpdate = async (data: TFormValues): Promise<void> => {
        if (!characterId) {
            toast.error(t('missingId'));
            return;
        }

        try {
            setIsSaving(true);
            setSuccess(false);

            const updatedCharacter = await CharacterService.updateCharacter(
                type,
                characterId,
                data as any
            );

            toast.success(t('updateSuccess'));
            setSuccess(true);

            if (onSuccess) {
                onSuccess(updatedCharacter);
            }

            // Rafraîchir les données
            await refetch();
        } catch (err) {
            console.error('Error updating character:', err);
            const errorMessage = err instanceof Error ? err.message : t('updateError');
            toast.error(errorMessage);
            setSuccess(false);
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Fonction d'annulation - réinitialise le formulaire
     */
    const onCancel = (): void => {
        if (character && characterId) {
            form.reset(character as any);
            toast.info(t('changesCancelled'));
        } else {
            form.reset(defaultValues as any);
        }
        setSuccess(false);
    };

    /**
     * Fonction de soumission automatique (détecte create vs update)
     */
    const onSubmit = async (data: TFormValues): Promise<void> => {
        if (characterId) {
            await onUpdate(data);
        } else {
            await onCreate(data);
        }
    };

    return {
        form,
        isLoading,
        isSaving,
        error,
        success,
        onUpdate,
        onCreate,
        onCancel,
        onSubmit,
    };
}
