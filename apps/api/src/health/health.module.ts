import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { PrismaHealthRepository } from './prisma-health.repository.js';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [PrismaHealthRepository, HealthService],
})
export class HealthModule {}
