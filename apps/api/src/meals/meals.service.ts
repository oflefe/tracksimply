import { Injectable } from '@nestjs/common';
import type { MealType } from '@calorie-tracker/contracts';
import { ApplicationError } from '../common/errors.js';
import { PrismaMealsRepository } from './prisma-meals.repository.js';
import type { MealRecord } from './meals.repository.js';

export interface CreateMealInput {
  userId: string;
  type: MealType;
  name?: string | null;
  occurredAt: string;
}

export interface UpdateMealInput {
  type?: MealType;
  name?: string | null;
  occurredAt?: string;
}

@Injectable()
export class MealsService {
  constructor(private readonly repository: PrismaMealsRepository) {}

  create(input: CreateMealInput): Promise<MealRecord> {
    return this.repository.create({
      userId: input.userId,
      type: input.type,
      name: input.name ?? null,
      occurredAt: new Date(input.occurredAt),
    });
  }

  list(
    userId: string,
    mealType?: MealType,
    date?: string,
  ): Promise<MealRecord[]> {
    return this.repository.list({
      userId,
      ...(mealType ? { mealType } : {}),
      ...(date
        ? {
            occurredAt: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lt: new Date(`${date}T23:59:59.999Z`),
            },
          }
        : {}),
    });
  }

  async findById(id: string): Promise<MealRecord> {
    const meal = await this.repository.findById(id);
    if (!meal) {
      throw this.notFound(id);
    }
    return meal;
  }

  async update(id: string, input: UpdateMealInput): Promise<MealRecord> {
    await this.findById(id);
    return this.repository.update(id, {
      ...input,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
    });
  }

  async remove(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) {
      throw this.notFound(id);
    }
  }

  private notFound(id: string): ApplicationError {
    return new ApplicationError(
      'MEAL_NOT_FOUND',
      'Meal was not found',
      { id },
      404,
    );
  }
}
