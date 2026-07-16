import type {
  MealType,
  NutrientTotals,
  QuantitySource,
  UnitName,
} from '@calorie-tracker/contracts';

export interface FoodLogFoodRecord {
  id: string;
  displayName: string;
  provider: string;
  providerExternalId: string;
  caloriesPer100g: unknown;
  proteinPer100g: unknown;
  carbohydratesPer100g: unknown;
  fatPer100g: unknown;
  fibrePer100g: unknown;
}

export interface FoodLogItemRecord {
  foodId: string;
  rawText: string;
  normalizedName: string;
  preparationState: string | null;
  quantity: number | null;
  unit: UnitName | null;
  grams: number;
  quantitySource: QuantitySource;
  assumed: boolean;
  nutrition: NutrientTotals;
  provider: string;
  providerExternalId: string;
  sourceSnapshot: Record<string, unknown>;
}

export interface CreateFoodLogRecord {
  userId: string;
  mealId?: string | null;
  mealType: MealType;
  occurredAt: Date;
  rawText: string;
  totals: NutrientTotals;
  items: FoodLogItemRecord[];
  calculationVersion: string;
  idempotency?: {
    endpoint: string;
    key: string;
  };
}

export interface PersistedFoodLogItem {
  id: string;
  foodId: string | null;
  rawText: string;
  grams: unknown;
  calories: unknown;
  protein: unknown;
  carbohydrates: unknown;
  fat: unknown;
  fibre: unknown;
  [key: string]: unknown;
}

export interface PersistedFoodLog {
  id: string;
  mealId: string;
  status: string;
  totalCalories: unknown;
  totalProtein: unknown;
  totalCarbohydrates: unknown;
  totalFat: unknown;
  totalFibre: unknown;
  items: PersistedFoodLogItem[];
  [key: string]: unknown;
}

export interface FoodLogDetails extends PersistedFoodLog {
  meal: unknown;
  inputEvent: {
    rawText: string;
  };
}

export interface FoodLogsRepository {
  findIdempotentResponse(
    userId: string,
    endpoint: string,
    key: string,
  ): Promise<Record<string, unknown> | null>;
  findFoodsByIds(ids: string[]): Promise<FoodLogFoodRecord[]>;
  createConfirmed(
    input: CreateFoodLogRecord,
    createResponse: (log: PersistedFoodLog) => Record<string, unknown>,
  ): Promise<Record<string, unknown> | null>;
  findById(id: string): Promise<FoodLogDetails | null>;
  replaceItems(
    id: string,
    userId: string,
    totals: NutrientTotals,
    items: FoodLogItemRecord[],
  ): Promise<PersistedFoodLog | null>;
  delete(id: string): Promise<boolean>;
}
