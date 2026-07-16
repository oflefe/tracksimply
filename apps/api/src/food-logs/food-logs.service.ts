import { Injectable } from '@nestjs/common';
import type {
  ConfirmRequest,
  FoodLogUpdate,
  NutrientTotals,
} from '@calorie-tracker/contracts';
import { ApplicationError } from '../common/errors.js';
import {
  addNutrients,
  CALCULATION_VERSION,
  calculateNutrientsForGrams,
  type NutrientsPer100g,
} from '../nutrition/calculator.js';
import type {
  FoodLogFoodRecord,
  FoodLogItemRecord,
  PersistedFoodLog,
} from './food-logs.repository.js';
import { PrismaFoodLogsRepository } from './prisma-food-logs.repository.js';

function number(value: unknown): number {
  return Number(value ?? 0);
}

function nutrients(food: FoodLogFoodRecord): NutrientsPer100g {
  return {
    calories: number(food.caloriesPer100g),
    protein: number(food.proteinPer100g),
    carbohydrates: number(food.carbohydratesPer100g),
    fat: number(food.fatPer100g),
    fibre: number(food.fibrePer100g),
  };
}

function publicTotals(value: {
  totalCalories: unknown;
  totalProtein: unknown;
  totalCarbohydrates: unknown;
  totalFat: unknown;
  totalFibre: unknown;
}): NutrientTotals {
  return {
    calories: number(value.totalCalories),
    protein: number(value.totalProtein),
    carbohydrates: number(value.totalCarbohydrates),
    fat: number(value.totalFat),
    fibre: number(value.totalFibre),
  };
}

function createResponse(log: PersistedFoodLog): Record<string, unknown> {
  return {
    id: log.id,
    mealId: log.mealId,
    status: log.status,
    items: log.items.map((item) => ({
      id: item.id,
      rawText: item.rawText,
      foodId: item.foodId,
      grams: number(item.grams),
      nutrition: {
        calories: number(item.calories),
        protein: number(item.protein),
        carbohydrates: number(item.carbohydrates),
        fat: number(item.fat),
        fibre: number(item.fibre),
      },
    })),
    totals: publicTotals(log),
  };
}

@Injectable()
export class FoodLogsService {
  constructor(private readonly repository: PrismaFoodLogsRepository) {}

  async confirm(
    request: ConfirmRequest,
    idempotencyKey: string | undefined,
  ): Promise<Record<string, unknown>> {
    const endpoint = 'POST:/food-logs';
    if (idempotencyKey) {
      const existing = await this.repository.findIdempotentResponse(
        request.userId,
        endpoint,
        idempotencyKey,
      );
      if (existing) {
        return existing;
      }
    }
    const items = await this.calculateItems(request.items);
    const totals = addNutrients(items.map((item) => item.nutrition));
    const response = await this.repository.createConfirmed(
      {
        userId: request.userId,
        mealId: request.mealId,
        mealType: request.mealType,
        occurredAt: new Date(request.occurredAt),
        rawText: request.input,
        totals,
        items,
        calculationVersion: CALCULATION_VERSION,
        ...(idempotencyKey
          ? {
              idempotency: {
                endpoint,
                key: idempotencyKey,
              },
            }
          : {}),
      },
      createResponse,
    );
    if (!response) {
      throw new ApplicationError(
        'MEAL_NOT_FOUND',
        'Meal was not found',
        { mealId: request.mealId },
        404,
      );
    }
    return response;
  }

  async findById(id: string): Promise<Record<string, unknown>> {
    const log = await this.repository.findById(id);
    if (!log) {
      throw this.foodLogNotFound(id);
    }
    return {
      id: log.id,
      status: log.status,
      meal: log.meal,
      rawText: log.inputEvent.rawText,
      items: log.items,
      totals: publicTotals(log),
    };
  }

  async update(
    id: string,
    request: FoodLogUpdate,
  ): Promise<Record<string, unknown>> {
    const items = await this.calculateItems(request.items);
    const totals = addNutrients(items.map((item) => item.nutrition));
    const updated = await this.repository.replaceItems(
      id,
      request.userId,
      totals,
      items,
    );
    if (!updated) {
      throw this.foodLogNotFound(id);
    }
    return {
      id: updated.id,
      status: updated.status,
      items: updated.items,
      totals: publicTotals(updated),
    };
  }

  async remove(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) {
      throw this.foodLogNotFound(id);
    }
  }

  private async calculateItems(
    items: ConfirmRequest['items'],
  ): Promise<FoodLogItemRecord[]> {
    const foods = await this.repository.findFoodsByIds(
      items.map((item) => item.foodId),
    );
    if (foods.length !== items.length) {
      throw new ApplicationError(
        'FOOD_NOT_FOUND',
        'One or more selected foods were not found',
        {},
        404,
      );
    }
    const foodsById = new Map(foods.map((food) => [food.id, food]));
    return items.map((item) => {
      const food = foodsById.get(item.foodId);
      if (!food) {
        throw new ApplicationError(
          'FOOD_NOT_FOUND',
          'Selected food was not found',
          { foodId: item.foodId },
          404,
        );
      }
      return {
        foodId: food.id,
        rawText: item.rawText,
        normalizedName: item.normalizedFoodName,
        preparationState: item.preparationState ?? null,
        quantity: item.quantity,
        unit: item.unit,
        grams: item.grams,
        quantitySource: item.quantitySource,
        assumed: item.assumed,
        nutrition: calculateNutrientsForGrams(nutrients(food), item.grams),
        provider: food.provider,
        providerExternalId: food.providerExternalId,
        sourceSnapshot: {
          foodId: food.id,
          displayName: food.displayName,
          provider: food.provider,
          nutrientsPer100g: nutrients(food),
        },
      };
    });
  }

  private foodLogNotFound(id: string): ApplicationError {
    return new ApplicationError(
      'FOOD_LOG_NOT_FOUND',
      'Food log was not found',
      { id },
      404,
    );
  }
}
