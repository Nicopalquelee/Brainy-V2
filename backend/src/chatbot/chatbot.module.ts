import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { DocumentsModule } from '../documents/documents.module';
import { PdfProcessorService } from '../documents/pdf-processor.service';

@Module({
  imports: [DocumentsModule],
  providers: [ChatbotService, PdfProcessorService],
  controllers: [ChatbotController]
})
export class ChatbotModule {}
