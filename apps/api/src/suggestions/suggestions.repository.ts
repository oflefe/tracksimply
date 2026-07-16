import type { MealType } from '@calorie-tracker/contracts';

export interface FrequentFoodRecord {
  foodId: string;
  displayName: string | null;
  usageCount: number;
}

export interface SuggestionsRepository {
  findFrequentFoods(
    userId: string,
    mealType: MealType | undefined,
    limit: number,
  ): Promise<FrequentFoodRecord[]>;
}
