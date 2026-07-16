import { Controller, Get, Query } from '@nestjs/common';
import type { MealType } from '@calorie-tracker/contracts';
import { SuggestionsService } from './suggestions.service.js';

@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly service: SuggestionsService) {}

  @Get() list(
    @Query('userId') userId: string,
    @Query('mealType') mealType?: MealType,
    @Query('limit') rawLimit?: string,
  ): Promise<unknown> {
    return this.service.list(userId, mealType, rawLimit);
  }
}
