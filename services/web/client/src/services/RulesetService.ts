import apiClient from "@/services/ApiService";
import type { BuilderRuleset, RulesetEntry, TranslatedText } from "@/lib/rulesetEngine/types";

/**
 * Read API of the data-driven character builder (adventure service, published rulesets only for players).
 * @see FR-ruleset-character-builder — Access
 */

export type RulesetSummary = {
  _id: string;
  key: string;
  version: number;
  gameSystem: string;
  status: "draft" | "published" | "archived";
  name: TranslatedText;
  description?: TranslatedText;
};

export type RulesetDetail = RulesetSummary & BuilderRuleset;

type ApiResponse<T> = { message: string; data: T };

class RulesetService {
  private readonly BASE_PATH = "/rulesets";

  /** Rulesets of a game system, without their flow nor catalog. */
  async listRulesets(gameSystem: string): Promise<RulesetSummary[]> {
    const response = await apiClient().get<ApiResponse<RulesetSummary[]>>(this.BASE_PATH, {
      params: { gameSystem },
    });
    return response.data.data.filter((ruleset) => ruleset.status === "published");
  }

  /** A ruleset with its flow, formulas, declarations and projection. */
  async getRuleset(id: string): Promise<RulesetDetail> {
    const response = await apiClient().get<ApiResponse<RulesetDetail>>(`${this.BASE_PATH}/${encodeURIComponent(id)}`);
    return response.data.data;
  }

  /** Every catalog entry of a ruleset version (cached by the browser: a published version never changes). */
  async getCatalog(id: string): Promise<RulesetEntry[]> {
    const response = await apiClient().get<ApiResponse<RulesetEntry[]>>(
      `${this.BASE_PATH}/${encodeURIComponent(id)}/catalog`,
    );
    return response.data.data;
  }
}

const rulesetService = new RulesetService();

export default rulesetService;
