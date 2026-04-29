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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsInSession } from '@/store/slices/sessionSlice';
import { upsertCharacterWithoutGroup } from '@/store/slices/characterSlice';
import { upsertCharacterInGroups } from '@/store/slices/groupSlice';

/**
 * Type de personnage supporté
 */
export type CharacterType = 'players' | 'npcs';

/**
 * Props du hook useCharacterForm
 */
interface UseCharacterFormProps<TFormValues extends FieldValues = FieldValues> {
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
export interface UseCharacterFormReturn<TFormValues extends FieldValues = FieldValues> {
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
    /** Indicateur de mode édition */
    isEditing: boolean;
    /** Setter du mode édition */
    setIsEditing: (value: boolean) => void;
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
export function useCharacterForm<TFormValues extends FieldValues = FieldValues>({
    characterId,
    type,
    defaultValues = {} as Partial<TFormValues>,
    onSuccess,
}: UseCharacterFormProps<TFormValues>): UseCharacterFormReturn<TFormValues> {
    // États
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);


    // Hooks
    const { character, loading: isLoading, error, refetch } = useCharacter(characterId);
    const toast = useToast();
    const dispatch = useAppDispatch();
    const isInSession = useAppSelector(selectIsInSession);
    const t = useTranslations('characterForm');
    const tZod = useTranslations('zodErrors');

    // Créer les messages Zod traduits
    const zm = makeZodMessages(tZod);

    // Déduction automatique du schéma selon le type si non fourni
    const resolvedSchema = (type === 'players' ? createPlayerSchema(zm) : createNpcSchema(zm)) as z.ZodType<TFormValues>;

    // Initialisation du formulaire avec react-hook-form et zodResolver
    const form = useForm<TFormValues>({
        resolver: zodResolver(resolvedSchema),
        defaultValues: defaultValues as TFormValues,
        mode: 'onChange',
        shouldUnregister: false, // 🐛 FIX: Conserve les valeurs des champs même quand ils sont démontés
    });

    // Normalise les clés numériques de spellSlotsByUses en "k{n}" pour éviter
    // que react-hook-form les interprète comme des indices de tableau.
    const normalizeSpellSlots = (data: unknown): unknown => {
        if (typeof data !== 'object' || data === null || !('spellcasting' in data)) {
            return data;
        }

        const source = data as { spellcasting?: unknown };
        if (!Array.isArray(source.spellcasting)) {
            return data;
        }

        return {
            ...(data as Record<string, unknown>),
            spellcasting: source.spellcasting.map((sc) => {
                if (typeof sc !== 'object' || sc === null || !('spellSlotsByUses' in sc)) {
                    return sc;
                }

                const slots = (sc as { spellSlotsByUses?: unknown }).spellSlotsByUses;
                if (typeof slots !== 'object' || slots === null || Array.isArray(slots)) {
                    return sc;
                }

                const normalized: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(slots as Record<string, unknown>)) {
                    normalized[/^\d+$/.test(k) ? `k${k}` : k] = v;
                }

                return { ...(sc as Record<string, unknown>), spellSlotsByUses: normalized };
            }),
        };
    };

    // Chargement des données existantes
    useEffect(() => {
        if (character && characterId) {
            form.reset(normalizeSpellSlots(character) as TFormValues);
        }
    }, [character, characterId, form]);

    /**
     * Fonction de création d'un nouveau personnage
     */
    const onCreate = async (data: TFormValues): Promise<void> => {
        console.log('Creating character with data:');
        form.clearErrors();
        const isValid = await form.trigger(undefined, { shouldFocus: true });
        if (!isValid) {
            toast.error(t('createError'));
            return;
        }

        try {
            setIsSaving(true);
            setSuccess(false);

            const sanitizedData = { ...data } as TFormValues & { groups?: unknown[] };
            if (sanitizedData.groups && Array.isArray(sanitizedData.groups)) {
                sanitizedData.groups = sanitizedData.groups.map((group) =>
                    typeof group === 'object' && group !== null && '_id' in group
                        ? (group as { _id: string })._id
                        : group
                );
            }

            if (type === 'players' && !isInSession) {
                delete (sanitizedData as Record<string, unknown>).exhaustionLevel;
            }

            // Transformer les données avec le schéma Zod (convertit les strings numériques en numbers)
            const parsedData = await resolvedSchema.parseAsync(sanitizedData);

            const createdCharacter = await CharacterService.createCharacter(type, parsedData);

            toast.success(t('createSuccess'));
            setSuccess(true);
            setIsEditing(false);

            if (onSuccess) {
                onSuccess(createdCharacter);
            }

            // Réinitialiser le formulaire avec les données créées
            form.reset(createdCharacter as TFormValues);
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

            // Valider le formulaire avant de poursuivre (tous les champs)
            form.clearErrors();
            const isValid = await form.trigger(undefined, { shouldFocus: true });
            if (!isValid) {
                toast.error(t('updateError'));
                setIsSaving(false);
                return;
            }

            // Transformer les groups en tableau d'IDs si nécessaire
            const sanitizedData = { ...data } as TFormValues & { groups?: unknown[] };
            if (sanitizedData.groups && Array.isArray(sanitizedData.groups)) {
                sanitizedData.groups = sanitizedData.groups.map((group) =>
                    typeof group === 'object' && group !== null && '_id' in group
                        ? (group as { _id: string })._id
                        : group
                );
            }

            if (type === 'players' && !isInSession) {
                delete (sanitizedData as Record<string, unknown>).exhaustionLevel;
            }

            // Transformer les données avec le schéma Zod (convertit les strings numériques en numbers)
            const parsedData = await resolvedSchema.parseAsync(sanitizedData);

            const updatedCharacter = await CharacterService.updateCharacter(
                type,
                characterId,
                parsedData
            );

            const updatedCharacterWithUserId = updatedCharacter as Player | NPC | (Player | NPC & { userId?: string });
            const userId = 'userId' in updatedCharacterWithUserId ? updatedCharacterWithUserId.userId : undefined;

            // Keep sidebar lists synchronized after update (name/group display).
            dispatch(upsertCharacterWithoutGroup(updatedCharacter));
            dispatch(upsertCharacterInGroups({
                _id: updatedCharacter._id,
                firstname: updatedCharacter.firstname,
                lastname: updatedCharacter.lastname,
                surname: updatedCharacter.surname,
                userId,
            }));

            toast.success(t('updateSuccess'));
            setSuccess(true);
            setIsEditing(false);

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
            form.reset(character as TFormValues);
            toast.info(t('changesCancelled'));
        } else {
            form.reset(defaultValues as TFormValues);
            toast.info(t('changesCancelled'));
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
        isEditing,
        setIsEditing,
    };
}
