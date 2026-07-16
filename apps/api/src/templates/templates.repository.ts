import type { MealType } from '@calorie-tracker/contracts';

export interface CreateTemplateItemRecord {
  foodId?: string | null;
  recipeId?: string | null;
  quantity: number;
  unit?: string | null;
  grams?: number | null;
  position: number;
}

export interface CreateTemplateRecord {
  userId: string;
  name: string;
  mealType: MealType | null;
  items: CreateTemplateItemRecord[];
}

export interface TemplatesRepository {
  create(input: CreateTemplateRecord): Promise<unknown>;
  listByUserId(userId: string): Promise<unknown[]>;
  findById(id: string): Promise<unknown | null>;
  delete(id: string): Promise<boolean>;
}
