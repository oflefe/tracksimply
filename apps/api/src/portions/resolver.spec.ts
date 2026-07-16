import { describe, expect, it } from 'vitest';
import { PortionResolver, type PortionRepository } from './resolver.js';

const food = {
  id: 'egg',
  normalizedName: 'egg',
  displayName: 'Whole egg',
  category: 'protein',
  preparationState: null,
  provider: 'SEED',
  providerExternalId: 'egg',
  nutrientsPer100g: {
    calories: 143,
    protein: 12.6,
    carbohydrates: 0.7,
    fat: 9.5,
    fibre: 0,
  },
  portions: [{ label: 'piece', amount: 1, unit: 'PIECE', grams: 50 }],
};
const repository: PortionRepository = { findPortionRules: async () => [] };
describe('portion resolver', () => {
  it('converts explicit kilograms and pieces', async () => {
    const resolver = new PortionResolver(repository);
    await expect(
      resolver.resolve(
        {
          rawText: '0.5kg rice',
          normalizedFoodName: 'rice',
          quantity: 0.5,
          unit: 'KILOGRAM',
          quantifier: null,
          preparationModifiers: [],
        },
        food,
        'user',
        'BREAKFAST',
      ),
    ).resolves.toMatchObject({ grams: 500, quantitySource: 'EXPLICIT' });
    await expect(
      resolver.resolve(
        {
          rawText: '2 eggs',
          normalizedFoodName: 'egg',
          quantity: 2,
          unit: null,
          quantifier: null,
          preparationModifiers: [],
        },
        food,
        'user',
        'BREAKFAST',
      ),
    ).resolves.toMatchObject({ grams: 100 });
  });
  it('prefers a user rule over a system rule', async () => {
    const rules = [
      {
        foodId: 'egg',
        foodCategory: null,
        quantifier: 'SOME',
        mealType: 'BREAKFAST' as const,
        grams: 42,
        scope: 'SYSTEM' as const,
        source: 'seed',
        confidence: 0.8,
      },
      {
        foodId: 'egg',
        foodCategory: null,
        quantifier: 'SOME',
        mealType: 'BREAKFAST' as const,
        grams: 55,
        scope: 'USER' as const,
        source: 'correction',
        confidence: 0.95,
      },
    ];
    const resolver = new PortionResolver({
      findPortionRules: async () => rules,
    });
    await expect(
      resolver.resolve(
        {
          rawText: 'some egg',
          normalizedFoodName: 'egg',
          quantity: null,
          unit: null,
          quantifier: 'SOME',
          preparationModifiers: [],
        },
        food,
        'user',
        'BREAKFAST',
      ),
    ).resolves.toMatchObject({
      grams: 55,
      quantitySource: 'USER_PORTION_RULE',
    });
  });
});
