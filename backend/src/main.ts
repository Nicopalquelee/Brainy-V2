import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validaciones globales
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Necesario para JWT, cookies y sesiones
  app.use(cookieParser());

  // ============================
  // 🔵 CORS PARA PRODUCCIÓN
  // ============================
  const configService = app.get(ConfigService);
  const originSetting = configService.get<string>('app.corsOrigin') || '*';
  // Allow '*' or a comma-separated list of origins
  const corsOrigin = originSetting === '*'
    ? true
    : originSetting.split(',').map(o => o.trim()).filter(Boolean);
  app.enableCors({ 
    origin: corsOrigin, 
    credentials: true 
  });

  // ============================
  // 🔵 SWAGGER
  // ============================
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

  // Alias a /api-docs
  app.getHttpAdapter().get('/api-docs', (req: unknown, res: any) =>
    res.redirect('/docs')
  );

  // OpenAPI JSON
  app.getHttpAdapter().get('/docs-json', (req: unknown, res: any) =>
    res.json(document)
  );

  // ============================
  // 🔵 HEALTH CHECK
  // ============================
  app.getHttpAdapter().get('/health', (req: unknown, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ============================
  // 🔵 API PREFIX
  // ============================
  app.setGlobalPrefix('api');

  // ============================
  // 🔵 STATIC FILES (/uploads)
  // ============================
  app.use('/uploads', express.static('uploads'));

  // ============================
  // 🔵 PUERTO PARA RENDER
  // ============================
  const port = process.env.PORT || 3000;
  await app.listen(port, "0.0.0.0");

  console.log(`Server listening on http://localhost:${port}`);
}

bootstrap();
