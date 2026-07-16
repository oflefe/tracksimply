import { ApplicationError } from '../common/errors.js';
import type {
  ExternalFoodDetails,
  FoodCandidate,
  FoodProvider,
  FoodSearchQuery,
} from './provider.js';
import { normalizeFoodName } from '../parser/parser.js';

export class FoodDataCentralProvider implements FoodProvider {
  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number,
    private readonly maxRetries: number,
    private readonly fetcher: typeof fetch = fetch,
  ) {}
  async search(query: FoodSearchQuery): Promise<FoodCandidate[]> {
    const body = await this.request(
      `/foods/search?api_key=${encodeURIComponent(this.apiKey)}&query=${encodeURIComponent(query.name)}&pageSize=5`,
    );
    const foods = body.foods;
    if (!Array.isArray(foods)) {
      throw new ApplicationError(
        'FOOD_PROVIDER_INVALID_RESPONSE',
        'Food provider returned an invalid search response',
        {},
        502,
      );
    }
    return foods.map((food) => {
      const record = food as Record<string, unknown>;
      return {
        externalId: String(record.fdcId),
        displayName: String(record.description),
        normalizedName: normalizeFoodName(String(record.description)),
        confidence: 0.6,
      };
    });
  }
  async getFood(externalId: string): Promise<ExternalFoodDetails> {
    const body = await this.request(
      `/food/${encodeURIComponent(externalId)}?api_key=${encodeURIComponent(this.apiKey)}`,
    );
    const nutrients = Array.isArray(body.foodNutrients)
      ? body.foodNutrients.filter(
          (item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null,
        )
      : [];
    const find = (number: number): number =>
      Number(
        nutrients.find((item) => Number(item.nutrientId) === number)?.value ??
          0,
      );
    return {
      externalId,
      displayName: String(body.description ?? externalId),
      normalizedName: normalizeFoodName(String(body.description ?? externalId)),
      preparationState: null,
      category: null,
      nutrientsPer100g: {
        calories: find(1008),
        protein: find(1003),
        carbohydrates: find(1005),
        fat: find(1004),
        fibre: find(1079),
      },
      portions: [],
      rawPayload: body,
    };
  }
  private async request(path: string): Promise<Record<string, unknown>> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetcher(
          `https://api.nal.usda.gov/fdc/v1${path}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`provider status ${response.status}`);
        }
        return (await response.json()) as Record<string, unknown>;
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new ApplicationError(
      'FOOD_PROVIDER_UNAVAILABLE',
      'The external food provider is unavailable',
      { reason: lastError instanceof Error ? lastError.message : 'unknown' },
      502,
    );
  }
}
