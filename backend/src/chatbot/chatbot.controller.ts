import { Body, Controller, Post, Param, Get, Delete, UseGuards, Req } from '@nestjs/common';
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

  @Post('query-with-document/:documentId')
  @ApiOperation({ summary: 'Enviar consulta con contexto de un documento específico' })
  @ApiParam({ name: 'documentId', description: 'ID del documento a usar como contexto' })
  async queryWithDocument(
    @Param('documentId') documentId: string,
    @Body() body: { text: string }
  ) {
    return this.bot.queryWithDocument(body.text, documentId);
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
