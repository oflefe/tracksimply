import { Injectable } from '@nestjs/common';
import { ApplicationError } from '../common/errors.js';
import { PrismaTemplatesRepository } from './prisma-templates.repository.js';
import type { TemplateInput } from './templates.schema.js';

@Injectable()
export class TemplatesService {
  constructor(private readonly repository: PrismaTemplatesRepository) {}

  create(input: TemplateInput): Promise<unknown> {
    return this.repository.create({
      userId: input.userId,
      name: input.name,
      mealType: input.mealType ?? null,
      items: input.items.map((item, position) => ({
        ...item,
        position,
      })),
    });
  }

  list(userId: string): Promise<unknown[]> {
    return this.repository.listByUserId(userId);
  }

  async findById(id: string): Promise<unknown> {
    const template = await this.repository.findById(id);
    if (!template) {
      throw this.notFound(id);
    }
    return template;
  }

  async remove(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) {
      throw this.notFound(id);
    }
  }

  private notFound(id: string): ApplicationError {
    return new ApplicationError(
      'TEMPLATE_NOT_FOUND',
      'Template was not found',
      { id },
      404,
    );
  }
}
