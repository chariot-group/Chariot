import axios, { AxiosInstance } from 'axios';
import { Spell, NPC } from '@/types/character';

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
                    const spellLang = (lang && s.translations[lang])
                        ? lang
                        : (s.translations['en'] ? 'en' : s.languages[0]);
                    const t = spellLang ? s.translations[spellLang] : undefined;
                    return {
                        name: t?.name || '',
                        level: t?.level ?? 0,
                        school: t?.school || '',
                        description: t?.description || '',
                        components: t?.components || [],
                        castingTime: t?.castingTime || '',
                        duration: t?.duration || '',
                        range: t?.range || '',
                        usesPerDay: t?.usesPerDay ?? null,
                        used: 0,
                        effectType: (typeof t?.effectType === 'number' ? effectTypeMap[t.effectType] : t?.effectType) || 'utility' as const,
                        damage: t?.damage ?? undefined,
                        healing: undefined as string | undefined,
                    };
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
     */
    async searchSpells(
        searchQuery: string,
        lang: string | null = null,
        page: number = 1,
        offset: number = 10
    ): Promise<CodexSpellResponse> {
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

            const response = await this.client.get<CodexSpellResponse>('/spells', {
                params,
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
        // Récupérer la traduction dans la langue demandée, sinon fallback sur la première disponible
        const translation = codexSpellItem.translations[lang] ||
            codexSpellItem.translations[codexSpellItem.languages[0]];

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
     * Vérifie si le service Codex est disponible
     * @returns true si le service est disponible, false sinon
     */
    async checkHealth(): Promise<boolean> {
        try {
            // Utiliser l'endpoint /spells avec une requête minimale
            await this.client.get('/spells', {
                params: { page: 1, offset: 1 },
                timeout: 3000
            });
            return true;
        } catch (error) {
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
     * Convertit un monstre Codex en format Chariot NPC
     * @param codexMonsterItem - L'item Codex complet
     * @param lang - La langue à utiliser pour la traduction
     */
    convertToChariotNPC(codexMonsterItem: CodexMonsterItem, lang: string): Partial<NPC> {
        // Récupérer la traduction dans la langue demandée, sinon fallback sur la première disponible
        const translation = codexMonsterItem.translations[lang] ||
            codexMonsterItem.translations[codexMonsterItem.languages[0]];

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
                standard: (translation.actions?.standard ?? []).map(action => ({
                    ...action,
                    attackBonus: action.attackBonus ?? 0,
                    range: action.range ?? "",
                })),
                legendary: (translation.actions?.legendary ?? []).map(action => ({
                    ...action,
                    attackBonus: 0,
                    range: "",
                })),
                lair: (translation.actions?.lair ?? []).map(action => ({
                    ...action,
                    attackBonus: 0,
                    range: "",
                })),
            },
            challenge: translation.challenge,
            profile: {
                ...(translation.profile || {}),
                alignment: this.normalizeAlignment(translation.profile?.alignment),
            },
        };
    }

    /**
     * Fetche un sort par son ID. Gère les réponses en objet ou en tableau.
     */
    async getSpellById(id: string): Promise<CodexSpellItem | null> {
        try {
            const response = await this.client.get<{ message: string; data: CodexSpellItem | CodexSpellItem[] }>(`/spells/${id}`);
            const data = response.data.data;
            const item = Array.isArray(data) ? data[0] : data;
            return item ?? null;
        } catch (err) {
            console.error(`Failed to fetch spell ${id}:`, err);
            return null;
        }
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
                        const id = spell as string;
                        if (id) {
                            spellIdSet.add(id)
                        };
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
                        const id = spell as string;
                        if (id && spellMap.has(id)) {
                            const spellItem = spellMap.get(id)!;
                            if (entry.spellSlotsByUses) {
                                spellItem.translations[lang].usesPerDay = entry.spellSlotsByUses![id] ?? null;
                            }
                            return spellItem;
                        }
                        return spell;
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
