import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PdfProcessorService } from './pdf-processor.service';
import { DocConverterService } from './doc-converter.service';

@Module({
  providers: [DocumentsService, PdfProcessorService, DocConverterService],
  controllers: [DocumentsController],
  exports: [DocumentsService, PdfProcessorService, DocConverterService]
})
export class DocumentsModule {}