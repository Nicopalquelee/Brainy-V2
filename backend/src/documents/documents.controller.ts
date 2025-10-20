import { Body, Controller, Get, Param, Post, Put, Delete, UploadedFile, UseInterceptors, Query, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private docs: DocumentsService) {}

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
    try {
      const contentUrl = file ? `/uploads/${file.filename}` : dto.contentUrl;
      const fileType = file ? file.mimetype : dto.fileType;
      const fileSize = file ? file.size : dto.fileSize;
      const userId = req?.user?.sub || req?.user?.userId;
      
      return await this.docs.create({ 
        ...dto, 
        contentUrl,
        fileType,
        fileSize,
        author_id: userId
      });
    } catch (err: unknown) {
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
