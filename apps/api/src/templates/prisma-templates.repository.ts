import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  CreateTemplateRecord,
  TemplatesRepository,
} from './templates.repository.js';

@Injectable()
export class PrismaTemplatesRepository implements TemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateTemplateRecord): Promise<unknown> {
    return this.prisma.template.create({
      data: {
        userId: input.userId,
        name: input.name,
        mealType: input.mealType,
        items: { create: input.items },
      },
      include: { items: true },
    });
  }

  listByUserId(userId: string): Promise<unknown[]> {
    return this.prisma.template.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findById(id: string): Promise<unknown | null> {
    return this.prisma.template.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.template.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
