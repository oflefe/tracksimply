import { describe, expect, it, vi } from 'vitest';
import { PrismaTemplatesRepository } from './prisma-templates.repository.js';
import { TemplatesController } from './templates.controller.js';
import type { TemplateInput } from './templates.schema.js';
import { TemplatesService } from './templates.service.js';

const templateInput: TemplateInput = {
  userId: 'user-1',
  name: 'Breakfast',
  items: [
    {
      foodId: 'food-1',
      quantity: 1,
    },
  ],
};

describe('template layers', () => {
  it('GIVEN template requests WHEN controller methods run THEN service methods are delegated', async () => {
    const service = {
      create: vi.fn().mockResolvedValue({ id: 'template-1' }),
      list: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue({ id: 'template-1' }),
      remove: vi.fn().mockResolvedValue(undefined),
    } as unknown as TemplatesService;
    const controller = new TemplatesController(service);

    await controller.create(templateInput);
    await controller.list('user-1');
    await controller.findById('template-1');
    await expect(controller.remove('template-1')).resolves.toEqual({
      deleted: true,
    });

    expect(service.create).toHaveBeenCalledWith(templateInput);
    expect(service.list).toHaveBeenCalledWith('user-1');
    expect(service.findById).toHaveBeenCalledWith('template-1');
    expect(service.remove).toHaveBeenCalledWith('template-1');
  });

  it('GIVEN template input WHEN template methods run THEN positions defaults and errors are handled', async () => {
    const repository = {
      create: vi.fn().mockResolvedValue({ id: 'template-1' }),
      listByUserId: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue({ id: 'template-1' }),
      delete: vi.fn().mockResolvedValue(true),
    };
    const service = new TemplatesService(repository as never);

    await service.create(templateInput);
    await expect(service.list('user-1')).resolves.toEqual([]);
    await expect(service.findById('template-1')).resolves.toEqual({
      id: 'template-1',
    });
    await expect(service.remove('template-1')).resolves.toBeUndefined();

    expect(repository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Breakfast',
      mealType: null,
      items: [{ foodId: 'food-1', quantity: 1, position: 0 }],
    });

    repository.findById.mockResolvedValueOnce(null);
    repository.delete.mockResolvedValueOnce(false);
    await expect(service.findById('missing')).rejects.toMatchObject({
      code: 'TEMPLATE_NOT_FOUND',
    });
    await expect(service.remove('missing')).rejects.toMatchObject({
      code: 'TEMPLATE_NOT_FOUND',
    });
  });

  it('GIVEN Prisma template delegates WHEN repository methods run THEN persistence is isolated', async () => {
    const prisma = {
      template: {
        create: vi.fn().mockResolvedValue({ id: 'template-1' }),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue({ id: 'template-1' }),
        deleteMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
      },
    };
    const repository = new PrismaTemplatesRepository(prisma as never);

    await repository.create({
      userId: 'user-1',
      name: 'Breakfast',
      mealType: null,
      items: [{ foodId: 'food-1', quantity: 1, position: 0 }],
    });
    await repository.listByUserId('user-1');
    await repository.findById('template-1');
    await expect(repository.delete('template-1')).resolves.toBe(true);
    await expect(repository.delete('missing')).resolves.toBe(false);
  });
});
