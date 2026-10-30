// MUST run before any other import: decorators like @WebSocketGateway read
// process.env at module-evaluation time, which happens as soon as AppModule
// (and anything it imports) is required below.
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // No authentication layer protects this API (FR-001/FR-002), so CORS is
  // restricted to the configured frontend origin only (plan.md Constraints).
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
