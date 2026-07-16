import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Get,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  confirmRequestSchema,
  foodLogUpdateSchema,
  previewRequestSchema,
  type ConfirmRequest,
  type FoodLogUpdate,
  type PreviewRequest,
} from '@calorie-tracker/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { FoodPipelineService } from './food-pipeline.service.js';
import { FoodLogsService } from './food-logs.service.js';

@Controller('food-logs')
export class FoodLogsController {
  constructor(
    private readonly pipeline: FoodPipelineService,
    private readonly service: FoodLogsService,
  ) {}
  @Post('preview') async preview(
    @Body(new ZodValidationPipe(previewRequestSchema)) request: PreviewRequest,
  ): Promise<unknown> {
    return (
      await this.pipeline.preview({
        userId: request.userId,
        mealType: request.mealType,
        rawText: request.input,
      })
    ).response;
  }
  @Post() async confirm(
    @Body(new ZodValidationPipe(confirmRequestSchema)) request: ConfirmRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<unknown> {
    return this.service.confirm(request, idempotencyKey);
  }
  @Get(':id') async get(@Param('id') id: string): Promise<unknown> {
    return this.service.findById(id);
  }
  @Patch(':id') async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(foodLogUpdateSchema)) request: FoodLogUpdate,
  ): Promise<unknown> {
    return this.service.update(id, request);
  }
  @Delete(':id') async remove(
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.service.remove(id);
    return { deleted: true };
  }
}
