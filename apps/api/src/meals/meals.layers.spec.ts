import { describe, expect, it, vi } from 'vitest';
import { ApplicationError } from '../common/errors.js';
import { MealsController } from './meals.controller.js';
import { MealsService } from './meals.service.js';
import { PrismaMealsRepository } from './prisma-meals.repository.js';

const meal = { id: 'meal-1' };

describe('meal layers', () => {
  it('GIVEN transport inputs WHEN controller methods run THEN each request delegates and shapes deletion', async () => {
    const service = {
      create: vi.fn().mockResolvedValue(meal),
      list: vi.fn().mockResolvedValue([meal]),
      findById: vi.fn().mockResolvedValue(meal),
      update: vi.fn().mockResolvedValue(meal),
      remove: vi.fn().mockResolvedValue(undefined),
    } as unknown as MealsService;
    const controller = new MealsController(service);
    const createInput = {
      userId: 'user-1',
      type: 'BREAKFAST' as const,
      occurredAt: '2026-07-16T08:00:00.000Z',
    };

    await expect(controller.create(createInput)).resolves.toBe(meal);
    await expect(
      controller.list('user-1', 'BREAKFAST', '2026-07-16'),
    ).resolves.toEqual([meal]);
    await expect(controller.get('meal-1')).resolves.toBe(meal);
    await expect(
      controller.update('meal-1', { name: 'Breakfast' }),
    ).resolves.toBe(meal);
    await expect(controller.remove('meal-1')).resolves.toEqual({
      deleted: true,
    });
  });

  it('GIVEN valid meal inputs WHEN service methods run THEN dates and defaults are mapped', async () => {
    const repository = {
      create: vi.fn().mockResolvedValue(meal),
      list: vi.fn().mockResolvedValue([meal]),
      findById: vi.fn().mockResolvedValue(meal),
      update: vi.fn().mockResolvedValue(meal),
      delete: vi.fn().mockResolvedValue(true),
    };
    const service = new MealsService(repository as never);

    await service.create({
      userId: 'user-1',
      type: 'BREAKFAST',
      occurredAt: '2026-07-16T08:00:00.000Z',
    });
    await service.list('user-1', 'BREAKFAST', '2026-07-16');
    await service.list('user-1');
    await expect(service.findById('meal-1')).resolves.toBe(meal);
    await service.update('meal-1', {
      occurredAt: '2026-07-16T09:00:00.000Z',
    });
    await service.update('meal-1', { name: 'Breakfast' });
    await expect(service.remove('meal-1')).resolves.toBeUndefined();

    expect(repository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'BREAKFAST',
      name: null,
      occurredAt: new Date('2026-07-16T08:00:00.000Z'),
    });
    expect(repository.list).toHaveBeenNthCalledWith(1, {
      userId: 'user-1',
      mealType: 'BREAKFAST',
      occurredAt: {
        gte: new Date('2026-07-16T00:00:00.000Z'),
        lt: new Date('2026-07-16T23:59:59.999Z'),
      },
    });
    expect(repository.list).toHaveBeenNthCalledWith(2, {
      userId: 'user-1',
    });
  });

  it('GIVEN missing meals WHEN read update or delete runs THEN service surfaces not found', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(false),
    };
    const service = new MealsService(repository as never);

    await expect(service.findById('missing')).rejects.toMatchObject({
      code: 'MEAL_NOT_FOUND',
    } satisfies Partial<ApplicationError>);
    await expect(
      service.update('missing', { name: 'Missing' }),
    ).rejects.toMatchObject({ code: 'MEAL_NOT_FOUND' });
    await expect(service.remove('missing')).rejects.toMatchObject({
      code: 'MEAL_NOT_FOUND',
    });
  });

  it('GIVEN Prisma delegates WHEN repository methods run THEN queries stay in the repository', async () => {
    const prisma = {
      meal: {
        create: vi.fn().mockResolvedValue(meal),
        findMany: vi.fn().mockResolvedValue([meal]),
        findUnique: vi.fn().mockResolvedValue(meal),
        update: vi.fn().mockResolvedValue(meal),
        deleteMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
      },
    };
    const repository = new PrismaMealsRepository(prisma as never);

    await repository.create({
      userId: 'user-1',
      type: 'BREAKFAST',
      name: null,
      occurredAt: new Date('2026-07-16T08:00:00.000Z'),
    });
    await repository.list({
      userId: 'user-1',
      mealType: 'BREAKFAST',
      occurredAt: {
        gte: new Date('2026-07-16T00:00:00.000Z'),
        lt: new Date('2026-07-17T00:00:00.000Z'),
      },
    });
    await repository.list({ userId: 'user-1' });
    await repository.findById('meal-1');
    await repository.update('meal-1', { name: 'Breakfast' });

    await expect(repository.delete('meal-1')).resolves.toBe(true);
    await expect(repository.delete('missing')).resolves.toBe(false);
  });
});
