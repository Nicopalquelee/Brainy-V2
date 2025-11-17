import { Body, Controller, Post, Param, Get, Delete, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('chat')
@Controller('chat')
export class ChatbotController {
  constructor(private bot: ChatbotService) {}

  @Get('diag')
  @ApiOperation({ summary: 'Diagnóstico de configuración del chatbot/OpenAI' })
  diag() {
    return this.bot.getDiagnostics();
  }

  @UseGuards(JwtAuthGuard)
  @Post('query')
  @ApiOperation({ summary: 'Enviar consulta al chatbot' })
  async query(@Body() body: { text: string; conversationId?: string; title?: string }, @Req() req: any) {
    const userId = req?.user?.sub || req?.user?.userId;
    return this.bot.query(body.text, {
      userId,
      conversationId: body.conversationId,
      title: body.title
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('stream')
  @ApiOperation({ summary: 'Enviar consulta al chatbot y recibir respuesta en streaming SSE (token incremental)' })
  async stream(
    @Body() body: { text: string; conversationId?: string; title?: string },
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = req?.user?.sub || req?.user?.userId;
  // Preparar cabeceras SSE (y evitar buffering en proxies)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
      // streamReply ahora nos devuelve conversationId definitivo y documentos relacionados
      const result = await this.bot.streamReply(body.text, {
        userId,
        conversationId: body.conversationId,
        title: body.title
      }, (delta) => {
        res.write(`data:${JSON.stringify({ delta })}\n\n`);
        (res as any).flush?.();
      });
      // Enviar información de documentos relacionados si existe
      if (result.showRelated && result.relatedDocuments) {
        res.write(`data:${JSON.stringify({
          showRelated: true,
          relatedDocuments: result.relatedDocuments,
          subjectQuery: result.subjectQuery,
          usedDocument: result.usedDocument,
          autoLock: result.autoLock
        })}\n\n`);
        (res as any).flush?.();
      }
      // Enviar conversación id (solo una vez al final si no se envió antes)
      res.write(`data:${JSON.stringify({ conversationId: result.conversationId })}\n\n`);
      res.write(`data:${JSON.stringify({ done: true })}\n\n`);
      (res as any).flush?.();
    } catch (e: any) {
      res.write(`data:${JSON.stringify({ error: 'stream_error', message: e?.message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('query-with-document/:documentId')
  @ApiOperation({ summary: 'Enviar consulta con contexto de un documento específico' })
  @ApiParam({ name: 'documentId', description: 'ID del documento a usar como contexto' })
  async queryWithDocument(
    @Param('documentId') documentId: string,
    @Body() body: { text: string; conversationId?: string; title?: string },
    @Req() req: any
  ) {
    const userId = req?.user?.sub || req?.user?.userId;
    return this.bot.queryWithDocument(body.text, documentId, {
      userId,
      conversationId: body.conversationId,
      title: body.title
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('stream-with-document/:documentId')
  @ApiOperation({ summary: 'Streaming SSE con contexto de documento específico' })
  @ApiParam({ name: 'documentId', description: 'ID del documento a usar como contexto' })
  async streamWithDocument(
    @Param('documentId') documentId: string,
    @Body() body: { text: string; conversationId?: string; title?: string },
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = req?.user?.sub || req?.user?.userId;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
      const result = await this.bot.streamReplyWithDocument(body.text, documentId, {
        userId,
        conversationId: body.conversationId,
        title: body.title
      }, (delta) => {
        res.write(`data:${JSON.stringify({ delta })}\n\n`);
        (res as any).flush?.();
      });
      res.write(`data:${JSON.stringify({ conversationId: result.conversationId })}\n\n`);
      res.write(`data:${JSON.stringify({ done: true })}\n\n`);
      (res as any).flush?.();
    } catch (e: any) {
      res.write(`data:${JSON.stringify({ error: 'stream_error', message: e?.message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Post('analyze-documents')
  @ApiOperation({ summary: 'Analizar todos los documentos subidos y obtener resumen' })
  async analyzeDocuments(@Body() body: { question: string }) {
    return this.bot.analyzeAllDocuments(body.question);
  }

  // Nuevos endpoints para conversaciones
  @UseGuards(JwtAuthGuard)
  @Post('conversations')
  @ApiOperation({ summary: 'Crear nueva conversación' })
  async createConversation(@Body() body: { userId: string; title?: string }) {
    return this.bot.createConversation(body.userId, body.title);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:userId')
  @ApiOperation({ summary: 'Obtener conversaciones del usuario' })
  async getUserConversations(@Param('userId') userId: string) {
    return this.bot.getUserConversations(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Agregar mensaje a conversación' })
  async addMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: { content: string; role: 'user' | 'assistant' }
  ) {
    return this.bot.addMessage(conversationId, body.content, body.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Obtener mensajes de conversación' })
  async getConversationMessages(@Param('conversationId') conversationId: string) {
    return this.bot.getConversationMessages(conversationId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('conversations/:conversationId')
  @ApiOperation({ summary: 'Eliminar conversación' })
  async deleteConversation(@Param('conversationId') conversationId: string) {
    return this.bot.deleteConversation(conversationId);
  }
}
