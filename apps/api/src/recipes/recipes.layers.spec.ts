import { describe, expect, it, vi } from 'vitest';
import { PrismaRecipesRepository } from './prisma-recipes.repository.js';
import { RecipesController } from './recipes.controller.js';
import type { RecipeInput } from './recipes.schema.js';
import { RecipesService } from './recipes.service.js';

const recipeInput: RecipeInput = {
  userId: 'user-1',
  name: 'Toast',
  servingCount: 2,
  ingredients: [
    {
      foodId: 'food-1',
      quantity: 1,
      grams: 100,
    },
  ],
};

describe('recipe layers', () => {
  it('GIVEN recipe requests WHEN controller methods run THEN service methods are delegated', async () => {
    const service = {
      create: vi.fn().mockResolvedValue({ id: 'recipe-1' }),
      list: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue({ id: 'recipe-1' }),
      remove: vi.fn().mockResolvedValue(undefined),
    } as unknown as RecipesService;
    const controller = new RecipesController(service);

    await controller.create(recipeInput);
    await controller.list('user-1');
    await controller.findById('recipe-1');
    await expect(controller.remove('recipe-1')).resolves.toEqual({
      deleted: true,
    });

    expect(service.create).toHaveBeenCalledWith(recipeInput);
    expect(service.list).toHaveBeenCalledWith('user-1');
    expect(service.findById).toHaveBeenCalledWith('recipe-1');
    expect(service.remove).toHaveBeenCalledWith('recipe-1');
  });

  it('GIVEN recipe foods WHEN a recipe is created THEN nutrition and persistence input are calculated', async () => {
    const repository = {
      findFoodsByIds: vi.fn().mockResolvedValue([
        {
          id: 'food-1',
          displayName: 'Toast',
          caloriesPer100g: 200,
          proteinPer100g: 10,
          carbohydratesPer100g: 40,
          fatPer100g: 2,
          fibrePer100g: 4,
        },
      ]),
      create: vi.fn().mockResolvedValue({ id: 'recipe-1' }),
      listByUserId: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue({ id: 'recipe-1' }),
      delete: vi.fn().mockResolvedValue(true),
    };
    const service = new RecipesService(repository as never);

    await expect(service.create(recipeInput)).resolves.toEqual({
      id: 'recipe-1',
    });
    await expect(service.list('user-1')).resolves.toEqual([]);
    await expect(service.findById('recipe-1')).resolves.toEqual({
      id: 'recipe-1',
    });
    await expect(service.remove('recipe-1')).resolves.toBeUndefined();

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: null,
        nutritionPerServing: {
          calories: 100,
          protein: 5,
          carbohydrates: 20,
          fat: 1,
          fibre: 2,
        },
      }),
    );
  });

  it('GIVEN incomplete recipe foods WHEN creation runs THEN missing food errors surface', async () => {
    const missingCountService = new RecipesService({
      findFoodsByIds: vi.fn().mockResolvedValue([]),
    } as never);
    const mismatchedFoodService = new RecipesService({
      findFoodsByIds: vi.fn().mockResolvedValue([
        {
          id: 'other-food',
          displayName: 'Other',
          caloriesPer100g: 1,
          proteinPer100g: 1,
          carbohydratesPer100g: 1,
          fatPer100g: 1,
          fibrePer100g: 1,
        },
      ]),
    } as never);

    await expect(missingCountService.create(recipeInput)).rejects.toMatchObject(
      { code: 'FOOD_NOT_FOUND' },
    );
    await expect(
      mismatchedFoodService.create(recipeInput),
    ).rejects.toMatchObject({ code: 'FOOD_NOT_FOUND' });
  });

  it('GIVEN missing recipes WHEN read or delete runs THEN recipe not found surfaces', async () => {
    const service = new RecipesService({
      findById: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(false),
    } as never);

    await expect(service.findById('missing')).rejects.toMatchObject({
      code: 'RECIPE_NOT_FOUND',
    });
    await expect(service.remove('missing')).rejects.toMatchObject({
      code: 'RECIPE_NOT_FOUND',
    });
  });

  it('GIVEN Prisma recipe delegates WHEN repository methods run THEN persistence is isolated', async () => {
    const prisma = {
      food: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      recipe: {
        create: vi.fn().mockResolvedValue({ id: 'recipe-1' }),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue({ id: 'recipe-1' }),
        deleteMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
      },
    };
    const repository = new PrismaRecipesRepository(prisma as never);

    await repository.findFoodsByIds(['food-1']);
    await repository.create({
      userId: 'user-1',
      name: 'Toast',
      description: null,
      servingCount: 1,
      nutritionPerServing: {
        calories: 100,
        protein: 1,
        carbohydrates: 2,
        fat: 3,
        fibre: 4,
      },
      ingredients: [
        {
          foodId: 'food-1',
          quantity: 1,
          unit: null,
          grams: 100,
          nutrition: {
            calories: 100,
            protein: 1,
            carbohydrates: 2,
            fat: 3,
            fibre: 4,
          },
          sourceSnapshot: {
            foodId: 'food-1',
            displayName: 'Toast',
          },
          position: 0,
        },
      ],
    });
    await repository.listByUserId('user-1');
    await repository.findById('recipe-1');
    await expect(repository.delete('recipe-1')).resolves.toBe(true);
    await expect(repository.delete('missing')).resolves.toBe(false);
  });
});
