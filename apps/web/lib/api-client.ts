import {
  previewResponseSchema,
  type PreviewRequest,
  type PreviewResponse,
  type ConfirmRequest,
} from '@calorie-tracker/contracts';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly requestId: string | null,
    readonly code: string,
  ) {
    super(message);
  }
}
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
async function request<T>(
  path: string,
  init: RequestInit,
  schema: { parse: (value: unknown) => T },
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const requestId = response.headers.get('X-Request-Id');
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = body as { error?: { code?: string; message?: string } };
    throw new ApiClientError(
      error.error?.message ?? 'Request failed',
      requestId,
      error.error?.code ?? 'INTERNAL_ERROR',
    );
  }
  return schema.parse(body);
}
export function previewFoodLog(
  input: PreviewRequest,
): Promise<PreviewResponse> {
  return request(
    '/food-logs/preview',
    { method: 'POST', body: JSON.stringify(input) },
    previewResponseSchema,
  );
}
export function confirmFoodLog(
  input: ConfirmRequest,
  idempotencyKey: string,
): Promise<unknown> {
  return request(
    '/food-logs',
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    },
    { parse: (value) => value },
  );
}
