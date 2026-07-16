import { describe, expect, it, vi } from 'vitest';
import type { ConfirmRequest } from '@calorie-tracker/contracts';
import { FoodLogsController } from './food-logs.controller.js';
import { FoodLogsService } from './food-logs.service.js';
import type {
  CreateFoodLogRecord,
  PersistedFoodLog,
} from './food-logs.repository.js';
import { FoodPipelineService } from './food-pipeline.service.js';
import { PrismaFoodLogsRepository } from './prisma-food-logs.repository.js';

const request: ConfirmRequest = {
  userId: 'user-1',
  mealType: 'BREAKFAST',
  occurredAt: '2026-07-16T08:00:00.000Z',
  input: '100 g toast',
  items: [
    {
      foodId: 'food-1',
      rawText: '100 g toast',
      normalizedFoodName: 'toast',
      quantity: 100,
      unit: 'GRAM',
      grams: 100,
      assumed: false,
      quantitySource: 'EXPLICIT',
    },
  ],
};

const food = {
  id: 'food-1',
  displayName: 'Toast',
  provider: 'SEED',
  providerExternalId: 'food-1',
  caloriesPer100g: 200,
  proteinPer100g: 10,
  carbohydratesPer100g: 40,
  fatPer100g: 2,
  fibrePer100g: 4,
};

const persistedLog: PersistedFoodLog = {
  id: 'log-1',
  mealId: 'meal-1',
  status: 'CONFIRMED',
  totalCalories: 200,
  totalProtein: 10,
  totalCarbohydrates: 40,
  totalFat: 2,
  totalFibre: 4,
  items: [
    {
      id: 'item-1',
      foodId: 'food-1',
      rawText: '100 g toast',
      grams: 100,
      calories: 200,
      protein: 10,
      carbohydrates: 40,
      fat: 2,
      fibre: 4,
    },
  ],
};

const createRecord: CreateFoodLogRecord = {
  userId: 'user-1',
  mealType: 'BREAKFAST',
  occurredAt: new Date('2026-07-16T08:00:00.000Z'),
  rawText: '100 g toast',
  totals: {
    calories: 200,
    protein: 10,
    carbohydrates: 40,
    fat: 2,
    fibre: 4,
  },
  items: [
    {
      foodId: 'food-1',
      rawText: '100 g toast',
      normalizedName: 'toast',
      preparationState: null,
      quantity: 100,
      unit: 'GRAM',
      grams: 100,
      quantitySource: 'EXPLICIT',
      assumed: false,
      nutrition: {
        calories: 200,
        protein: 10,
        carbohydrates: 40,
        fat: 2,
        fibre: 4,
      },
      provider: 'SEED',
      providerExternalId: 'food-1',
      sourceSnapshot: { foodId: 'food-1' },
    },
  ],
  calculationVersion: '1.0.0',
};

