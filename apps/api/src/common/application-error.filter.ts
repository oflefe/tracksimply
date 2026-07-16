import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApplicationError } from './errors.js';

@Catch()
export class ApplicationErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request & { id?: string }>();
    const requestId =
      request.id ?? response.getHeader('X-Request-Id')?.toString() ?? 'unknown';
    if (exception instanceof ApplicationError) {
      response.status(exception.status).json({
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
          requestId,
        },
      });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(
        typeof body === 'object'
          ? {
              ...body,
              error: { ...(typeof body === 'object' ? body : {}), requestId },
            }
          : {
              error: {
                code: 'INTERNAL_ERROR',
                message: String(body),
                requestId,
              },
            },
      );
      return;
    }
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId,
      },
    });
  }
}
