import type { NutrientTotals } from '@calorie-tracker/contracts';

export interface RecipeFoodRecord {
  id: string;
  displayName: string;
  caloriesPer100g: unknown;
  proteinPer100g: unknown;
  carbohydratesPer100g: unknown;
  fatPer100g: unknown;
  fibrePer100g: unknown;
}

export interface RecipeIngredientRecord {
  foodId: string;
  quantity: number;
  unit: string | null;
  grams: number;
  nutrition: NutrientTotals;
  sourceSnapshot: {
    foodId: string;
    displayName: string;
  };
  position: number;
}

export interface CreateRecipeRecord {
  userId: string;
  name: string;
  description: string | null;
  servingCount: number;
  nutritionPerServing: NutrientTotals;
  ingredients: RecipeIngredientRecord[];
}

export interface RecipesRepository {
  findFoodsByIds(ids: string[]): Promise<RecipeFoodRecord[]>;
  create(input: CreateRecipeRecord): Promise<unknown>;
  listByUserId(userId: string): Promise<unknown[]>;
  findById(id: string): Promise<unknown | null>;
  delete(id: string): Promise<boolean>;
}
