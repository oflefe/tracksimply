import { Injectable } from '@nestjs/common';
import { ApplicationError } from '../common/errors.js';
import {
  addNutrients,
  calculateNutrientsForGrams,
} from '../nutrition/calculator.js';
import { PrismaRecipesRepository } from './prisma-recipes.repository.js';
import type { RecipeFoodRecord } from './recipes.repository.js';
import type { RecipeInput } from './recipes.schema.js';

function foodNutrients(food: RecipeFoodRecord) {
  return {
    calories: Number(food.caloriesPer100g),
    protein: Number(food.proteinPer100g),
    carbohydrates: Number(food.carbohydratesPer100g),
    fat: Number(food.fatPer100g),
    fibre: Number(food.fibrePer100g),
  };
}

@Injectable()
export class RecipesService {
  constructor(private readonly repository: PrismaRecipesRepository) {}

  async create(input: RecipeInput): Promise<unknown> {
    const foods = await this.repository.findFoodsByIds(
      input.ingredients.map((ingredient) => ingredient.foodId),
    );
    if (foods.length !== input.ingredients.length) {
      throw new ApplicationError(
        'FOOD_NOT_FOUND',
        'One or more recipe foods were not found',
        {},
        404,
      );
    }
    const foodsById = new Map(foods.map((food) => [food.id, food]));
    const ingredients = input.ingredients.map((ingredient, position) => {
      const food = foodsById.get(ingredient.foodId);
      if (!food) {
        throw new ApplicationError(
          'FOOD_NOT_FOUND',
          'Recipe food was not found',
          { foodId: ingredient.foodId },
          404,
        );
      }
      return {
        foodId: ingredient.foodId,
        quantity: ingredient.quantity,
        unit: ingredient.unit ?? null,
        grams: ingredient.grams,
        nutrition: calculateNutrientsForGrams(
          foodNutrients(food),
          ingredient.grams,
        ),
        sourceSnapshot: {
          foodId: food.id,
          displayName: food.displayName,
        },
        position,
      };
    });
    const totals = addNutrients(
      ingredients.map((ingredient) => ingredient.nutrition),
    );
    return this.repository.create({
      userId: input.userId,
      name: input.name,
      description: input.description ?? null,
      servingCount: input.servingCount,
      nutritionPerServing: {
        calories: totals.calories / input.servingCount,
        protein: totals.protein / input.servingCount,
        carbohydrates: totals.carbohydrates / input.servingCount,
        fat: totals.fat / input.servingCount,
        fibre: totals.fibre / input.servingCount,
      },
      ingredients,
    });
  }

  list(userId: string): Promise<unknown[]> {
    return this.repository.listByUserId(userId);
  }

  async findById(id: string): Promise<unknown> {
    const recipe = await this.repository.findById(id);
    if (!recipe) {
      throw this.notFound(id);
    }
    return recipe;
  }

  async remove(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) {
      throw this.notFound(id);
    }
  }

  private notFound(id: string): ApplicationError {
    return new ApplicationError(
      'RECIPE_NOT_FOUND',
      'Recipe was not found',
      { id },
      404,
    );
  }
}
