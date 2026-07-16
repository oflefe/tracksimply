import { Injectable } from '@nestjs/common';
import type { MealType } from '@calorie-tracker/contracts';
import { PrismaSuggestionsRepository } from './prisma-suggestions.repository.js';

@Injectable()
export class SuggestionsService {
  constructor(private readonly repository: PrismaSuggestionsRepository) {}

  async list(
    userId: string,
    mealType: MealType | undefined,
    rawLimit: string | undefined,
  ): Promise<unknown[]> {
    const limit = Math.min(Math.max(Number(rawLimit ?? 10), 1), 50);
    const foods = await this.repository.findFrequentFoods(
      userId,
      mealType,
      limit,
    );
    return foods.map((food) => ({
      type: 'FOOD',
      id: food.foodId,
      name: food.displayName,
      reason: 'FREQUENT_FOR_MEAL_TYPE',
      usageCount: food.usageCount,
    }));
  }
}
