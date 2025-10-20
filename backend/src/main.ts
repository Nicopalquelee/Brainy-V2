import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('Portal Académico USS - API')
    .setDescription('API para gestión académica, documentos y chatbot')
    .setVersion('0.1.0')
    .addTag('auth')
    .addTag('users')
    .addTag('documents')
    .addTag('chat')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  // alias route for compatibility
  app.getHttpAdapter().get('/api-docs', (req: unknown, res: any) => res.redirect('/docs'));
  // raw JSON OpenAPI spec
  app.getHttpAdapter().get('/docs-json', (req: unknown, res: any) => res.json(document));

  // enable CORS with origin from config
  const configService = app.get(ConfigService);
  const originSetting = configService.get<string>('app.corsOrigin') || '*';
  // Allow '*' or a comma-separated list of origins
  const corsOrigin = originSetting === '*'
    ? true
    : originSetting.split(',').map(o => o.trim()).filter(Boolean);
  app.enableCors({ origin: corsOrigin, credentials: true });

  // set API global prefix
  app.setGlobalPrefix('api');

  // serve uploads as static files at /uploads
  app.use('/uploads', express.static('uploads'));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}`);
}

bootstrap();
