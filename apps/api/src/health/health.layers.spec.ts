import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { PrismaHealthRepository } from './prisma-health.repository.js';

describe('health layers', () => {
  it('GIVEN a live request WHEN handled THEN returns ok', () => {
    const controller = new HealthController({} as HealthService);

    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('GIVEN a ready database WHEN readiness is checked THEN delegates through every layer', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ result: 1 }]);
    const repository = new PrismaHealthRepository({
      $queryRaw: queryRaw,
    } as never);
    const service = new HealthService(repository);
    const controller = new HealthController(service);

    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
    expect(queryRaw).toHaveBeenCalledOnce();
  });
});
