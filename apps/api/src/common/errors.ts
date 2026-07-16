export type ApplicationErrorCode =
  | 'VALIDATION_ERROR'
  | 'FOOD_NOT_FOUND'
  | 'FOOD_RESOLUTION_AMBIGUOUS'
  | 'PORTION_UNRESOLVED'
  | 'FOOD_PROVIDER_UNAVAILABLE'
  | 'FOOD_PROVIDER_INVALID_RESPONSE'
  | 'MEAL_NOT_FOUND'
  | 'FOOD_LOG_NOT_FOUND'
  | 'RECIPE_NOT_FOUND'
  | 'TEMPLATE_NOT_FOUND'
  | 'IDEMPOTENCY_CONFLICT'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';
export class ApplicationError extends Error {
  constructor(
    readonly code: ApplicationErrorCode,
    message: string,
    readonly details: Record<string, unknown> = {},
    readonly status = 400,
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
