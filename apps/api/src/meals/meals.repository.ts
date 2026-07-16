import type { MealType } from '@calorie-tracker/contracts';

export interface CreateMealRecord {
  userId: string;
  type: MealType;
  name: string | null;
  occurredAt: Date;
}

export interface MealListFilters {
  userId: string;
  mealType?: MealType;
  occurredAt?: {
    gte: Date;
    lt: Date;
  };
}

export interface UpdateMealRecord {
  type?: MealType;
  name?: string | null;
  occurredAt?: Date;
}

export interface MealRecord {
  id: string;
  [key: string]: unknown;
}

export interface MealsRepository {
  create(input: CreateMealRecord): Promise<MealRecord>;
  list(filters: MealListFilters): Promise<MealRecord[]>;
  findById(id: string): Promise<MealRecord | null>;
  update(id: string, input: UpdateMealRecord): Promise<MealRecord>;
  delete(id: string): Promise<boolean>;
}
