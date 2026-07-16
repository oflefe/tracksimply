import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  mealCreateSchema,
  mealUpdateSchema,
  type MealType,
} from '@calorie-tracker/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  MealsService,
  type CreateMealInput,
  type UpdateMealInput,
} from './meals.service.js';

@Controller('meals')
export class MealsController {
  constructor(private readonly service: MealsService) {}

  @Post() async create(
    @Body(new ZodValidationPipe(mealCreateSchema))
    body: CreateMealInput,
  ): Promise<unknown> {
    return this.service.create(body);
  }

  @Get() async list(
    @Query('userId') userId: string,
    @Query('mealType') mealType?: MealType,
    @Query('date') date?: string,
  ): Promise<unknown> {
    return this.service.list(userId, mealType, date);
  }

  @Get(':id') async get(@Param('id') id: string): Promise<unknown> {
    return this.service.findById(id);
  }

  @Patch(':id') async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(mealUpdateSchema))
    body: UpdateMealInput,
  ): Promise<unknown> {
    return this.service.update(id, body);
  }

  @Delete(':id') async remove(
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.service.remove(id);
    return { deleted: true };
  }
}
