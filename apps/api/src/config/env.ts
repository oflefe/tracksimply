import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  FDC_API_KEY: z.string().default(''),
  FOOD_PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  FOOD_PROVIDER_MAX_RETRIES: z.coerce.number().int().nonnegative().default(2),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  AUTO_ACCEPT_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.85),
  REVIEW_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.55),
});
export type Environment = z.infer<typeof environmentSchema>;
export function loadEnvironment(input: NodeJS.ProcessEnv): Environment {
  return environmentSchema.parse(input);
}
