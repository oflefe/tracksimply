import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PrismaTemplatesRepository } from './prisma-templates.repository.js';
import { TemplatesController } from './templates.controller.js';
import { TemplatesService } from './templates.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [TemplatesController],
  providers: [PrismaTemplatesRepository, TemplatesService],
})
export class TemplatesModule {}
