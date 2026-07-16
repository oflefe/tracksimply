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
import { TemplatesService } from './templates.service.js';
import { templateSchema, type TemplateInput } from './templates.schema.js';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @Post() create(
    @Body(new ZodValidationPipe(templateSchema)) body: TemplateInput,
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
