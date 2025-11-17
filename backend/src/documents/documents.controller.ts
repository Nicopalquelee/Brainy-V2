import { Body, Controller, Get, Param, Post, Put, Delete, UploadedFile, UseInterceptors, Query, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocConverterService } from './doc-converter.service';
import { unlink } from 'fs/promises';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private docs: DocumentsService,
    private docConverter: DocConverterService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const name = Date.now();
          const fileExt = extname(file.originalname);
          cb(null, `${name}${fileExt}`);
        }
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/epub+zip'
        ];
        if (!allowed.includes(file.mimetype)) {
          return cb(new Error('Invalid file type'), false);
        }
        cb(null, true);
      }
    })
  )
  async create(@UploadedFile() file: any, @Body() dto: CreateDocumentDto, @Req() req: any) {
    let originalFilePath: string | null = null;
    try {
      const userId = req?.user?.sub || req?.user?.userId;
      let contentUrl = file ? `/uploads/${file.filename}` : dto.contentUrl;
      let fileType = file ? file.mimetype : dto.fileType;
      let fileSize = file ? file.size : dto.fileSize;
      
      // Si el archivo es DOC/DOCX, convertirlo a PDF
      if (file && this.docConverter.isDocFile(file.mimetype, file.filename)) {
        try {
          const originalPath = join(process.cwd(), 'uploads', file.filename);
          originalFilePath = originalPath;
          
          console.log(`🔄 Convirtiendo ${file.filename} a PDF...`);
          const pdfPath = await this.docConverter.convertDocToPdf(originalPath);
          
          // Verificar que el PDF se generó correctamente
          const fs = require('fs');
          if (!fs.existsSync(pdfPath)) {
            throw new Error(`El PDF no se generó en la ubicación esperada: ${pdfPath}`);
          }
          
          // Extraer solo el nombre del archivo PDF (sin la ruta completa)
          const pdfFilename = pdfPath.split(/[/\\]/).pop() || file.filename.replace(/\.(doc|docx)$/i, '.pdf');
          
          // Actualizar los valores para usar el PDF
          contentUrl = `/uploads/${pdfFilename}`;
          fileType = 'application/pdf';
          
          // Obtener el tamaño del archivo PDF generado
          const stats = fs.statSync(pdfPath);
          fileSize = stats.size;
          
          // Eliminar el archivo DOC/DOCX original DESPUÉS de verificar que el PDF existe
          try {
            await unlink(originalPath);
            console.log(`✅ Archivo original ${file.filename} eliminado después de la conversión`);
          } catch (unlinkError) {
            console.warn(`⚠️ No se pudo eliminar el archivo original: ${unlinkError}`);
            // No lanzar error, el PDF ya está guardado
          }
          
          console.log(`✅ Conversión completada: ${pdfFilename} (${fileSize} bytes)`);
        } catch (conversionError) {
          console.error('❌ Error al convertir DOC/DOCX a PDF:', conversionError);
          // Si falla la conversión, continuar con el archivo original
          // pero mostrar un warning
          console.warn('⚠️ Continuando con el archivo original sin conversión');
        }
      }
      
      return await this.docs.create({ 
        ...dto, 
        contentUrl,
        fileType,
        fileSize,
        author_id: userId
      });
    } catch (err: unknown) {
      // Limpiar archivo original si existe y hubo error
      if (originalFilePath) {
        try {
          await unlink(originalFilePath);
        } catch (cleanupError) {
          console.warn('⚠️ Error al limpiar archivo temporal:', cleanupError);
        }
      }
      // Normalize multer and other errors as BadRequest
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      throw new BadRequestException(errorMessage);
    }
  }

  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 12;
    return this.docs.list(pageNum, pageSizeNum);
  }

  @Get('search')
  search(@Query('q') q?: string) {
    const qstr = (q || '').trim();
    return this.docs.search(qstr);
  }

  @Get('popular')
  async getPopular() {
    return this.docs.getPopular();
  }

  @Get('recent')
  async getRecent() {
    return this.docs.getRecent();
  }

  @Get('stats')
  async stats() {
    return this.docs.getStats();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    // simple UUID v4 check to avoid treating '/stats' as id
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(id)) {
      throw new BadRequestException('Invalid document id');
    }
    return this.docs.find(id);
  }

  @Post(':id/rate')
  rate(@Param('id') id: string, @Body() body: { score: number }) {
    return this.docs.rate(id, body.score);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { title?: string; subject?: string }) {
    return this.docs.update(id, body as any);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.docs.delete(id);
  }

  @Post(':id/visit')
  async incrementVisits(@Param('id') id: string) {
    return this.docs.incrementViews(id);
  }

  @Post(':id/download')
  async incrementDownloads(@Param('id') id: string) {
    return this.docs.incrementDownloads(id);
  }
}
