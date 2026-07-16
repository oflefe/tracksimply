import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: [
        'src/**/*.module.ts',
        'src/health/*.controller.ts',
        'src/health/*.service.ts',
        'src/health/prisma-*.repository.ts',
        'src/meals/*.controller.ts',
        'src/meals/*.service.ts',
        'src/meals/prisma-*.repository.ts',
        'src/recipes/*.controller.ts',
        'src/recipes/*.service.ts',
        'src/recipes/prisma-*.repository.ts',
        'src/templates/*.controller.ts',
        'src/templates/*.service.ts',
        'src/templates/prisma-*.repository.ts',
        'src/suggestions/*.controller.ts',
        'src/suggestions/*.service.ts',
        'src/suggestions/prisma-*.repository.ts',
        'src/food-logs/*.controller.ts',
        'src/food-logs/food-logs.service.ts',
        'src/food-logs/prisma-food-logs.repository.ts',
      ],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
