import { describe, expect, it } from 'vitest';
import { FoodResolver, type FoodRepository } from './resolver.js';
import { MockFoodProvider } from '../food-providers/mock.provider.js';

const localFood = {
  id: 'feta',
  normalizedName: 'feta cheese',
  displayName: 'Feta cheese',
  category: 'dairy',
  preparationState: null,
  provider: 'SEED',
  providerExternalId: 'feta',
  nutrientsPer100g: {
    calories: 264,
    protein: 14.2,
    carbohydrates: 4.1,
    fat: 21.3,
    fibre: 0,
  },
  portions: [],
};
const mention = {
  rawText: 'feta',
  normalizedFoodName: 'feta cheese',
  quantity: null,
  unit: null,
  quantifier: 'SOME' as const,
  preparationModifiers: [],
};
describe('food resolver', () => {
  it('uses local aliases before providers', async () => {
    const repository: FoodRepository = {
      findAlias: async () => localFood,
      findByName: async () => [],
      saveExternalFood: async () => localFood,
    };
    const result = await new FoodResolver(
      repository,
      new MockFoodProvider(),
      0.85,
      0.55,
    ).resolve(mention);
    expect(result).toMatchObject({
      food: localFood,
      status: 'RESOLVED',
      confidence: 0.99,
    });
  });
  it('returns unresolved when no provider result exists', async () => {
    const repository: FoodRepository = {
      findAlias: async () => null,
      findByName: async () => [],
      saveExternalFood: async () => localFood,
    };
    const result = await new FoodResolver(
      repository,
      new MockFoodProvider(),
      0.85,
      0.55,
    ).resolve({
      ...mention,
      normalizedFoodName: 'unknown',
    });
    expect(result.status).toBe('UNRESOLVED');
  });
});
