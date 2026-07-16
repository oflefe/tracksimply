import { ApplicationError } from '../common/errors.js';
import type { ParsedFoodMention } from '../parser/parser.js';
import type {
  FoodProvider,
  FoodCandidate,
  ExternalFoodDetails,
} from '../food-providers/provider.js';

export interface FoodRecord {
  id: string;
  normalizedName: string;
  displayName: string;
  category: string | null;
  preparationState: string | null;
  provider: string;
  providerExternalId: string;
  nutrientsPer100g: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fibre: number;
  };
  portions: Array<{
    label: string;
    amount: number;
    unit: string;
    grams: number;
  }>;
}
export interface FoodRepository {
  findAlias(alias: string): Promise<FoodRecord | null>;
  findByName(
    name: string,
    preparationState: string | null,
  ): Promise<FoodRecord[]>;
  saveExternalFood(food: ExternalFoodDetails): Promise<FoodRecord>;
}
export interface ResolvedFood {
  food: FoodRecord | null;
  confidence: number;
  candidates: FoodCandidate[];
  status: 'RESOLVED' | 'NEEDS_REVIEW' | 'UNRESOLVED';
}

export class FoodResolver {
  constructor(
    private readonly repository: FoodRepository,
    private readonly provider: FoodProvider,
    private readonly autoAcceptConfidence: number,
    private readonly reviewConfidence: number,
  ) {}
  async resolve(mention: ParsedFoodMention): Promise<ResolvedFood> {
    const alias = await this.repository.findAlias(mention.normalizedFoodName);
    if (alias) {
      return {
        food: alias,
        confidence: 0.99,
        candidates: [],
        status: 'RESOLVED',
      };
    }
    const preparation = mention.preparationModifiers.length
      ? mention.preparationModifiers.join(' ').toLowerCase()
      : null;
    const local = await this.repository.findByName(
      mention.normalizedFoodName,
      preparation,
    );
    const exact =
      local.find((food) => food.preparationState === preparation) ?? local[0];
    if (exact) {
      return {
        food: exact,
        confidence:
          preparation && exact.preparationState === preparation ? 0.96 : 0.88,
        candidates: [],
        status: 'RESOLVED',
      };
    }
    const candidates = await this.provider.search({
      name: mention.normalizedFoodName,
      preparationState: preparation,
    });
    if (!candidates.length) {
      return {
        food: null,
        confidence: 0,
        candidates: [],
        status: 'UNRESOLVED',
      };
    }
    const best = candidates[0];
    if (best.confidence < this.reviewConfidence) {
      return {
        food: null,
        confidence: best.confidence,
        candidates,
        status: 'UNRESOLVED',
      };
    }
    const details =
      best.details ?? (await this.provider.getFood(best.externalId));
    const saved = await this.repository.saveExternalFood(details);
    return {
      food: best.confidence >= this.autoAcceptConfidence ? saved : null,
      confidence: best.confidence,
      candidates,
      status:
        best.confidence >= this.autoAcceptConfidence
          ? 'RESOLVED'
          : 'NEEDS_REVIEW',
    };
  }
}
