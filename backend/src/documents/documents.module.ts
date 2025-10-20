import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PdfProcessorService } from './pdf-processor.service';

@Module({
  providers: [DocumentsService, PdfProcessorService],
  controllers: [DocumentsController],
  exports: [DocumentsService, PdfProcessorService]
})
export class DocumentsModule {}