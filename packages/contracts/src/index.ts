import { z } from 'zod';

export const mealTypes = [
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACK',
  'CUSTOM',
] as const;
export const unitNames = [
  'GRAM',
  'KILOGRAM',
  'MILLILITRE',
  'LITRE',
  'TEASPOON',
  'TABLESPOON',
  'CUP',
  'PIECE',
  'SLICE',
  'HANDFUL',
  'BOWL',
  'SERVING',
] as const;
export const quantitySources = [
  'EXPLICIT',
  'USER_PORTION_RULE',
  'SYSTEM_PORTION_RULE',
  'PROVIDER_SERVING',
  'CATEGORY_DEFAULT',
  'UNRESOLVED',
] as const;
export const previewStatuses = ['READY', 'NEEDS_REVIEW', 'FAILED'] as const;
export const mealTypeSchema = z.enum(mealTypes);
export const unitSchema = z.enum(unitNames);
export const nutrientTotalsSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbohydrates: z.number(),
  fat: z.number(),
  fibre: z.number(),
});
export const previewRequestSchema = z.object({
  userId: z.string().min(1),
  mealType: mealTypeSchema,
  occurredAt: z.string().datetime(),
  input: z.string().min(1).max(10000),
});
export const previewItemSchema = z.object({
  index: z.number().int().nonnegative(),
  rawText: z.string(),
  normalizedFoodName: z.string(),
  food: z
    .object({
      id: z.string(),
      name: z.string(),
      provider: z.string(),
      externalId: z.string().nullable(),
    })
    .nullable(),
  quantity: z.number().nullable(),
  unit: unitSchema.nullable(),
  grams: z.number().nullable(),
  quantitySource: z.enum(quantitySources),
  assumed: z.boolean(),
  resolutionConfidence: z.number().min(0).max(1),
  nutrition: nutrientTotalsSchema.nullable(),
  candidates: z.array(
    z.object({ id: z.string(), name: z.string(), confidence: z.number() }),
  ),
  warnings: z.array(z.string()),
});
export const previewResponseSchema = z.object({
  parserVersion: z.string(),
  calculationVersion: z.string(),
  status: z.enum(previewStatuses),
  items: z.array(previewItemSchema),
  totals: nutrientTotalsSchema,
  warnings: z.array(z.string()),
});
export const confirmItemSchema = z.object({
  foodId: z.string().min(1),
  rawText: z.string().min(1),
  normalizedFoodName: z.string().min(1),
  preparationState: z.string().nullable().optional(),
  quantity: z.number().positive().nullable(),
  unit: unitSchema.nullable(),
  grams: z.number().positive(),
  assumed: z.boolean(),
  quantitySource: z.enum(quantitySources),
});
export const confirmRequestSchema = z.object({
  userId: z.string().min(1),
  mealType: mealTypeSchema,
  mealId: z.string().nullable().optional(),
  occurredAt: z.string().datetime(),
  input: z.string().min(1).max(10000),
  items: z.array(confirmItemSchema).min(1),
});
export const foodLogUpdateSchema = z.object({
  userId: z.string().min(1),
  items: z.array(confirmItemSchema).min(1),
});
export const mealCreateSchema = z.object({
  userId: z.string().min(1),
  type: mealTypeSchema,
  name: z.string().max(120).nullable().optional(),
  occurredAt: z.string().datetime(),
});
export const mealUpdateSchema = mealCreateSchema
  .partial()
  .omit({ userId: true });
export const idSchema = z.object({ id: z.string().min(1) });
export type MealType = (typeof mealTypes)[number];
export type UnitName = (typeof unitNames)[number];
export type QuantitySource = (typeof quantitySources)[number];
export type NutrientTotals = z.infer<typeof nutrientTotalsSchema>;
export type PreviewRequest = z.infer<typeof previewRequestSchema>;
export type PreviewResponse = z.infer<typeof previewResponseSchema>;
export type ConfirmRequest = z.infer<typeof confirmRequestSchema>;
export type FoodLogUpdate = z.infer<typeof foodLogUpdateSchema>;
