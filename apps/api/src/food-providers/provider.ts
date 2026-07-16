import type { NutrientTotals } from '@calorie-tracker/contracts';

export const FOOD_PROVIDER = Symbol('FOOD_PROVIDER');

export interface FoodSearchQuery {
  name: string;
  preparationState?: string | null;
}
export interface ExternalFoodDetails {
  externalId: string;
  displayName: string;
  normalizedName: string;
  preparationState: string | null;
  category: string | null;
  nutrientsPer100g: NutrientTotals;
  portions: Array<{
    label: string;
    amount: number;
    unit: string;
    grams: number;
  }>;
  rawPayload: Record<string, unknown>;
}
export interface FoodCandidate {
  externalId: string;
  displayName: string;
  normalizedName: string;
  confidence: number;
  details?: ExternalFoodDetails;
}
export interface FoodProvider {
  search(query: FoodSearchQuery): Promise<FoodCandidate[]>;
  getFood(externalId: string): Promise<ExternalFoodDetails>;
}
