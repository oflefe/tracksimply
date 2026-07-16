import { describe, expect, it, vi } from 'vitest';
import { PrismaSuggestionsRepository } from './prisma-suggestions.repository.js';
import { SuggestionsController } from './suggestions.controller.js';
import { SuggestionsService } from './suggestions.service.js';

describe('suggestion layers', () => {
  it('GIVEN a suggestion request WHEN controller handles it THEN service input is delegated', async () => {
    const service = {
      list: vi.fn().mockResolvedValue([]),
    } as unknown as SuggestionsService;
    const controller = new SuggestionsController(service);

    await controller.list('user-1', 'BREAKFAST', '5');

    expect(service.list).toHaveBeenCalledWith('user-1', 'BREAKFAST', '5');
  });

  it('GIVEN suggestion inputs WHEN listed THEN limits and response records are normalized', async () => {
    const repository = {
      findFrequentFoods: vi.fn().mockResolvedValue([
        {
          foodId: 'food-1',
          displayName: 'Toast',
          usageCount: 3,
        },
      ]),
    };
    const service = new SuggestionsService(repository as never);

    await expect(service.list('user-1', 'BREAKFAST', '100')).resolves.toEqual([
      {
        type: 'FOOD',
        id: 'food-1',
        name: 'Toast',
        reason: 'FREQUENT_FOR_MEAL_TYPE',
        usageCount: 3,
      },
    ]);
    await service.list('user-1', undefined, undefined);
    await service.list('user-1', undefined, '0');

    expect(repository.findFrequentFoods).toHaveBeenNthCalledWith(
      1,
      'user-1',
      'BREAKFAST',
      50,
    );
    expect(repository.findFrequentFoods).toHaveBeenNthCalledWith(
      2,
      'user-1',
      undefined,
      10,
    );
    expect(repository.findFrequentFoods).toHaveBeenNthCalledWith(
      3,
      'user-1',
      undefined,
      1,
    );
  });

  it('GIVEN grouped food usage WHEN repository runs THEN names and counts are joined', async () => {
    const prisma = {
      foodLogItem: {
        groupBy: vi
          .fn()
          .mockResolvedValueOnce([
            { foodId: 'food-1', _count: { foodId: 3 } },
            { foodId: null, _count: { foodId: 1 } },
          ])
          .mockResolvedValueOnce([
            { foodId: 'missing-food', _count: { foodId: 2 } },
          ]),
      },
      food: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ id: 'food-1', displayName: 'Toast' }])
          .mockResolvedValueOnce([]),
      },
    };
    const repository = new PrismaSuggestionsRepository(prisma as never);

    await expect(
      repository.findFrequentFoods('user-1', 'BREAKFAST', 5),
    ).resolves.toEqual([
      {
        foodId: 'food-1',
        displayName: 'Toast',
        usageCount: 3,
      },
    ]);
    await expect(
      repository.findFrequentFoods('user-1', undefined, 5),
    ).resolves.toEqual([
      {
        foodId: 'missing-food',
        displayName: null,
        usageCount: 2,
      },
    ]);
  });
});
