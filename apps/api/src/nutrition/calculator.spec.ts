import { describe, expect, it } from 'vitest';
import {
  addNutrients,
  calculateNutrientsForGrams,
  toDisplayNutrients,
} from './calculator.js';

describe('nutrition calculator', () => {
  it('calculates per-100g nutrients proportionally', () => {
    expect(
      calculateNutrientsForGrams(
        { calories: 200, protein: 10, carbohydrates: 20, fat: 5, fibre: 2 },
        50,
      ),
    ).toEqual({
      calories: 100,
      protein: 5,
      carbohydrates: 10,
      fat: 2.5,
      fibre: 1,
    });
  });
  it('aggregates and rounds display values', () => {
    const totals = addNutrients([
      { calories: 100.12345, protein: 1, carbohydrates: 2, fat: 3, fibre: 0 },
      { calories: 50.12345, protein: 2, carbohydrates: 1, fat: 1, fibre: 0.5 },
    ]);
    expect(totals.calories).toBe(150.2469);
    expect(toDisplayNutrients(totals).calories).toBe(150.2);
  });
});
