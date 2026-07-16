import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { ApplicationErrorFilter } from './common/application-error.filter.js';
import { loadEnvironment } from './config/env.js';

async function bootstrap(): Promise<void> {
  const environment = loadEnvironment(process.env);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: environment.WEB_ORIGIN });
  app.use(
    (
      request: { headers: Record<string, string | undefined> },
      response: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      const requestId =
        request.headers['x-request-id'] &&
        /^[a-zA-Z0-9._-]{1,100}$/.test(request.headers['x-request-id'])
          ? request.headers['x-request-id']
          : crypto.randomUUID();
      response.setHeader('X-Request-Id', requestId);
      next();
    },
  );
  app.useGlobalFilters(new ApplicationErrorFilter());
  await app.listen(environment.API_PORT);
}
bootstrap().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
