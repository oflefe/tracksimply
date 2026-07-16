import { Injectable } from '@nestjs/common';
import { PrismaHealthRepository } from './prisma-health.repository.js';

@Injectable()
export class HealthService {
  constructor(private readonly repository: PrismaHealthRepository) {}

  async checkReadiness(): Promise<void> {
    await this.repository.checkDatabaseConnection();
  }
}
