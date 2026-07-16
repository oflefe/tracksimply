import type {
  FoodCandidate,
  FoodProvider,
  ExternalFoodDetails,
  FoodSearchQuery,
} from './provider.js';
import { normalizeFoodName } from '../parser/parser.js';

export class MockFoodProvider implements FoodProvider {
  constructor(private readonly foods: ExternalFoodDetails[] = []) {}
  async search(query: FoodSearchQuery): Promise<FoodCandidate[]> {
    return this.foods
      .filter((food) =>
        food.normalizedName.includes(normalizeFoodName(query.name)),
      )
      .map((food) => ({
        externalId: food.externalId,
        displayName: food.displayName,
        normalizedName: food.normalizedName,
        confidence: 0.8,
        details: food,
      }));
  }
  async getFood(externalId: string): Promise<ExternalFoodDetails> {
    const food = this.foods.find(
      (candidate) => candidate.externalId === externalId,
    );
    if (!food) {
      throw new Error('External food not found');
    }
    return food;
  }
}
