import type {
  MealType,
  UnitName,
  QuantitySource,
} from '@calorie-tracker/contracts';
import type { ParsedFoodMention } from '../parser/parser.js';
import type { FoodRecord } from '../food-catalog/resolver.js';
import { ApplicationError } from '../common/errors.js';

export interface PortionRuleRecord {
  foodId: string | null;
  foodCategory: string | null;
  quantifier: string;
  mealType: MealType | null;
  grams: number;
  scope: 'SYSTEM' | 'USER';
  source: string;
  confidence: number;
}
export interface PortionResolution {
  grams: number;
  quantitySource: QuantitySource;
  assumed: boolean;
  warning?: string;
}
export interface PortionRepository {
  findPortionRules(input: {
    userId: string;
    foodId: string;
    category: string | null;
    quantifier: string;
    mealType: MealType;
  }): Promise<PortionRuleRecord[]>;
}
const unitFactors: Partial<Record<UnitName, number>> = {
  GRAM: 1,
  KILOGRAM: 1000,
};
const categoryDefaults: Record<
  string,
  { quantifier: string; grams: number }[]
> = {
  dairy: [{ quantifier: 'SOME', grams: 30 }],
  sauce: [{ quantifier: 'SOME', grams: 30 }],
  grains: [{ quantifier: 'BOWL', grams: 180 }],
  vegetables: [{ quantifier: 'SOME', grams: 80 }],
  nuts: [{ quantifier: 'HANDFUL', grams: 30 }],
  bread: [{ quantifier: 'SLICE', grams: 35 }],
};

export class PortionResolver {
  constructor(private readonly repository: PortionRepository) {}
  async resolve(
    mention: ParsedFoodMention,
    food: FoodRecord,
    userId: string,
    mealType: MealType,
  ): Promise<PortionResolution> {
    const unit = mention.unit as UnitName | null;
    if (mention.quantity !== null && unit && unitFactors[unit]) {
      return {
        grams: mention.quantity * unitFactors[unit]!,
        quantitySource: 'EXPLICIT',
        assumed: false,
      };
    }
    if (mention.quantity !== null && unit) {
      const portion = food.portions.find(
        (candidate) => candidate.unit === unit,
      );
      if (portion) {
        return {
          grams: (mention.quantity / portion.amount) * portion.grams,
          quantitySource: 'EXPLICIT',
          assumed: false,
        };
      }
    }
    if (mention.quantity !== null && !unit) {
      const piece = food.portions.find(
        (candidate) => candidate.unit === 'PIECE',
      );
      if (piece) {
        return {
          grams: (mention.quantity / piece.amount) * piece.grams,
          quantitySource: 'EXPLICIT',
          assumed: false,
        };
      }
    }
    if (mention.quantifier) {
      const rules = await this.repository.findPortionRules({
        userId,
        foodId: food.id,
        category: food.category,
        quantifier: mention.quantifier,
        mealType,
      });
      const userRule = rules.find((rule) => rule.scope === 'USER');
      const exactSystem = rules.find(
        (rule) => rule.scope === 'SYSTEM' && rule.foodId === food.id,
      );
      const categorySystem = rules.find(
        (rule) =>
          rule.scope === 'SYSTEM' && rule.foodCategory === food.category,
      );
      const selected = userRule ?? exactSystem ?? categorySystem;
      if (selected) {
        return {
          grams: selected.grams,
          quantitySource:
            selected.scope === 'USER'
              ? 'USER_PORTION_RULE'
              : 'SYSTEM_PORTION_RULE',
          assumed: true,
          warning: `Assumed ${selected.grams}g for ${mention.quantifier.toLowerCase()}`,
        };
      }
      const fallback = food.category
        ? categoryDefaults[food.category]?.find(
            (rule) => rule.quantifier === mention.quantifier,
          )
        : undefined;
      if (fallback) {
        return {
          grams: fallback.grams,
          quantitySource: 'CATEGORY_DEFAULT',
          assumed: true,
          warning: `Used ${fallback.grams}g category default`,
        };
      }
      const serving = food.portions[0];
      if (serving) {
        return {
          grams: serving.grams,
          quantitySource: 'PROVIDER_SERVING',
          assumed: true,
          warning: `Used provider serving: ${serving.label}`,
        };
      }
    }
    throw new ApplicationError(
      'PORTION_UNRESOLVED',
      'A portion could not be determined for this food',
      { rawText: mention.rawText },
      422,
    );
  }
}
