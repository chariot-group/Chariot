import axios, { AxiosInstance } from 'axios';
import { Spell } from '@/types/character';

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

class CodexService {
    private client: AxiosInstance;

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
}

export default new CodexService();
