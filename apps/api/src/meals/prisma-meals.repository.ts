import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  CreateMealRecord,
  MealListFilters,
  MealRecord,
  MealsRepository,
  UpdateMealRecord,
} from './meals.repository.js';

@Injectable()
export class PrismaMealsRepository implements MealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateMealRecord): Promise<MealRecord> {
    return this.prisma.meal.create({ data: input });
  }

  list(filters: MealListFilters): Promise<MealRecord[]> {
    return this.prisma.meal.findMany({
      where: {
        userId: filters.userId,
        ...(filters.mealType ? { type: filters.mealType } : {}),
        ...(filters.occurredAt ? { occurredAt: filters.occurredAt } : {}),
      },
      include: { foodLogs: { include: { items: true } } },
      orderBy: { occurredAt: 'desc' },
    });
  }

  findById(id: string): Promise<MealRecord | null> {
    return this.prisma.meal.findUnique({
      where: { id },
      include: { foodLogs: { include: { items: true } } },
    });
  }

  update(id: string, input: UpdateMealRecord): Promise<MealRecord> {
    return this.prisma.meal.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.meal.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
