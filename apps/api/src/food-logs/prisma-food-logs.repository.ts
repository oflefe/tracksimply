import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import type {
  CreateFoodLogRecord,
  FoodLogDetails,
  FoodLogFoodRecord,
  FoodLogItemRecord,
  FoodLogsRepository,
  PersistedFoodLog,
} from './food-logs.repository.js';

function createItemData(item: FoodLogItemRecord) {
  return {
    foodId: item.foodId,
    rawText: item.rawText,
    normalizedName: item.normalizedName,
    preparationState: item.preparationState,
    quantity: item.quantity,
    unit: item.unit,
    grams: item.grams,
    quantitySource: item.quantitySource,
    assumed: item.assumed,
    resolutionConfidence: 1,
    calories: item.nutrition.calories,
    protein: item.nutrition.protein,
    carbohydrates: item.nutrition.carbohydrates,
    fat: item.nutrition.fat,
    fibre: item.nutrition.fibre,
    nutritionBasis: 'PER_100_GRAMS' as const,
    provider: item.provider,
    providerExternalId: item.providerExternalId,
    sourceSnapshot: item.sourceSnapshot as Prisma.InputJsonValue,
  };
}

@Injectable()
export class PrismaFoodLogsRepository implements FoodLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findIdempotentResponse(
    userId: string,
    endpoint: string,
    key: string,
  ): Promise<Record<string, unknown> | null> {
    const record = await this.prisma.idempotencyKey.findUnique({
      where: {
        userId_endpoint_key: {
          userId,
          endpoint,
          key,
        },
      },
    });
    return record?.response
      ? (record.response as Record<string, unknown>)
      : null;
  }

  findFoodsByIds(ids: string[]): Promise<FoodLogFoodRecord[]> {
    return this.prisma.food.findMany({
      where: { id: { in: ids } },
    });
  }

  createConfirmed(
    input: CreateFoodLogRecord,
    createResponse: (log: PersistedFoodLog) => Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    return this.prisma.$transaction(async (transaction) => {
      const meal = input.mealId
        ? await transaction.meal.findFirst({
            where: {
              id: input.mealId,
              userId: input.userId,
            },
          })
        : await transaction.meal.create({
            data: {
              userId: input.userId,
              type: input.mealType,
              occurredAt: input.occurredAt,
            },
          });
      if (!meal) {
        return null;
      }
      const inputEvent = await transaction.inputEvent.create({
        data: {
          userId: input.userId,
          rawText: input.rawText,
          source: 'TEXT',
          parserVersion: '1.0.0',
        },
      });
      const log = await transaction.foodLog.create({
        data: {
          mealId: meal.id,
          inputEventId: inputEvent.id,
          status: 'CONFIRMED',
          totalCalories: input.totals.calories,
          totalProtein: input.totals.protein,
          totalCarbohydrates: input.totals.carbohydrates,
          totalFat: input.totals.fat,
          totalFibre: input.totals.fibre,
          calculationVersion: input.calculationVersion,
          items: {
            create: input.items.map(createItemData),
          },
        },
        include: {
          items: true,
          meal: true,
        },
      });
      const response = createResponse(log);
      if (input.idempotency) {
        await transaction.idempotencyKey.create({
          data: {
            userId: input.userId,
            endpoint: input.idempotency.endpoint,
            key: input.idempotency.key,
            response: response as Prisma.InputJsonValue,
            foodLogId: log.id,
          },
        });
      }
      return response;
    });
  }

  findById(id: string): Promise<FoodLogDetails | null> {
    return this.prisma.foodLog.findUnique({
      where: { id },
      include: {
        items: true,
        meal: true,
        inputEvent: true,
      },
    });
  }

  replaceItems(
    id: string,
    userId: string,
    totals: CreateFoodLogRecord['totals'],
    items: FoodLogItemRecord[],
  ): Promise<PersistedFoodLog | null> {
    return this.prisma.$transaction(async (transaction) => {
      const log = await transaction.foodLog.findFirst({
        where: {
          id,
          meal: { userId },
        },
      });
      if (!log) {
        return null;
      }
      await transaction.foodLogItem.deleteMany({
        where: { foodLogId: id },
      });
      return transaction.foodLog.update({
        where: { id },
        data: {
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbohydrates: totals.carbohydrates,
          totalFat: totals.fat,
          totalFibre: totals.fibre,
          items: {
            create: items.map(createItemData),
          },
        },
        include: { items: true },
      });
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.foodLog.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
