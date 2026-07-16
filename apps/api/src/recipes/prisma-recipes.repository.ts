import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  CreateRecipeRecord,
  RecipeFoodRecord,
  RecipesRepository,
} from './recipes.repository.js';

@Injectable()
export class PrismaRecipesRepository implements RecipesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFoodsByIds(ids: string[]): Promise<RecipeFoodRecord[]> {
    return this.prisma.food.findMany({
      where: { id: { in: ids } },
    });
  }

  create(input: CreateRecipeRecord): Promise<unknown> {
    return this.prisma.recipe.create({
      data: {
        userId: input.userId,
        name: input.name,
        description: input.description,
        servingCount: input.servingCount,
        totalCalories: input.nutritionPerServing.calories,
        totalProtein: input.nutritionPerServing.protein,
        totalCarbohydrates: input.nutritionPerServing.carbohydrates,
        totalFat: input.nutritionPerServing.fat,
        totalFibre: input.nutritionPerServing.fibre,
        ingredients: {
          create: input.ingredients.map((ingredient) => ({
            foodId: ingredient.foodId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            grams: ingredient.grams,
            calories: ingredient.nutrition.calories,
            protein: ingredient.nutrition.protein,
            carbohydrates: ingredient.nutrition.carbohydrates,
            fat: ingredient.nutrition.fat,
            fibre: ingredient.nutrition.fibre,
            sourceSnapshot: ingredient.sourceSnapshot,
            position: ingredient.position,
          })),
        },
      },
      include: { ingredients: true },
    });
  }

  listByUserId(userId: string): Promise<unknown[]> {
    return this.prisma.recipe.findMany({
      where: { userId },
      include: { ingredients: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findById(id: string): Promise<unknown | null> {
    return this.prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: true },
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.recipe.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
