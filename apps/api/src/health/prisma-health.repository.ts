import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { HealthRepository } from './health.repository.js';

@Injectable()
export class PrismaHealthRepository implements HealthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabaseConnection(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
