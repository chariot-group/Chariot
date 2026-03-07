import axios, { AxiosInstance } from 'axios';
import { Spell, NPC } from '@/types/character';

interface CodexSpellTranslation {
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
    createdAt: string;
    updatedAt: string;
}

interface CodexSpellItem {
    _id: string;
    tag: number;
    languages: string[];
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

interface CodexMonsterTranslation {
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
        totalSlots?: number;
        spells?: Array<{
            name?: string;
            level?: number;
            school?: string;
            description?: string;
            components?: string[];
            castingTime?: string;
            duration?: string;
            range?: string;
            effectType?: 'attack' | 'heal' | 'utility';
            damage?: string;
            healing?: string;
        }>;
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

interface CodexMonsterItem {
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

    private normalizeSpellcasting(codexSpellcasting: CodexMonsterTranslation['spellcasting'] = []) {
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

            const normalizedSpells = (entry.spells || []).map((spell) => ({
                name: spell.name || '',
                level: spell.level ?? 0,
                school: spell.school || '',
                description: spell.description || '',
                components: spell.components || [],
                castingTime: spell.castingTime || '',
                duration: spell.duration || '',
                range: spell.range || '',
                effectType: spell.effectType || 'utility',
                damage: spell.damage,
                healing: spell.healing,
            }));

            return {
                className: entry.className || 'Monster',
                ability: entry.ability || 'WIS',
                saveDC: entry.saveDC ?? 10,
                attackBonus: entry.attackBonus ?? 0,
                spellSlotsByLevel: normalizedSlots,
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
            const params: any = {
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
            const params: any = {
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
            walk: translation.stats.speed.walk || 0,
            climb: translation.stats.speed.climb || 0,
            swim: translation.stats.speed.swim || 0,
            fly: translation.stats.speed.fly || 0,
            burrow: translation.stats.speed.burrow || 0,
        };

        const normalizedSenses = (translation.stats.senses || []).map((sense) => ({
            name: sense.type || '',
            value: typeof sense.value === 'number' ? sense.value : parseInt(sense.value, 10) || 0,
        }));

        const normalizeAction = (action: {
            name: string;
            type: string;
            description?: string;
            attackBonus?: number;
            damage?: Array<{ dice: string; type: string }>;
            range?: string;
            dc?: { dcType: string; dcValue: number; successType: string };
            cost?: number;
        }) => ({
            name: action.name,
            type: action.type,
            description: action.description,
            attackBonus: action.attackBonus ?? 0,
            damage: action.damage,
            range: action.range ?? '',
            dc: action.dc,
            cost: action.cost,
        });

        const dexterityScore = translation.stats.abilityScores?.dexterity ?? 10;
        const dexterityModifier = Math.floor((dexterityScore - 10) / 2);
        const baseArmorClass = translation.stats.armorClass ?? 0;
        const computedArmorClass = Math.max(baseArmorClass, 10 + dexterityModifier);

        return {
            firstname: translation.firstname,
            lastname: translation.lastname || "",
            surname: translation.surname || "",
            avatar: translation.avatar || "",
            stats: {
                ...translation.stats,
                armorClass: computedArmorClass,
                speed: normalizedSpeed,
                senses: normalizedSenses,
            },
            affinities: translation.affinities,
            abilities: translation.abilities,
            spellcasting: this.normalizeSpellcasting(translation.spellcasting),
            actions: {
                standard: (translation.actions?.standard || []).map((action) => normalizeAction(action)),
                legendary: (translation.actions?.legendary || []).map((action) => normalizeAction(action)),
                lair: (translation.actions?.lair || []).map((action) => normalizeAction(action)),
            },
            challenge: translation.challenge,
            profile: {
                alignment: this.normalizeAlignment(translation.profile.alignment),
                type: translation.profile.type,
                subtype: translation.profile.subtype,
            },
            hitPointsRoll: translation.hitPointsRoll,
            appearance: {},
            background: {},
            treasure: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, treasure: "", equipment: "" },
            conditions: {
                blinded: false,
                charmed: false,
                deafened: false,
                frightened: false,
                grappled: false,
                incapacitated: false,
                invisible: false,
                paralyzed: false,
                petrified: false,
                poisoned: false,
                prone: false,
                restrained: false,
                stunned: false,
                unconscious: false,
            },
        };
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

export default new CodexService();
