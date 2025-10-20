import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    AuthModule,
    UsersModule,
    DocumentsModule,
    ChatbotModule,
    HealthModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
