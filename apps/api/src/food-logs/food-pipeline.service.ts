import { Injectable } from '@nestjs/common';
import type {
  MealType,
  NutrientTotals,
  PreviewResponse,
  QuantitySource,
  UnitName,
} from '@calorie-tracker/contracts';
import type { ParsedFoodMention } from '../parser/parser.js';
import { parseFoodInput } from '../parser/parser.js';
import {
  addNutrients,
  CALCULATION_VERSION,
  calculateNutrientsForGrams,
  PARSER_VERSION,
  toDisplayNutrients,
} from '../nutrition/calculator.js';
import { FoodResolver, type ResolvedFood } from '../food-catalog/resolver.js';
import { PortionResolver } from '../portions/resolver.js';
import { ApplicationError } from '../common/errors.js';

interface PipelineItem {
  index: number;
  rawText: string;
  normalizedFoodName: string;
  food: {
    id: string;
    name: string;
    provider: string;
    externalId: string | null;
  } | null;
  quantity: number | null;
  unit: UnitName | null;
  grams: number | null;
  quantitySource: QuantitySource;
  assumed: boolean;
  resolutionConfidence: number;
  nutrition: NutrientTotals | null;
  candidates: Array<{ id: string; name: string; confidence: number }>;
  warnings: string[];
  foodRecord?: ResolvedFood['food'];
}
@Injectable()
export class FoodPipelineService {
  constructor(
    private readonly foodResolver: FoodResolver,
    private readonly portionResolver: PortionResolver,
  ) {}
  async preview(input: {
    userId: string;
    mealType: MealType;
    rawText: string;
  }): Promise<{
    response: PreviewResponse;
    parsed: ParsedFoodMention[];
    pipelineItems: PipelineItem[];
  }> {
    const parsed = parseFoodInput(input.rawText);
    const pipelineItems: PipelineItem[] = [];
    const warnings: string[] = [];
    for (const [index, mention] of parsed.entries()) {
      const resolved = await this.foodResolver.resolve(mention);
      const item: PipelineItem = {
        index,
        rawText: mention.rawText,
        normalizedFoodName: mention.normalizedFoodName,
        food: resolved.food
          ? {
              id: resolved.food.id,
              name: resolved.food.displayName,
              provider: resolved.food.provider,
              externalId: resolved.food.providerExternalId,
            }
          : null,
        quantity: mention.quantity,
        unit: mention.unit as UnitName | null,
        grams: null,
        quantitySource: 'UNRESOLVED',
        assumed: false,
        resolutionConfidence: resolved.confidence,
        nutrition: null,
        candidates: resolved.candidates.map((candidate) => ({
          id: candidate.externalId,
          name: candidate.displayName,
          confidence: candidate.confidence,
        })),
        warnings: [],
        foodRecord: resolved.food ?? undefined,
      };
      if (!resolved.food) {
        item.warnings.push(
          resolved.status === 'NEEDS_REVIEW'
            ? 'Select a food candidate before saving'
            : 'Food could not be resolved',
        );
        warnings.push(`${mention.rawText}: ${item.warnings[0]}`);
        pipelineItems.push(item);
        continue;
      }
      try {
        const portion = await this.portionResolver.resolve(
          mention,
          resolved.food,
          input.userId,
          input.mealType,
        );
        item.grams = portion.grams;
        item.quantitySource = portion.quantitySource;
        item.assumed = portion.assumed;
        if (portion.warning) {
          item.warnings.push(portion.warning);
          warnings.push(`${mention.rawText}: ${portion.warning}`);
        }
        item.nutrition = calculateNutrientsForGrams(
          resolved.food.nutrientsPer100g,
          portion.grams,
        );
      } catch (error) {
        if (!(error instanceof ApplicationError)) {
          throw error;
        }
        item.warnings.push(error.message);
        warnings.push(`${mention.rawText}: ${error.message}`);
      }
      pipelineItems.push(item);
    }
    const totals = addNutrients(
      pipelineItems.flatMap((item) => (item.nutrition ? [item.nutrition] : [])),
    );
    const status = pipelineItems.some(
      (item) => !item.nutrition || item.candidates.length > 0,
    )
      ? 'NEEDS_REVIEW'
      : 'READY';
    const response: PreviewResponse = {
      parserVersion: PARSER_VERSION,
      calculationVersion: CALCULATION_VERSION,
      status,
      items: pipelineItems.map(({ foodRecord, ...publicItem }) => publicItem),
      totals: toDisplayNutrients(totals),
      warnings,
    };
    return { response, parsed, pipelineItems };
  }
}