describe('food log layers', () => {
  it('GIVEN food log requests WHEN controller methods run THEN transport delegates and shapes deletion', async () => {
    const pipeline = {
      preview: vi.fn().mockResolvedValue({ response: { status: 'READY' } }),
    } as unknown as FoodPipelineService;
    const service = {
      confirm: vi.fn().mockResolvedValue({ id: 'log-1' }),
      findById: vi.fn().mockResolvedValue({ id: 'log-1' }),
      update: vi.fn().mockResolvedValue({ id: 'log-1' }),
      remove: vi.fn().mockResolvedValue(undefined),
    } as unknown as FoodLogsService;
    const controller = new FoodLogsController(pipeline, service);

    await expect(
      controller.preview({
        userId: 'user-1',
        mealType: 'BREAKFAST',
        occurredAt: request.occurredAt,
        input: request.input,
      }),
    ).resolves.toEqual({ status: 'READY' });
    await expect(controller.confirm(request, 'key-1')).resolves.toEqual({
      id: 'log-1',
    });
    await expect(controller.get('log-1')).resolves.toEqual({ id: 'log-1' });
    await expect(
      controller.update('log-1', {
        userId: request.userId,
        items: request.items,
      }),
    ).resolves.toEqual({ id: 'log-1' });
    await expect(controller.remove('log-1')).resolves.toEqual({
      deleted: true,
    });
  });

  it('GIVEN an existing idempotent response WHEN confirming THEN cached response returns immediately', async () => {
    const cached = { id: 'cached-log' };
    const repository = {
      findIdempotentResponse: vi.fn().mockResolvedValue(cached),
    };
    const service = new FoodLogsService(repository as never);

    await expect(service.confirm(request, 'key-1')).resolves.toBe(cached);
  });

  it('GIVEN resolved foods WHEN confirming updating reading and deleting THEN service calculates and maps results', async () => {
    const repository = {
      findIdempotentResponse: vi.fn().mockResolvedValue(null),
      findFoodsByIds: vi.fn().mockResolvedValue([food]),
      createConfirmed: vi
        .fn()
        .mockImplementation(
          async (
            _input: CreateFoodLogRecord,
            responseFactory: (log: PersistedFoodLog) => Record<string, unknown>,
          ) => responseFactory(persistedLog),
        ),
      findById: vi.fn().mockResolvedValue({
        ...persistedLog,
        totalFibre: null,
        meal: { id: 'meal-1' },
        inputEvent: { rawText: request.input },
      }),
      replaceItems: vi.fn().mockResolvedValue(persistedLog),
      delete: vi.fn().mockResolvedValue(true),
    };
    const service = new FoodLogsService(repository as never);

    await expect(service.confirm(request, 'key-1')).resolves.toEqual({
      id: 'log-1',
      mealId: 'meal-1',
      status: 'CONFIRMED',
      items: [
        {
          id: 'item-1',
          rawText: '100 g toast',
          foodId: 'food-1',
          grams: 100,
          nutrition: {
            calories: 200,
            protein: 10,
            carbohydrates: 40,
            fat: 2,
            fibre: 4,
          },
        },
      ],
      totals: {
        calories: 200,
        protein: 10,
        carbohydrates: 40,
        fat: 2,
        fibre: 4,
      },
    });
    await expect(service.confirm(request, undefined)).resolves.toMatchObject({
      id: 'log-1',
    });
    await expect(service.findById('log-1')).resolves.toMatchObject({
      rawText: request.input,
    });
    await expect(
      service.update('log-1', {
        userId: request.userId,
        items: request.items,
      }),
    ).resolves.toMatchObject({ id: 'log-1' });
    await expect(service.remove('log-1')).resolves.toBeUndefined();

    expect(repository.createConfirmed).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        idempotency: {
          endpoint: 'POST:/food-logs',
          key: 'key-1',
        },
      }),
      expect.any(Function),
    );
    expect(repository.createConfirmed).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({ idempotency: expect.anything() }),
      expect.any(Function),
    );
  });

  it('GIVEN missing persistence records WHEN service methods run THEN domain errors surface', async () => {
    const repository = {
      findIdempotentResponse: vi.fn().mockResolvedValue(null),
      findFoodsByIds: vi.fn().mockResolvedValue([food]),
      createConfirmed: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue(null),
      replaceItems: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(false),
    };
    const service = new FoodLogsService(repository as never);

    await expect(service.confirm(request, undefined)).rejects.toMatchObject({
      code: 'MEAL_NOT_FOUND',
    });
    await expect(service.findById('missing')).rejects.toMatchObject({
      code: 'FOOD_LOG_NOT_FOUND',
    });
    await expect(
      service.update('missing', {
        userId: request.userId,
        items: request.items,
      }),
    ).rejects.toMatchObject({ code: 'FOOD_LOG_NOT_FOUND' });
    await expect(service.remove('missing')).rejects.toMatchObject({
      code: 'FOOD_LOG_NOT_FOUND',
    });
  });

  it('GIVEN incomplete or mismatched foods WHEN calculating items THEN food errors surface', async () => {
    const missingCountService = new FoodLogsService({
      findFoodsByIds: vi.fn().mockResolvedValue([]),
    } as never);
    const mismatchedFoodService = new FoodLogsService({
      findFoodsByIds: vi.fn().mockResolvedValue([
        {
          ...food,
          id: 'other-food',
        },
      ]),
    } as never);

    await expect(
      missingCountService.confirm(request, undefined),
    ).rejects.toMatchObject({ code: 'FOOD_NOT_FOUND' });
    await expect(
      mismatchedFoodService.confirm(request, undefined),
    ).rejects.toMatchObject({ code: 'FOOD_NOT_FOUND' });
  });

  it('GIVEN idempotency records and foods WHEN repository reads THEN Prisma results are converted', async () => {
    const prisma = {
      idempotencyKey: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ response: { id: 'log-1' } })
          .mockResolvedValueOnce(null),
      },
      food: {
        findMany: vi.fn().mockResolvedValue([food]),
      },
    };
    const repository = new PrismaFoodLogsRepository(prisma as never);

    await expect(
      repository.findIdempotentResponse('user-1', 'endpoint', 'key'),
    ).resolves.toEqual({ id: 'log-1' });
    await expect(
      repository.findIdempotentResponse('user-1', 'endpoint', 'missing'),
    ).resolves.toBeNull();
    await expect(repository.findFoodsByIds(['food-1'])).resolves.toEqual([
      food,
    ]);
  });

  it('GIVEN a new meal WHEN confirmed with idempotency THEN repository persists the transaction', async () => {
    const transaction = {
      meal: {
        create: vi.fn().mockResolvedValue({ id: 'meal-1' }),
        findFirst: vi.fn(),
      },
      inputEvent: {
        create: vi.fn().mockResolvedValue({ id: 'input-1' }),
      },
      foodLog: {
        create: vi.fn().mockResolvedValue(persistedLog),
      },
      idempotencyKey: {
        create: vi.fn().mockResolvedValue({ id: 'key-1' }),
      },
    };
    const repository = new PrismaFoodLogsRepository({
      $transaction: vi.fn(
        async (operation: (value: typeof transaction) => unknown) =>
          operation(transaction),
      ),
    } as never);

    await expect(
      repository.createConfirmed(
        {
          ...createRecord,
          idempotency: { endpoint: 'endpoint', key: 'key-1' },
        },
        (log) => ({ id: log.id }),
      ),
    ).resolves.toEqual({ id: 'log-1' });
    expect(transaction.meal.create).toHaveBeenCalledOnce();
    expect(transaction.idempotencyKey.create).toHaveBeenCalledOnce();
  });

  it('GIVEN an existing meal WHEN confirmed without idempotency THEN repository reuses the meal', async () => {
    const transaction = {
      meal: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({ id: 'meal-1' }),
      },
      inputEvent: {
        create: vi.fn().mockResolvedValue({ id: 'input-1' }),
      },
      foodLog: {
        create: vi.fn().mockResolvedValue(persistedLog),
      },
      idempotencyKey: {
        create: vi.fn(),
      },
    };
    const repository = new PrismaFoodLogsRepository({
      $transaction: vi.fn(
        async (operation: (value: typeof transaction) => unknown) =>
          operation(transaction),
      ),
    } as never);

    await expect(
      repository.createConfirmed(
        { ...createRecord, mealId: 'meal-1' },
        (log) => ({ id: log.id }),
      ),
    ).resolves.toEqual({ id: 'log-1' });
    expect(transaction.meal.findFirst).toHaveBeenCalledOnce();
    expect(transaction.idempotencyKey.create).not.toHaveBeenCalled();
  });

  it('GIVEN a missing requested meal WHEN confirming THEN repository returns null before writes', async () => {
    const transaction = {
      meal: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      inputEvent: {
        create: vi.fn(),
      },
      foodLog: {
        create: vi.fn(),
      },
      idempotencyKey: {
        create: vi.fn(),
      },
    };
    const repository = new PrismaFoodLogsRepository({
      $transaction: vi.fn(
        async (operation: (value: typeof transaction) => unknown) =>
          operation(transaction),
      ),
    } as never);

    await expect(
      repository.createConfirmed(
        { ...createRecord, mealId: 'missing' },
        () => ({ id: 'unused' }),
      ),
    ).resolves.toBeNull();
    expect(transaction.inputEvent.create).not.toHaveBeenCalled();
  });

  it('GIVEN food log records WHEN repository reads replaces and deletes THEN Prisma remains isolated', async () => {
    const foundTransaction = {
      foodLog: {
        findFirst: vi.fn().mockResolvedValue({ id: 'log-1' }),
        update: vi.fn().mockResolvedValue(persistedLog),
      },
      foodLogItem: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const missingTransaction = {
      foodLog: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
      foodLogItem: {
        deleteMany: vi.fn(),
      },
    };
    const prisma = {
      foodLog: {
        findUnique: vi.fn().mockResolvedValue({
          ...persistedLog,
          meal: {},
          inputEvent: { rawText: request.input },
        }),
        deleteMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
      },
      $transaction: vi
        .fn()
        .mockImplementationOnce(
          async (operation: (value: typeof foundTransaction) => unknown) =>
            operation(foundTransaction),
        )
        .mockImplementationOnce(
          async (operation: (value: typeof missingTransaction) => unknown) =>
            operation(missingTransaction),
        ),
    };
    const repository = new PrismaFoodLogsRepository(prisma as never);

    await expect(repository.findById('log-1')).resolves.toMatchObject({
      id: 'log-1',
    });
    await expect(
      repository.replaceItems(
        'log-1',
        'user-1',
        createRecord.totals,
        createRecord.items,
      ),
    ).resolves.toBe(persistedLog);
    await expect(
      repository.replaceItems(
        'missing',
        'user-1',
        createRecord.totals,
        createRecord.items,
      ),
    ).resolves.toBeNull();
    await expect(repository.delete('log-1')).resolves.toBe(true);
    await expect(repository.delete('missing')).resolves.toBe(false);
  });
});
