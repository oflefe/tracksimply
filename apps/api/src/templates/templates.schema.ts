import { z } from 'zod';

export const templateSchema = z
  .object({
    userId: z.string().min(1),
    name: z.string().min(1),
    mealType: z
      .enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'CUSTOM'])
      .nullable()
      .optional(),
    items: z
      .array(
        z.object({
          foodId: z.string().nullable().optional(),
          recipeId: z.string().nullable().optional(),
          quantity: z.number().positive(),
          unit: z.string().nullable().optional(),
          grams: z.number().positive().nullable().optional(),
        }),
      )
      .min(1),
  })
  .superRefine((value, context) =>
    value.items.forEach((item, index) => {
      if ((item.foodId ? 1 : 0) + (item.recipeId ? 1 : 0) !== 1) {
        context.addIssue({
          code: 'custom',
          path: ['items', index],
          message: 'Exactly one of foodId or recipeId is required',
        });
      }
    }),
  );

export type TemplateInput = z.infer<typeof templateSchema>;
