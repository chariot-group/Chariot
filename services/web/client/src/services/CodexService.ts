import axios, { AxiosInstance } from 'axios';
import { spellClassApiValue } from '@/constants/spellClasses';
import { Spell, NPC, Action, ActionUsageType } from '@/types/character';

export interface CodexSpellTranslation {
    name: string;
    level: number;
    school: string;
    description: string;
    components: string[];
    castingTime: string;
    duration: string;
    range: string;
    effectType: number; // 0 = attack, 1 = heal, 2 = utility
    damage: string | null;
    srd: boolean;
    usesPerDay: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface CodexSpellItem {
    _id: string;
    tag: number;
    languages: string[];
    classes: string[];
    translations: {
        [key: string]: CodexSpellTranslation;
    };
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface CodexSpellResponse {
    message: string;
    data: CodexSpellItem[];
    pagination: {
        page: number;
        offset: number;
        totalItems: number;
    };
}

export interface CodexMonsterTranslation {
    firstname: string;
    lastname: string;
    surname: string;
    avatar: string;
    stats: {
        size: string;
        maxHitPoints: number;
        currentHitPoints: number;
        tempHitPoints: number;
        initiative: number;
        armorClass: number;
        passivePerception: number;
        speed: {
            walk: number;
            fly?: number;
            swim?: number;
            climb?: number;
            burrow?: number;
        };
        languages: string[];
        abilityScores: {
            strength: number;
            dexterity: number;
            constitution: number;
            intelligence: number;
            wisdom: number;
            charisma: number;
        };
        savingThrows: {
            strength: number;
            dexterity: number;
            constitution: number;
            intelligence: number;
            wisdom: number;
            charisma: number;
        };
        skills: {
            athletics: number;
            acrobatics: number;
            sleightHand: number;
            stealth: number;
            arcana: number;
            history: number;
            investigation: number;
            nature: number;
            religion: number;
            animalHandling: number;
            insight: number;
            medicine: number;
            perception: number;
            survival: number;
            deception: number;
            intimidation: number;
            performance: number;
            persuasion: number;
        };
        senses: Array<{ type: string; value: string }>;
    };
    affinities: {
        resistances: string[];
        immunities: string[];
        vulnerabilities: string[];
    };
    abilities: Array<{ name: string; description: string }>;
    spellcasting: Array<{
        className?: string;
        ability?: string;
        saveDC?: number;
        attackBonus?: number;
        spellSlotsByLevel?: Array<{
            level: number;
            count: {
                total: number;
                used: number;
            };
        }> | Record<string, { total: number; used: number }>;
        spellSlotsByUses?: Record<string, number | null>;
        isInnate?: boolean;
        totalSlots?: number;
        spells?: Array<
            | string          // ID brut (findall)
            | CodexSpellItem  // Objet peuplé (après fetch)
            | { name?: string; level?: number; school?: string; description?: string; components?: string[]; castingTime?: string; duration?: string; range?: string; effectType?: 'attack' | 'heal' | 'utility'; damage?: string; healing?: string; _id?: string } // forme aplatie
        >;
    }>;
    actions: {
        standard: Array<{
            name: string;
            type: string;
            description?: string;
            attackBonus?: number;
            damage: Array<{ dice: string; type: string }>;
            range?: string;
            dc?: { dcType: string; dcValue: number; successType: string };
        }>;
        legendary: Array<{
            name: string;
            type: string;
            description?: string;
            damage: Array<{ dice: string; type: string }>;
            dc?: { dcType: string; dcValue: number; successType: string };
            cost: number;
        }>;
        lair: Array<{
            name: string;
            type: string;
            description?: string;
            damage: Array<{ dice: string; type: string }>;
        }>;
    };
    challenge: {
        challengeRating: number;
        experiencePoints: number;
    };
    profile: {
        type: string;
        alignment: string;
        subtype: string;
    };
    hitPointsRoll?: string;
    srd: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CodexMonsterItem {
    _id: string;
    tag: number;
    languages: string[];
    translations: {
        [key: string]: CodexMonsterTranslation;
    };
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface CodexMonsterResponse {
    message: string;
    data: CodexMonsterItem[];
    pagination: {
        page: number;
        offset: number;
        totalItems: number;
    };
}

class CodexService {
    private client: AxiosInstance;

    private normalizeAlignment(alignment?: string): NPC["profile"]["alignment"] {
        if (!alignment) return 'True Neutral';

        const normalized = alignment
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        const normalizedLower = alignment.trim().toLowerCase();

        if (normalizedLower === 'any non-good alignment') return 'Any Evil Alignment';
        if (normalizedLower === 'any non-evil alignment') return 'Any Good Alignment';
        if (normalizedLower === 'any non-lawful alignment') return 'Any Chaotic Alignment';
        if (normalizedLower === 'any non-chaotic alignment') return 'Any Lawful Alignment';

        const validAlignments: NPC["profile"]["alignment"][] = [
            'Lawful Good',
            'Neutral Good',
            'Chaotic Good',
            'Lawful Neutral',
            'True Neutral',
            'Chaotic Neutral',
            'Lawful Evil',
            'Neutral Evil',
            'Chaotic Evil',
            'Unaligned',
            'Any Good Alignment',
            'Any Evil Alignment',
            'Any Lawful Alignment',
            'Any Chaotic Alignment',
        ];

        if (validAlignments.includes(normalized as NPC["profile"]["alignment"])) {
            return normalized as NPC["profile"]["alignment"];
        }

        return 'Unaligned';
    }

    /**
     * Usage / ability issus du Codex peuvent être absents, null, ou hors format Chariot.
     * On filtre les entrées null et on ne garde que des enums valides pour le formulaire.
     */
    private parseNpcUsageType(raw: unknown): ActionUsageType {
        if (raw === undefined || raw === null || raw === '') {
            return 'action';
        }
        const slug = String(raw)
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, '_');
        if (slug === 'action' || slug === 'bonus_action' || slug === 'reaction') {
            return slug;
        }
        return 'action';
    }

    private parseNpcAttackAbility(raw: unknown): NonNullable<Action['attackAbility']> | undefined {
        if (raw === undefined || raw === null || raw === '') {
            return undefined;
        }
        const key = String(raw).trim().toLowerCase().replace(/\s+/g, '');
        const map: Record<string, NonNullable<Action['attackAbility']>> = {
            str: 'strength',
            strength: 'strength',
            dex: 'dexterity',
            dexterity: 'dexterity',
            con: 'constitution',
            constitution: 'constitution',
            int: 'intelligence',
            intelligence: 'intelligence',
            wis: 'wisdom',
            wisdom: 'wisdom',
            cha: 'charisma',
            charisma: 'charisma',
        };
        return map[key];
    }

    private normalizeNpcDifficultyClass(raw: unknown): Action['dc'] | undefined {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
        const o = raw as Record<string, unknown>;
        let dcValue: number | undefined;
        const dvRaw = o.dcValue;
        if (typeof dvRaw === 'number' && !Number.isNaN(dvRaw)) {
            dcValue = Math.floor(dvRaw);
        } else if (typeof dvRaw === 'string' && dvRaw.trim() !== '') {
            const n = Number(dvRaw);
            if (!Number.isNaN(n)) dcValue = Math.floor(n);
        }
        const dcType = typeof o.dcType === 'string' ? o.dcType : undefined;
        const successType = typeof o.successType === 'string' ? o.successType : undefined;
        const out: NonNullable<Action['dc']> = {};
        if (dcType !== undefined) out.dcType = dcType;
        if (successType !== undefined) out.successType = successType;
        if (dcValue !== undefined) out.dcValue = dcValue;
        return Object.keys(out).length === 0 ? undefined : out;
    }

    private mapCodexRowToNpcAction(
        raw: Record<string, unknown>,
        opts: { attackBonus: number; range: string },
    ): Action {
        const ability = this.parseNpcAttackAbility(raw.attackAbility);
        const damage = Array.isArray(raw.damage) ? (raw.damage as Action['damage']) : undefined;
        const dc = this.normalizeNpcDifficultyClass(raw.dc);

        return {
            name: typeof raw.name === 'string' ? raw.name : '',
            type: typeof raw.type === 'string' ? raw.type : '',
            usageType: this.parseNpcUsageType(raw.usageType),
            ...(ability ? { attackAbility: ability } : {}),
            description: typeof raw.description === 'string' ? raw.description : undefined,
            attackBonus: opts.attackBonus,
            damage,
            range: opts.range,
            dc: dc ?? undefined,
            cost: typeof raw.cost === 'number' ? raw.cost : undefined,
        };
    }

    private normalizeCodexActionsForNpc(
        list: unknown,
        opts: { attackBonus: number; range: string; forceAttackAndRange?: boolean },
    ): Action[] {
        const arr = Array.isArray(list) ? list : [];
        return arr
            .filter(
                (item): item is Record<string, unknown> =>
                    item != null && typeof item === 'object' && !Array.isArray(item),
            )
            .map((raw) => {
                const attackBonus = opts.forceAttackAndRange
                    ? opts.attackBonus
                    : typeof raw.attackBonus === 'number'
                      ? raw.attackBonus
                      : opts.attackBonus;
                const range = opts.forceAttackAndRange
                    ? opts.range
                    : typeof raw.range === 'string'
                      ? raw.range
                      : opts.range;
                return this.mapCodexRowToNpcAction(raw, { attackBonus, range });
            });
    }

    /**
     * Choisit une traduction exploitable (nom non vide), en privilégiant la locale du monstre.
     * Évite les stubs `{}` ou entrées présentes mais vides qui bloquaient le repli en/en.
     */
    private pickCodexSpellTranslationForLocale(s: CodexSpellItem, preferred?: string): CodexSpellTranslation | undefined {
        const usableName = (tr: CodexSpellTranslation | undefined): boolean =>
            tr != null && typeof tr.name === 'string' && tr.name.trim().length > 0;

        if (preferred && usableName(s.translations[preferred])) {
            return s.translations[preferred];
        }
        if (usableName(s.translations['en'])) {
            return s.translations['en'];
        }
        for (const loc of s.languages ?? []) {
            if (usableName(s.translations[loc])) {
                return s.translations[loc];
            }
        }
        for (const loc of Object.keys(s.translations ?? {})) {
            if (usableName(s.translations[loc])) {
                return s.translations[loc];
            }
        }
        return undefined;
    }

    private normalizeSpellcasting(codexSpellcasting: CodexMonsterTranslation['spellcasting'] = [], lang?: string) {
        const effectTypeMap: Record<number, 'attack' | 'heal' | 'utility'> = { 0: 'attack', 1: 'heal', 2: 'utility' };

        return codexSpellcasting.map((entry) => {
            let normalizedSlots: Record<string, { total: number; used: number }> = {};

            if (Array.isArray(entry.spellSlotsByLevel)) {
                normalizedSlots = entry.spellSlotsByLevel.reduce((acc, slot) => {
                    acc[String(slot.level)] = {
                        total: slot.count?.total ?? 0,
                        used: slot.count?.used ?? 0,
                    };
                    return acc;
                }, {} as Record<string, { total: number; used: number }>);
            } else if (entry.spellSlotsByLevel && typeof entry.spellSlotsByLevel === 'object') {
                normalizedSlots = entry.spellSlotsByLevel;
            }

            let normalizedSlotsUse: Record<string, number | null> = {};

            if (Array.isArray(entry.spellSlotsByUses)) {
                normalizedSlotsUse = entry.spellSlotsByUses.reduce((acc, slot) => {
                    acc[String(slot.usesPerDay)] = slot.usesPerDay;
                    return acc;
                }, {} as Record<string, number | null>);
            } else if (entry.spellSlotsByUses && typeof entry.spellSlotsByUses === 'object') {
                normalizedSlotsUse = entry.spellSlotsByUses;
            }

            const normalizedSpells = (entry.spells || []).map((spell) => {
                // Objet sort peuplé : { _id, translations: { en: {...} }, languages: [...] }
                if (spell && typeof spell === 'object' && 'translations' in spell) {
                    const s = spell as CodexSpellItem;
                    const t = this.pickCodexSpellTranslationForLocale(s, lang);
                    if (t) {
                        return {
                            name: t.name || '',
                            level: t.level ?? 0,
                            school: t.school || '',
                            description: t.description || '',
                            components: t.components || [],
                            castingTime: t.castingTime || '',
                            duration: t.duration || '',
                            range: t.range || '',
                            usesPerDay: t.usesPerDay ?? null,
                            used: 0,
                            effectType:
                                (typeof t.effectType === 'number' ? effectTypeMap[t.effectType] : t.effectType) ||
                                ('utility' as const),
                            damage: t.damage ?? undefined,
                            healing: undefined as string | undefined,
                        };
                    }
                }
                // Forme aplatie ou ID non résolu
                const flat = spell as Partial<Spell> & {
                    effectType?: 'attack' | 'heal' | 'utility';
                    usesPerDay?: number | null;
                    used?: number;
                };
                return {
                    name: flat.name || '',
                    level: flat.level ?? 0,
                    school: flat.school || '',
                    description: flat.description || '',
                    components: flat.components || [],
                    castingTime: flat.castingTime || '',
                    duration: flat.duration || '',
                    range: flat.range || '',
                    effectType: flat.effectType || 'utility' as const,
                    damage: flat.damage,
                    usesPerDay: flat?.usesPerDay ?? null,
                    used: 0,
                    healing: flat.healing,
                };
            });

            return {
                className: entry.className || 'Monster',
                ability: entry.ability || 'WIS',
                saveDC: entry.saveDC ?? 10,
                attackBonus: entry.attackBonus ?? 0,
                isInnate: entry.isInnate ?? false,
                spellSlotsByLevel: normalizedSlots,
                spellSlotsByUses: normalizedSlotsUse,
                totalSlots: entry.totalSlots ?? Object.values(normalizedSlots).reduce((sum, slot) => sum + (slot.total || 0), 0),
                spells: normalizedSpells,
            };
        });
    }

    constructor() {
        const codexUrl = process.env.NEXT_PUBLIC_CODEX_URL;

        if (!codexUrl) {
            throw new Error('NEXT_PUBLIC_CODEX_URL is not defined in environment variables');
        }

        this.client = axios.create({
            baseURL: codexUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Recherche des sorts dans Codex par nom
     * @param searchQuery - Le terme de recherche
     * @param lang - La langue (fr, en, es) ou null pour toutes les langues
     * @param page - Le numéro de page
     * @param offset - Le nombre d'éléments par page
     * @param classes - Filtre optionnel par une ou plusieurs classes de lanceur
     */
    async searchSpells(
        searchQuery: string,
        lang: string | null = null,
        page: number = 1,
        offset: number = 10,
        classes?: string[],
    ): Promise<CodexSpellResponse> {
        try {
            const params: Record<string, string | number | string[]> = {
                page,
                offset,
            };

            // Ajouter la langue seulement si elle est spécifiée
            if (lang) {
                params.lang = lang;
            }

            // Ajouter le paramètre de recherche seulement s'il n'est pas vide
            if (searchQuery && searchQuery.trim()) {
                params.name = searchQuery.trim();
            }

            if (classes && classes.length > 0) {
                params.classes = classes.map(spellClassApiValue);
            }

            const response = await this.client.get<CodexSpellResponse>('/spells', {
                params,
                paramsSerializer: {
                    indexes: null,
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error searching spells from Codex:', error);
            throw error;
        }
    }

    /**
     * Convertit un sort Codex en format Chariot
     * @param codexSpellItem - L'item Codex complet
     * @param lang - La langue à utiliser pour la traduction
     */
    convertToChariotSpell(codexSpellItem: CodexSpellItem, lang: string): Partial<Spell> {
        const translation = codexSpellItem.translations[lang];

        if (!translation) {
            console.error('No translation found for spell', codexSpellItem);
            throw new Error('No translation available for this spell');
        }

        // Mapper effectType: 0 = attack, 1 = heal, 2 = utility
        const effectTypeMap: { [key: number]: 'attack' | 'heal' | 'utility' } = {
            0: 'attack',
            1: 'heal',
            2: 'utility',
        };

        return {
            name: translation.name,
            level: translation.level,
            school: translation.school,
            description: translation.description,
            components: translation.components || [],
            castingTime: translation.castingTime,
            duration: translation.duration,
            range: translation.range,
            usesPerDay: translation.usesPerDay,
            used: 0,
            classes: codexSpellItem.classes,
            effectType: effectTypeMap[translation.effectType] || 'utility',
            damage: translation.damage || undefined,
        };
    }

    /**
     * Extrait la traduction d'un sort dans la langue demandée
     */
    getSpellTranslation(codexSpellItem: CodexSpellItem, lang: string): CodexSpellTranslation | null {
        return codexSpellItem.translations[lang] ||
            codexSpellItem.translations[codexSpellItem.languages[0]] ||
            null;
    }

    /**
     * Vérifie si le service Codex est disponible (statut HTTP uniquement, sans charger de sorts).
     * @returns true si le service est disponible, false sinon
     */
    async checkHealth(): Promise<boolean> {
        try {
            await this.client.head('/spells', { timeout: 3000 });
            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 405) {
                try {
                    await this.client.get('/spells', {
                        params: { page: 1, offset: 1 },
                        timeout: 3000,
                    });
                    return true;
                } catch (fallbackError) {
                    console.warn('Codex service is unavailable:', fallbackError);
                    return false;
                }
            }

            console.warn('Codex service is unavailable:', error);
            return false;
        }
    }

    /**
     * Recherche des monstres dans Codex par nom
     * @param searchQuery - Le terme de recherche
     * @param lang - La langue (fr, en, es) ou null pour toutes les langues
     * @param page - Le numéro de page
     * @param offset - Le nombre d'éléments par page
     */
    async searchMonsters(
        searchQuery: string,
        lang: string | null = null,
        page: number = 1,
        offset: number = 10
    ): Promise<CodexMonsterResponse> {
        try {
            const params: Record<string, string | number> = {
                page,
                offset,
            };

            // Ajouter la langue seulement si elle est spécifiée
            if (lang) {
                params.lang = lang;
            }

            // Ajouter le paramètre de recherche seulement s'il n'est pas vide
            if (searchQuery && searchQuery.trim()) {
                params.name = searchQuery.trim();
            }

            const response = await this.client.get<CodexMonsterResponse>('/monsters', {
                params,
            });

            return response.data;
        } catch (error) {
            console.error('Error searching monsters from Codex:', error);
            throw error;
        }
    }

    /**
     * Détail monstre par ID. Comme la liste, `lang` inclut la locale demandée dans la réponse (souvent en + lang ; sans param, surtout l’anglais).
     */
    async getMonsterById(id: string, lang?: string | null): Promise<CodexMonsterItem | null> {
        try {
            const params: Record<string, string> = {};
            if (lang) {
                params.lang = lang;
            }
            const response = await this.client.get<{ message: string; data: CodexMonsterItem | CodexMonsterItem[] }>(
                `/monsters/${id}`,
                Object.keys(params).length > 0 ? { params } : undefined,
            );
            const data = response.data.data;
            const item = Array.isArray(data) ? data[0] : data;
            return item ?? null;
        } catch (err) {
            console.error(`Failed to fetch monster ${id}:`, err);
            return null;
        }
    }

    /**
     * Met à jour uniquement les locales listées avec le détail API (le détail l’emporte), sans écraser les autres traductions du partiel.
     */
    overlayMonsterTranslationsFromDetail(
        partial: CodexMonsterItem,
        detail: CodexMonsterItem,
        langs: string[],
    ): CodexMonsterItem {
        const merged: CodexMonsterItem = JSON.parse(JSON.stringify(partial));
        merged.languages = [...new Set([...(merged.languages ?? []), ...(detail.languages ?? [])])].sort();
        for (const l of langs) {
            const t = detail.translations[l];
            if (t != null) {
                merged.translations[l] = t;
            }
        }
        return merged;
    }

    /** Complète les traductions absentes du partiel à partir du détail (ne remplace pas les clés déjà présentes). */
    mergeMonsterFillMissingTranslations(partial: CodexMonsterItem, detail: CodexMonsterItem): CodexMonsterItem {
        const merged: CodexMonsterItem = JSON.parse(JSON.stringify(partial));
        merged.languages = [...new Set([...(merged.languages ?? []), ...(detail.languages ?? [])])].sort();
        for (const l of Object.keys(detail.translations)) {
            if (merged.translations[l] == null && detail.translations[l] != null) {
                merged.translations[l] = detail.translations[l];
            }
        }
        return merged;
    }

    /**
     * Convertit un monstre Codex en format Chariot NPC
     * @param codexMonsterItem - L'item Codex complet
     * @param lang - La langue à utiliser pour la traduction
     */
    convertToChariotNPC(codexMonsterItem: CodexMonsterItem, lang: string): Partial<NPC> {
        const translation = codexMonsterItem.translations[lang];

        if (!translation) {
            console.error('No translation found for monster', codexMonsterItem);
            throw new Error('No translation available for this monster');
        }

        // Normaliser la vitesse pour s'assurer que tous les champs existent
        const normalizedSpeed = {
            walk: translation.stats?.speed?.walk ?? 0,
            fly: translation.stats?.speed?.fly ?? 0,
            swim: translation.stats?.speed?.swim ?? 0,
            climb: translation.stats?.speed?.climb ?? 0,
            burrow: translation.stats?.speed?.burrow ?? 0,
        };

        return {
            firstname: translation.firstname,
            lastname: translation.lastname,
            surname: translation.surname,
            stats: {
                ...(translation.stats || {}),
                speed: normalizedSpeed,
                abilityScores: translation.stats?.abilityScores ?? {
                    strength: 10,
                    dexterity: 10,
                    constitution: 10,
                    intelligence: 10,
                    wisdom: 10,
                    charisma: 10,
                },
                savingThrows: translation.stats?.savingThrows ?? {
                    strength: 0,
                    dexterity: 0,
                    constitution: 0,
                    intelligence: 0,
                    wisdom: 0,
                    charisma: 0,
                },
                skills: translation.stats?.skills ?? {},
                senses: (translation.stats?.senses ?? []).map(sense => ({
                    name: sense.type,
                    value: parseInt(sense.value, 10) || 0,
                })),
                languages: translation.stats?.languages ?? [],
            },
            affinities: translation.affinities,
            abilities: translation.abilities,
            spellcasting: this.normalizeSpellcasting(translation.spellcasting, lang),
            actions: {
                standard: this.normalizeCodexActionsForNpc(translation.actions?.standard, {
                    attackBonus: 0,
                    range: '',
                }),
                legendary: this.normalizeCodexActionsForNpc(translation.actions?.legendary, {
                    attackBonus: 0,
                    range: '',
                    forceAttackAndRange: true,
                }),
                lair: this.normalizeCodexActionsForNpc(translation.actions?.lair, {
                    attackBonus: 0,
                    range: '',
                    forceAttackAndRange: true,
                }),
            },
            challenge: translation.challenge,
            profile: {
                ...(translation.profile || {}),
                alignment: this.normalizeAlignment(translation.profile?.alignment),
            },
        };
    }

    /**
     * Fetche un sort par son ID. `lang` aligne le comportement sur la liste (traductions présentes pour la locale).
     */
    async getSpellById(id: string, lang?: string | null): Promise<CodexSpellItem | null> {
        try {
            const params: Record<string, string> = {};
            if (lang) {
                params.lang = lang;
            }
            const response = await this.client.get<{ message: string; data: CodexSpellItem | CodexSpellItem[] }>(
                `/spells/${id}`,
                Object.keys(params).length > 0 ? { params } : undefined,
            );
            const data = response.data.data;
            const item = Array.isArray(data) ? data[0] : data;
            return item ?? null;
        } catch (err) {
            console.error(`Failed to fetch spell ${id}:`, err);
            return null;
        }
    }

    /** Dépôt des traductions du détail pour les locales indiquées (le détail l’emporte pour ces clés). */
    overlaySpellTranslationsFromDetail(partial: CodexSpellItem, detail: CodexSpellItem, langs: string[]): CodexSpellItem {
        const merged: CodexSpellItem = JSON.parse(JSON.stringify(partial));
        merged.languages = [...new Set([...(merged.languages ?? []), ...(detail.languages ?? [])])].sort();
        merged.classes = [...new Set([...(merged.classes ?? []), ...(detail.classes ?? [])])];
        for (const l of langs) {
            const t = detail.translations[l];
            if (t != null) {
                merged.translations[l] = t;
            }
        }
        return merged;
    }

    /**
     * Référence sort dans spellcasting : ID brut (liste), `{ _id }`, ou document Codex peuplé.
     * Sans cela, un objet passé à getSpellById devient `/spells/[object Object]` → 400.
     */
    private resolveSpellReferenceId(spell: unknown): string | null {
        if (typeof spell === 'string') {
            const t = spell.trim();
            return t.length > 0 ? t : null;
        }
        if (spell && typeof spell === 'object') {
            const o = spell as { _id?: unknown; $oid?: unknown };
            if (typeof o._id === 'string') {
                const trimmed = o._id.trim();
                return trimmed.length > 0 ? trimmed : null;
            }
            // BSON Extended JSON côté API
            if (typeof o.$oid === 'string') {
                const trimmed = o.$oid.trim();
                return trimmed.length > 0 ? trimmed : null;
            }
        }
        return null;
    }

    /** Ajoute les traductions présentes dans le détail mais absentes du partiel (null / undefined). */
    mergeSpellFillMissingTranslations(partial: CodexSpellItem, detail: CodexSpellItem): CodexSpellItem {
        const merged: CodexSpellItem = JSON.parse(JSON.stringify(partial));
        merged.languages = [...new Set([...(merged.languages ?? []), ...(detail.languages ?? [])])].sort();
        merged.classes = [...new Set([...(merged.classes ?? []), ...(detail.classes ?? [])])];
        for (const l of Object.keys(detail.translations)) {
            if (merged.translations[l] == null && detail.translations[l] != null) {
                merged.translations[l] = detail.translations[l];
            }
        }
        return merged;
    }

    /**
     * Peuple les sorts de toute une liste de monstres en une seule passe.
     * Collecte tous les IDs uniques, les fetche en parallèle, puis remplace les références.
     */
    async populateMonstersList(monsters: CodexMonsterItem[]): Promise<CodexMonsterItem[]> {
        const spellIdSet = new Set<string>();
        for (const monster of monsters) {
            for (const lang of monster.languages) {
                const translation = monster.translations[lang];
                if (!translation?.spellcasting) continue;
                for (const entry of translation.spellcasting) {
                    for (const spell of entry.spells || []) {
                        const id = this.resolveSpellReferenceId(spell);
                        if (id) {
                            spellIdSet.add(id);
                        }
                    }
                }
            }
        }
        if (spellIdSet.size === 0) return monsters;

        const spellMap = new Map<string, CodexSpellItem>();
        await Promise.all(
            Array.from(spellIdSet).map(async (id) => {
                const spell = await this.getSpellById(id);
                if (spell) {
                    spellMap.set(id, spell)
                };
            })
        );

        if (spellMap.size === 0) return monsters;

        return monsters.map((monster) => {
            const cloned: CodexMonsterItem = JSON.parse(JSON.stringify(monster));
            for (const lang of cloned.languages) {
                const translation = cloned.translations[lang];
                if (!translation?.spellcasting) continue;
                for (const entry of translation.spellcasting) {
                    if (!entry.spells) continue;
                    entry.spells = entry.spells.map((spell) => {
                        const id = this.resolveSpellReferenceId(spell);
                        if (!(id && spellMap.has(id))) {
                            return spell;
                        }
                        const spellItem = spellMap.get(id)!;

                        const slotsByUses = entry.spellSlotsByUses;
                        if (!slotsByUses || typeof slotsByUses !== 'object') {
                            return spellItem;
                        }

                        // Monster locale may list a language the spell document does not translate (e.g. fr vs en-only spell).
                        const spellLang =
                            spellItem.translations[lang] != null
                                ? lang
                                : spellItem.translations['en'] != null
                                  ? 'en'
                                  : spellItem.languages.find((l) => spellItem.translations[l] != null);

                        if (!spellLang || spellItem.translations[spellLang] == null) {
                            return spellItem;
                        }

                        // Clone so we do not mutate the shared spellMap entry (used across all monsters in the list).
                        const merged = JSON.parse(JSON.stringify(spellItem)) as CodexSpellItem;
                        merged.translations[spellLang].usesPerDay = slotsByUses[id] ?? null;
                        return merged;
                    }) as typeof entry.spells;
                }
            }
            return cloned;
        });
    }

    /**
     * Extrait la traduction d'un monstre dans la langue demandée
     */
    getMonsterTranslation(codexMonsterItem: CodexMonsterItem, lang: string): CodexMonsterTranslation | null {
        return codexMonsterItem.translations[lang] ||
            codexMonsterItem.translations[codexMonsterItem.languages[0]] ||
            null;
    }
}

const codexService = new CodexService();

export default codexService;
