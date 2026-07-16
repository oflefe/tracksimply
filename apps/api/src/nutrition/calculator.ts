import type { NutrientTotals } from '@calorie-tracker/contracts';

export const PARSER_VERSION = '1.0.0';
export const CALCULATION_VERSION = '1.0.0';
export type NutrientsPer100g = NutrientTotals;
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
export function calculateNutrientsForGrams(
  nutrientsPer100g: NutrientsPer100g,
  grams: number,
): NutrientTotals {
  return {
    calories: roundTo((nutrientsPer100g.calories * grams) / 100, 4),
    protein: roundTo((nutrientsPer100g.protein * grams) / 100, 4),
    carbohydrates: roundTo((nutrientsPer100g.carbohydrates * grams) / 100, 4),
    fat: roundTo((nutrientsPer100g.fat * grams) / 100, 4),
    fibre: roundTo((nutrientsPer100g.fibre * grams) / 100, 4),
  };
}
export function addNutrients(values: NutrientTotals[]): NutrientTotals {
  return {
    calories: roundTo(
      values.reduce((sum, value) => sum + value.calories, 0),
      4,
    ),
    protein: roundTo(
      values.reduce((sum, value) => sum + value.protein, 0),
      4,
    ),
    carbohydrates: roundTo(
      values.reduce((sum, value) => sum + value.carbohydrates, 0),
      4,
    ),
    fat: roundTo(
      values.reduce((sum, value) => sum + value.fat, 0),
      4,
    ),
    fibre: roundTo(
      values.reduce((sum, value) => sum + value.fibre, 0),
      4,
    ),
  };
}
export function toDisplayNutrients(value: NutrientTotals): NutrientTotals {
  return Object.fromEntries(
    Object.entries(value).map(([key, amount]) => [key, roundTo(amount, 1)]),
  ) as NutrientTotals;
}
