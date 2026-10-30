import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiException } from './api-exception';

interface ErrorBody {
  error: string;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = this.toErrorBody(exception);
    response.status(status).json(body);
  }

  private toErrorBody(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof ApiException) {
      const status = exception.getStatus();
      const payload = exception.getResponse() as ErrorBody;
      return { status, body: payload };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message = this.extractMessage(response);
      return { status, body: { error: 'VALIDATION_ERROR', message } };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    };
  }

  private extractMessage(response: unknown): string {
    if (typeof response === 'string') {
      return response;
    }
    if (response && typeof response === 'object' && 'message' in response) {
      const message = (response as { message: unknown }).message;
      return Array.isArray(message) ? message.join('; ') : String(message);
    }
    return 'Request failed validation.';
  }
}
