import { Injectable } from '@nestjs/common';
import type { MealType } from '@calorie-tracker/contracts';
import { PrismaService } from '../database/prisma.service.js';
import type {
  FrequentFoodRecord,
  SuggestionsRepository,
} from './suggestions.repository.js';

@Injectable()
export class PrismaSuggestionsRepository implements SuggestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFrequentFoods(
    userId: string,
    mealType: MealType | undefined,
    limit: number,
  ): Promise<FrequentFoodRecord[]> {
    const grouped = await this.prisma.foodLogItem.groupBy({
      by: ['foodId'],
      where: {
        foodId: { not: null },
        foodLog: {
          meal: {
            userId,
            ...(mealType ? { type: mealType } : {}),
          },
        },
      },
      _count: { foodId: true },
      orderBy: { _count: { foodId: 'desc' } },
      take: limit,
    });
    const foodIds = grouped.flatMap((item) =>
      item.foodId ? [item.foodId] : [],
    );
    const foods = await this.prisma.food.findMany({
      where: { id: { in: foodIds } },
    });
    const namesById = new Map(foods.map((food) => [food.id, food.displayName]));
    return grouped.flatMap((item) =>
      item.foodId
        ? [
            {
              foodId: item.foodId,
              displayName: namesById.get(item.foodId) ?? null,
              usageCount: item._count.foodId,
            },
          ]
        : [],
    );
  }
}
