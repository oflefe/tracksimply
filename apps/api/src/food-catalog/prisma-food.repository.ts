import { Injectable } from '@nestjs/common';
import type { Food, Prisma } from '@prisma/client';
import type { ExternalFoodDetails } from '../food-providers/provider.js';
import { normalizeFoodName } from '../parser/parser.js';
import { PrismaService } from '../database/prisma.service.js';
import type { FoodRecord, FoodRepository } from './resolver.js';

function toFoodRecord(
  food: Food & {
    portions?: Array<{
      label: string;
      amount: Prisma.Decimal;
      unit: string;
      grams: Prisma.Decimal;
    }>;
  },
): FoodRecord {
  return {
    id: food.id,
    normalizedName: food.normalizedName,
    displayName: food.displayName,
    category: food.category,
    preparationState: food.preparationState,
    provider: food.provider,
    providerExternalId: food.providerExternalId,
    nutrientsPer100g: {
      calories: Number(food.caloriesPer100g),
      protein: Number(food.proteinPer100g),
      carbohydrates: Number(food.carbohydratesPer100g),
      fat: Number(food.fatPer100g),
      fibre: Number(food.fibrePer100g),
    },
    portions: (food.portions ?? []).map((portion) => ({
      label: portion.label,
      amount: Number(portion.amount),
      unit: portion.unit,
      grams: Number(portion.grams),
    })),
  };
}
@Injectable()
export class PrismaFoodRepository implements FoodRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findAlias(alias: string): Promise<FoodRecord | null> {
    const food = await this.prisma.foodAlias.findFirst({
      where: { normalizedAlias: normalizeFoodName(alias) },
      include: { food: { include: { portions: true } } },
    });
    return food ? toFoodRecord(food.food) : null;
  }
  async findByName(
    name: string,
    preparationState: string | null,
  ): Promise<FoodRecord[]> {
    const foods = await this.prisma.food.findMany({
      where: {
        normalizedName: name,
        ...(preparationState ? { preparationState } : {}),
      },
      include: { portions: true },
    });
    return foods.map(toFoodRecord);
  }
  async saveExternalFood(food: ExternalFoodDetails): Promise<FoodRecord> {
    const saved = await this.prisma.food.upsert({
      where: {
        provider_providerExternalId: {
          provider: 'USDA_FDC',
          providerExternalId: food.externalId,
        },
      },
      create: {
        normalizedName: food.normalizedName,
        displayName: food.displayName,
        preparationState: food.preparationState,
        category: food.category,
        provider: 'USDA_FDC',
        providerExternalId: food.externalId,
        caloriesPer100g: food.nutrientsPer100g.calories,
        proteinPer100g: food.nutrientsPer100g.protein,
        carbohydratesPer100g: food.nutrientsPer100g.carbohydrates,
        fatPer100g: food.nutrientsPer100g.fat,
        fibrePer100g: food.nutrientsPer100g.fibre,
        rawProviderPayload: food.rawPayload as Prisma.InputJsonValue,
        fetchedAt: new Date(),
        portions: {
          create: food.portions.map((portion) => ({
            ...portion,
            source: 'USDA_FDC',
          })),
        },
      },
      update: {
        rawProviderPayload: food.rawPayload as Prisma.InputJsonValue,
        fetchedAt: new Date(),
        caloriesPer100g: food.nutrientsPer100g.calories,
        proteinPer100g: food.nutrientsPer100g.protein,
        carbohydratesPer100g: food.nutrientsPer100g.carbohydrates,
        fatPer100g: food.nutrientsPer100g.fat,
        fibrePer100g: food.nutrientsPer100g.fibre,
      },
      include: { portions: true },
    });
    return toFoodRecord(saved);
  }
}
