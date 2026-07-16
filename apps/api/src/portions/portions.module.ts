import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PrismaPortionRepository } from './prisma-portion.repository.js';
import { PortionResolver } from './resolver.js';

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaPortionRepository,
    {
      provide: PortionResolver,
      useFactory: (repository: PrismaPortionRepository) =>
        new PortionResolver(repository),
      inject: [PrismaPortionRepository],
    },
  ],
  exports: [PortionResolver],
})
export class PortionsModule {}
