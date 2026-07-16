import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { recipeSchema, type RecipeInput } from './recipes.schema.js';
import { RecipesService } from './recipes.service.js';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly service: RecipesService) {}

  @Post() create(
    @Body(new ZodValidationPipe(recipeSchema)) body: RecipeInput,
  ): Promise<unknown> {
    return this.service.create(body);
  }

  @Get() list(@Query('userId') userId: string): Promise<unknown> {
    return this.service.list(userId);
  }

  @Get(':id') findById(@Param('id') id: string): Promise<unknown> {
    return this.service.findById(id);
  }

  @Delete(':id') async remove(
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.service.remove(id);
    return { deleted: true };
  }
}
