import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { PortionRepository, PortionRuleRecord } from './resolver.js';
import type { MealType } from '@calorie-tracker/contracts';

@Injectable()
export class PrismaPortionRepository implements PortionRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findPortionRules(input: {
    userId: string;
    foodId: string;
    category: string | null;
    quantifier: string;
    mealType: MealType;
  }): Promise<PortionRuleRecord[]> {
    const rules = await this.prisma.portionRule.findMany({
      where: {
        quantifier: input.quantifier,
        OR: [{ userId: input.userId }, { scope: 'SYSTEM' }],
        AND: [
          { OR: [{ foodId: input.foodId }, { foodId: null }] },
          { OR: [{ foodCategory: input.category }, { foodCategory: null }] },
          { OR: [{ mealType: input.mealType }, { mealType: null }] },
        ],
      },
      orderBy: { confidence: 'desc' },
    });
    return rules.map((rule) => ({
      foodId: rule.foodId,
      foodCategory: rule.foodCategory,
      quantifier: rule.quantifier,
      mealType: rule.mealType,
      grams: Number(rule.grams),
      scope: rule.scope,
      source: rule.source,
      confidence: Number(rule.confidence),
    }));
  }
}
