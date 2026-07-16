import { z } from 'zod';

export const recipeSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  servingCount: z.number().positive(),
  ingredients: z
    .array(
      z.object({
        foodId: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string().nullable().optional(),
        grams: z.number().positive(),
      }),
    )
    .min(1),
});

export type RecipeInput = z.infer<typeof recipeSchema>;
