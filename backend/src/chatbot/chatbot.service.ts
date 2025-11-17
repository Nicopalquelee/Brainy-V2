import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { DocumentsService } from '../documents/documents.service';
import { buildSubjectAliases } from './subjects';
import { PdfProcessorService } from '../documents/pdf-processor.service';
import { supabaseAdmin as supabase, Conversation, Message } from '../config/supabase';

interface UserIntent {
  type: 'greeting_with_help' | 'academic_help' | 'document_search' | 'general_question' | 'subject_specific' | 'quiz_request' | 'exercise_request';
  subject?: string;
  confidence: number;
  keywords: string[];
  needsDocuments: boolean;
  isGreeting?: boolean;
  quizType?: 'multiple_choice' | 'true_false' | 'open_ended';
  questionCount?: number;
}

interface ConversationContext {
  subject?: string;
  recentTopics: string[];
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredStyle?: 'detailed' | 'concise' | 'step_by_step';
  currentDocument?: {
    id: string;
    title: string;
    subject: string;
  };
  conversationHistory?: string[];
}

@Injectable()
export class ChatbotService {
  private readonly systemPrompt = `Eres un tutor académico directo y eficiente. Tu personalidad es:

🎓 **Estudiante experto**: Explicas conceptos de forma clara y práctica
💡 **Adaptativo**: Ajustas tu explicación según el nivel del estudiante
📚 **Basado en evidencia**: Usas documentos y apuntes cuando están disponibles
🎯 **Práctico**: Das ejemplos concretos y ejercicios cuando es útil

**Reglas de respuesta:**
- Sé directo y conciso, evita mensajes verbosos innecesarios
- NO uses frases como "Me alegra que estés buscando ayuda" o "Recuerda que la práctica es esencial"
- NO incluyas motivación genérica que no aporta valor
- Ve directo al grano: explica conceptos, resuelve problemas, muestra recursos
- Si detectas una materia específica, busca apuntes relacionados automáticamente
- Cuando muestres apuntes, solo incluye título y materia (sin rating ni vistas)
- Si no tienes información específica, sé honesto pero útil

**IMPORTANTE - Documentos:**
- NUNCA inventes o generes nombres de documentos que no existen
- NUNCA menciones documentos como "Apuntes completos de..." a menos que estén en el contexto proporcionado
- SOLO menciona documentos que estén explícitamente en el contexto de documentos
- Si no hay documentos en el contexto, NO sugieras documentos específicos
- Si hay documentos relevantes, úsalos para fundamentar tu respuesta
- Cita las fuentes de forma natural
- Si no hay documentos específicos, busca en la base de datos de apuntes
- Muestra apuntes disponibles de forma simple: solo título y materia
 - Nunca digas frases como "no tengo acceso a documentos"; si no se te han proporcionado documentos en el contexto, continúa con la mejor explicación posible y, si hay apuntes disponibles en la base de datos, sugiérelos sin afirmar falta de acceso.

Responde siempre en español de forma directa y útil.`;

  private openai: OpenAI;

  constructor(
    private readonly docs: DocumentsService,
    private readonly configService: ConfigService,
    private readonly pdfProcessor: PdfProcessorService
  ) {
    // Cargar la API key desde variables de entorno (con varios alias) o config
    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_KEY ||
      this.configService.get<string>('app.openaiKey');
    console.log('🔑 OpenAI API Key configurada:', apiKey ? 'Sí' : 'No');
    if (apiKey) {
      try {
        this.openai = new OpenAI({ apiKey });
        console.log('✅ Cliente OpenAI inicializado correctamente');
      } catch (e) {
        console.error('❌ Error inicializando cliente de OpenAI:', e);
      }
    } else {
      console.log('⚠️ No se encontró API key de OpenAI, usando respuestas mock');
    }
  }

  async query(text: string, opts?: { userId?: string; conversationId?: string; title?: string }) {
    // Si no hay OpenAI configurado → usar mock
    if (!this.openai) {
      console.warn('No OpenAI API key found, using mock response.');
      return this.getMockAcademicResponse(text);
    }

    try {
      // 1. Análisis inteligente de la intención del usuario
      const intent = await this.analyzeUserIntent(text);
      console.log('🎯 Intención detectada:', intent);

      // 2. Obtener contexto de conversación si existe
      const conversationContext = await this.getConversationContext(opts?.conversationId);
      console.log('💭 Contexto de conversación:', conversationContext);

      // 3. Determinar si necesita documentos específicos
      const needsDocs = intent.needsDocuments || this.needsDocumentContext(text);
      
      // 4. Detectar si pregunta por apuntes disponibles (se maneja después del análisis de intención)

      // 5. Manejar solicitud específica de documento
      const requestedDocTitle = this.extractRequestedDocumentTitle(text);
      if (requestedDocTitle) {
        return await this.handleSpecificDocumentRequest(text, requestedDocTitle, opts);
      }

      // 6. Manejar saludo con solicitud de ayuda específica
      if (intent.type === 'greeting_with_help' && intent.subject) {
        return await this.handleGreetingWithHelp(intent, conversationContext, opts);
      }

      // 7. Manejar solicitud de quiz/examen
      if (intent.type === 'quiz_request') {
        return await this.handleQuizRequest(text, intent, conversationContext, opts);
      }

      // 8. Manejar consulta sobre apuntes disponibles
      const notesQueryResult = this.isQueryAboutNotes(text);
      if (notesQueryResult.isQuery) {
        // Si se detectó una materia en la pregunta, actualizar el intent
        if (notesQueryResult.subject && !intent.subject) {
          intent.subject = notesQueryResult.subject;
        }
        return await this.handleNotesInventoryQuery(intent, conversationContext, opts);
      }

      // 9. Paso proactivo: intentar ofrecer apuntes antes de generar respuesta larga (solo si intención académica / materia)
      try {
        const proactive = await this.shouldOfferDocuments(text, intent, conversationContext);
        if (proactive.offer) {
          const subjectLabel = proactive.subjectMatched || intent.subject || proactive.queryUsed || '';
          const subjectName = subjectLabel ? subjectLabel.charAt(0).toUpperCase() + subjectLabel.slice(1) : '';
          let answer = subjectName ? `He encontrado apuntes relacionados con ${subjectName}:\n\n` : `He encontrado estos apuntes:\n\n`;
          proactive.docs.slice(0,5).forEach((d: any, i: number) => {
            answer += `${i + 1}. ${d.title || d.subject || 'Documento'}${d.subject ? ` (${d.subject})` : ''}\n`;
          });
          answer += `\n¿Quieres que use alguno para ayudarte?`;

          // Persistencia mínima si hay usuario
          let finalConversationId = opts?.conversationId;
          try {
            if (opts?.userId) {
              if (!finalConversationId) {
                const title = opts?.title || this.generateTitleFromText(subjectLabel || text);
                const conv = await this.createConversation(opts.userId, title);
                finalConversationId = conv.id as unknown as string;
              }
              await this.addMessage(finalConversationId!, text, 'user');
              await this.addMessage(finalConversationId!, answer, 'assistant');
            }
          } catch (persistErr) {
            console.warn('⚠️ No se pudo persistir historial (proactive offer):', persistErr);
          }

          return {
            answer,
            conversationId: finalConversationId,
            showRelated: true,
            subjectQuery: subjectLabel || null,
            relatedDocuments: proactive.docs.slice(0,5),
            usedDocument: proactive.docs[0] || undefined,
            autoLock: !!(proactive.docs && proactive.docs.length > 0)
          };
        }
      } catch (e) {
        console.warn('⚠️ Error en paso proactivo shouldOfferDocuments:', e);
      }

      // 10. Procesar documentos si es necesario
      let pdfContext = '';
      let allDocs: any[] = [];
      let documentsProcessed = 0;

      if (needsDocs || intent.type === 'subject_specific') {
        const documentResult = await this.findRelevantDocuments(intent, conversationContext, text);
        pdfContext = documentResult.context;
        allDocs = documentResult.documents;
        documentsProcessed = documentResult.processed;
      }

      // 11. Generar respuesta inteligente con contexto
      const response = await this.generateIntelligentResponse(
        text, 
        intent, 
        conversationContext, 
        pdfContext, 
        opts
      );

      return response;
    } catch (error: any) {
      // Log enriquecido para facilitar diagnóstico (401 típicamente por API key)
      const status = error?.status || error?.response?.status;
      const message = error?.message || error?.response?.data || String(error);
      console.error('Error calling OpenAI API:', { status, message });
      return {
        error: 'Error al conectar con el asistente académico. Intenta nuevamente más tarde.',
        answer: 'Lo siento, no pude procesar tu consulta en este momento. Por favor, intenta nuevamente.',
      };
    }
  }

  /**
   * Streaming simplificado de respuesta: evita segunda llamada de análisis que introduce latencia.
   * Usa fallbackIntentAnalysis para rapidez y genera respuesta del modelo con streaming token a token.
   * onDelta se invoca con cada fragmento (token/parcial) recibido del modelo.
   */
  async streamReply(
    text: string,
    opts: { userId?: string; conversationId?: string; title?: string },
    onDelta: (delta: string) => void
  ): Promise<{ finalAnswer: string; conversationId?: string; showRelated?: boolean; relatedDocuments?: any[]; subjectQuery?: string; usedDocument?: any; autoLock?: boolean }> {
    if (!this.openai) {
      // Modo mock: emitir respuesta completa en un único delta
      const mock = await this.getMockAcademicResponse(text);
      onDelta(mock.answer || 'Respuesta mock.');
      return { finalAnswer: mock.answer || 'Respuesta mock.' };
    }

    // Intento rápido (sin segunda llamada a OpenAI)
    const intent = this.fallbackIntentAnalysis(text);
    const conversationContext = await this.getConversationContext(opts?.conversationId);

    // Verificar si es una pregunta sobre apuntes disponibles
    const notesQueryResult = this.isQueryAboutNotes(text);
    if (notesQueryResult.isQuery) {
      if (notesQueryResult.subject && !intent.subject) {
        intent.subject = notesQueryResult.subject;
      }
      const notesResult = await this.handleNotesInventoryQuery(intent, conversationContext, opts);
      // Enviar respuesta completa de una vez (no streaming para inventario)
      onDelta(notesResult.answer);
      return {
        finalAnswer: notesResult.answer,
        conversationId: notesResult.conversationId,
        showRelated: notesResult.showRelated,
        relatedDocuments: notesResult.relatedDocuments,
        subjectQuery: notesResult.subjectQuery || undefined,
        usedDocument: notesResult.relatedDocuments?.[0],
        autoLock: notesResult.showRelated && notesResult.relatedDocuments && notesResult.relatedDocuments.length > 0
      };
    }

    // Paso proactivo: intentar ofrecer apuntes antes de generar respuesta larga
    let proactiveDocs: any[] = [];
    let proactiveSubject: string | undefined;
    try {
      const proactive = await this.shouldOfferDocuments(text, intent, conversationContext);
      if (proactive.offer && proactive.docs.length > 0) {
        proactiveDocs = proactive.docs.slice(0, 5);
        proactiveSubject = proactive.subjectMatched || intent.subject || proactive.queryUsed || undefined;
      }
    } catch (e) {
      console.warn('⚠️ Error en paso proactivo shouldOfferDocuments (stream):', e);
    }

    // Construir prompt contextual mínimo (sin PDF pesado para rapidez)
    const basePrompt = this.buildContextualPrompt(text, intent, conversationContext, '');

    const model = this.configService.get<string>('app.openaiModel') || 'gpt-4o-mini';

    let finalConversationId = opts?.conversationId;
    try {
      if (opts?.userId) {
        if (!finalConversationId) {
          const title = opts?.title || this.generateTitleFromText(text);
          const conv = await this.createConversation(opts.userId, title);
          finalConversationId = conv.id as unknown as string;
        }
        // Guardar mensaje de usuario inmediatamente
        await this.addMessage(finalConversationId!, text, 'user');
      }
    } catch (persistErr) {
      console.warn('⚠️ No se pudo persistir el mensaje de usuario (stream):', persistErr);
    }

    let fullAnswer = '';
    try {
      const stream = await this.openai.chat.completions.create({
        model,
        stream: true,
        temperature: this.getOptimalTemperature(intent, conversationContext),
        max_tokens: this.getOptimalMaxTokens(intent, conversationContext),
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: basePrompt }
        ],
        top_p: 0.9
      });

      for await (const part of stream) {
        const delta = part.choices?.[0]?.delta?.content;
        if (delta) {
          fullAnswer += delta;
          onDelta(delta);
        }
      }
    } catch (err) {
      const msg = (err as any)?.message || 'Error en streaming.';
      console.error('❌ Error streaming OpenAI:', msg);
      onDelta('\n[Error en streaming: ' + msg + ']');
    }

    // Persistir respuesta completa
    if (fullAnswer.trim()) {
      try {
        if (opts?.userId && finalConversationId) {
          await this.addMessage(finalConversationId, fullAnswer, 'assistant');
        }
      } catch (persistErr) {
        console.warn('⚠️ No se pudo persistir respuesta asistente (stream):', persistErr);
      }
    }

    return {
      finalAnswer: fullAnswer,
      conversationId: finalConversationId,
      showRelated: proactiveDocs.length > 0,
      relatedDocuments: proactiveDocs,
      subjectQuery: proactiveSubject,
      usedDocument: proactiveDocs[0],
      autoLock: proactiveDocs.length > 0
    };
  }

  /**
   * Streaming con contexto de documento específico.
   * Similar a streamReply pero agrega el contexto procesado del PDF (resumido) al prompt.
   */
  async streamReplyWithDocument(
    text: string,
    documentId: string,
    opts: { userId?: string; conversationId?: string; title?: string },
    onDelta: (delta: string) => void
  ): Promise<{ finalAnswer: string; conversationId?: string }> {
    if (!this.openai) {
      const mock = await this.getMockAcademicResponse(text);
      onDelta(mock.answer || 'Respuesta mock.');
      return { finalAnswer: mock.answer || 'Respuesta mock.' };
    }

    // Intent rápido para metadatos
    const intent = this.fallbackIntentAnalysis(text);
    const conversationContext = await this.getConversationContext(opts?.conversationId);

    // Recuperar documento
    const doc = await this.docs.find(documentId);
    let pdfContext = '';
    if (doc?.file_url) {
      try {
        const filePath = doc.file_url;
        // Para PDFs locales en /uploads
        if (/\.pdf$/i.test(filePath)) {
          const localPath = filePath.startsWith('/uploads/') ? filePath : filePath;
          const extracted = await this.pdfProcessor.extractTextFromPdf(localPath);
          // Limitar y resumir textual para prompt (primeros ~5000 chars)
          pdfContext = extracted.slice(0, 5000);
        }
      } catch (e) {
        console.warn('⚠️ No se pudo extraer contexto PDF:', e);
      }
    } else if (doc?.content) {
      pdfContext = String(doc.content).slice(0, 5000);
    }

    const basePrompt = this.buildContextualPrompt(text, intent, conversationContext, pdfContext);
    const model = this.configService.get<string>('app.openaiModel') || 'gpt-4o-mini';

    let finalConversationId = opts?.conversationId;
    try {
      if (opts?.userId) {
        if (!finalConversationId) {
          const title = opts?.title || this.generateTitleFromText(text);
          const conv = await this.createConversation(opts.userId, title);
          finalConversationId = conv.id as unknown as string;
        }
        await this.addMessage(finalConversationId!, text, 'user');
      }
    } catch (persistErr) {
      console.warn('⚠️ No se pudo persistir mensaje usuario (stream doc):', persistErr);
    }

    let fullAnswer = '';
    try {
      const stream = await this.openai.chat.completions.create({
        model,
        stream: true,
        temperature: this.getOptimalTemperature(intent, conversationContext),
        max_tokens: this.getOptimalMaxTokens(intent, conversationContext),
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: basePrompt }
        ],
        top_p: 0.9
      });
      for await (const part of stream) {
        const delta = part.choices?.[0]?.delta?.content;
        if (delta) {
          fullAnswer += delta;
          onDelta(delta);
        }
      }
    } catch (err) {
      const msg = (err as any)?.message || 'Error en streaming con documento.';
      console.error('❌ Error streaming doc OpenAI:', msg);
      onDelta('\n[Error: ' + msg + ']');
    }

    if (fullAnswer.trim()) {
      try {
        if (opts?.userId && finalConversationId) {
          await this.addMessage(finalConversationId, fullAnswer, 'assistant');
        }
      } catch (persistErr) {
        console.warn('⚠️ No se pudo persistir respuesta asistente (stream doc):', persistErr);
      }
    }

    return { finalAnswer: fullAnswer, conversationId: finalConversationId };
  }

  // Manejar solicitud específica de documento
  private async handleSpecificDocumentRequest(
    text: string, 
    requestedDocTitle: string, 
    opts?: { userId?: string; conversationId?: string; title?: string }
  ) {
        try {
          const matches = await this.docs.search(requestedDocTitle);
          const pickBest = (arr: any[]) => {
            if (!Array.isArray(arr) || arr.length === 0) return null;
            const norm = (s?: string) => (s ? this.removeAccents(String(s)).toLowerCase().trim() : '');
            const target = norm(requestedDocTitle);
            // 1) match exacto por título
            let best = arr.find((d: any) => norm(d.title) === target) || null;
            if (best) return best;
            // 2) título que contenga
            best = arr.find((d: any) => norm(d.title).includes(target)) || null;
            if (best) return best;
            // 3) subject que contenga
            best = arr.find((d: any) => norm(d.subject).includes(target)) || null;
            if (best) return best;
            // 4) fallback primero
            return arr[0];
          };
          const doc = pickBest(matches);
          if (doc?.id) {
            const resp = await this.queryWithDocument(text, String(doc.id));

            // Persistir historial
            let finalConversationId = opts?.conversationId;
            try {
              if (opts?.userId) {
                if (!finalConversationId) {
                  const title = opts?.title || this.generateTitleFromText(text);
                  const conv = await this.createConversation(opts.userId, title);
                  finalConversationId = conv.id as unknown as string;
                }
                await this.addMessage(finalConversationId!, text, 'user');
                await this.addMessage(finalConversationId!, resp.answer || ' ', 'assistant');
              }
            } catch (persistErr) {
              console.warn('⚠️ No se pudo persistir el historial (usa apunte):', persistErr);
            }

            return {
              ...resp,
              conversationId: finalConversationId
            };
          }
        } catch (e) {
          console.warn('⚠️ Error resolviendo apunte solicitado:', e);
        }
    return null;
  }

  // Manejar saludo con solicitud de ayuda específica
  private async handleGreetingWithHelp(
    intent: UserIntent,
    conversationContext: ConversationContext,
    opts?: { userId?: string; conversationId?: string; title?: string }
  ) {
    try {
      // Buscar apuntes relacionados con la materia específica
      const relatedDocs = await this.docs.search(intent.subject!);
      const relevantDocs = Array.isArray(relatedDocs) ? relatedDocs.slice(0, 5) : [];
      
      // Crear respuesta proactiva y directa
      const subjectName = intent.subject!.charAt(0).toUpperCase() + intent.subject!.slice(1);
      let answer = `¡Hola! Puedo ayudarte con ${subjectName}. `;
      
      if (relevantDocs.length > 0) {
        answer += `Tengo estos apuntes disponibles:\n\n`;
        
        // Listar los apuntes encontrados de forma simple
        relevantDocs.forEach((doc: any, index: number) => {
          const title = doc.title || doc.subject || 'Documento';
          const subject = doc.subject ? ` (${doc.subject})` : '';
          
          answer += `${index + 1}. ${title}${subject}\n`;
        });
        
        answer += `\n¿Quieres que use alguno para ayudarte?`;
      } else {
        answer += `No tengo apuntes de ${subjectName} disponibles, pero puedo ayudarte con conceptos. ¿Qué necesitas saber?`;
      }

      // Persistir historial
      let finalConversationId = opts?.conversationId;
      try {
        if (opts?.userId) {
          if (!finalConversationId) {
            const title = `Ayuda con ${subjectName}`;
            const conv = await this.createConversation(opts.userId, title);
            finalConversationId = conv.id as unknown as string;
          }
          await this.addMessage(finalConversationId!, `Hola, necesito ayuda con ${intent.subject}`, 'user');
          await this.addMessage(finalConversationId!, answer, 'assistant');
        }
      } catch (persistErr) {
        console.warn('⚠️ No se pudo persistir el historial (saludo con ayuda):', persistErr);
      }

      // Elegir un documento por defecto para auto-bloqueo (lock) si hay
      const picked = (Array.isArray(relevantDocs) && relevantDocs.length > 0) ? relevantDocs[0] : null;

      return {
        answer,
        conversationId: finalConversationId,
        showRelated: relevantDocs.length > 0,
        subjectQuery: intent.subject,
        relatedDocuments: relevantDocs,
        usedDocument: picked || undefined,
        autoLock: !!picked,
        isGreeting: true
      };
    } catch (error) {
      console.error('❌ Error manejando saludo con ayuda:', error);
      
      // Respuesta de fallback
      const subjectName = intent.subject!.charAt(0).toUpperCase() + intent.subject!.slice(1);
      const fallbackAnswer = `¡Hola! Puedo ayudarte con ${subjectName}. ¿Qué necesitas saber?`;
      
      return {
        answer: fallbackAnswer,
        conversationId: opts?.conversationId,
        showRelated: false,
        subjectQuery: intent.subject,
        relatedDocuments: [],
        isGreeting: true
      };
    }
  }

  // Manejar solicitud de quiz/examen
  private async handleQuizRequest(
    text: string,
    intent: UserIntent,
    conversationContext: ConversationContext,
    opts?: { userId?: string; conversationId?: string; title?: string }
  ) {
    try {
      // Determinar el documento específico a usar
      let targetDocument: any = null;
      
      // 1. Si hay un documento actual en el contexto, usarlo
      if (conversationContext.currentDocument) {
        const searchResults = await this.docs.search(conversationContext.currentDocument.title);
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          targetDocument = searchResults[0];
        }
      }
      
      // 2. Si no hay documento específico, buscar por materia
      if (!targetDocument && intent.subject) {
        const searchResults = await this.docs.search(intent.subject);
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          targetDocument = searchResults[0];
        }
      }
      
      if (!targetDocument) {
        return {
          answer: `No tengo un apunte específico de ${intent.subject || 'la materia'} para crear el quiz. ¿Podrías especificar qué apunte quieres que use, o subir uno primero?`,
          conversationId: opts?.conversationId,
          showRelated: false,
          subjectQuery: intent.subject,
          relatedDocuments: []
        };
      }

      // Generar quiz usando el documento específico
      const quizResult = await this.generateQuizFromDocument(
        targetDocument,
        intent.questionCount || 15,
        intent.quizType || 'multiple_choice',
        text
      );

      // Persistir historial
      let finalConversationId = opts?.conversationId;
      try {
        if (opts?.userId) {
          if (!finalConversationId) {
            const title = `Quiz de ${intent.subject || 'evaluación'}`;
            const conv = await this.createConversation(opts.userId, title);
            finalConversationId = conv.id as unknown as string;
          }
          await this.addMessage(finalConversationId!, text, 'user');
          await this.addMessage(finalConversationId!, quizResult.answer, 'assistant');
        }
      } catch (persistErr) {
        console.warn('⚠️ No se pudo persistir el historial (quiz):', persistErr);
      }

      return {
        answer: quizResult.answer,
        conversationId: finalConversationId,
        showRelated: false,
        subjectQuery: intent.subject,
        relatedDocuments: [targetDocument],
        quizGenerated: true
      };
    } catch (error) {
      console.error('❌ Error generando quiz:', error);
      
      return {
        answer: `Lo siento, no pude generar el quiz en este momento. ¿Podrías intentar de nuevo o especificar qué apunte quieres que use?`,
        conversationId: opts?.conversationId,
        showRelated: false,
        subjectQuery: intent.subject,
        relatedDocuments: []
      };
    }
  }

  // Generar quiz desde un documento específico
  private async generateQuizFromDocument(
    document: any,
    questionCount: number,
    quizType: 'multiple_choice' | 'true_false' | 'open_ended',
    originalRequest: string
  ) {
    if (!this.openai) {
      return {
        answer: 'No puedo generar quizzes sin la configuración de OpenAI. Por favor, contacta al administrador.'
      };
    }

    try {
      // Obtener contenido del documento específico
      let documentContent = '';
      const filePath = this.resolvePathOrUrl(document.file_url || document.filePath || document.path || document.contentUrl);
      
      if (filePath && (filePath.endsWith('.pdf') || filePath.includes('.pdf'))) {
        const pdfContent = await this.pdfProcessor.extractTextFromPdf(filePath);
        documentContent = pdfContent.substring(0, 8000); // Limitar contenido
      }

      if (!documentContent.trim()) {
        return {
          answer: `No pude acceder al contenido del documento "${document.title}". ¿Podrías verificar que el archivo esté disponible?`
        };
      }

      // Generar quiz usando IA con el contenido específico
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un profesor experto que crea quizzes educativos. Tu tarea es crear un quiz de ${questionCount} preguntas de tipo ${quizType} basándote ÚNICAMENTE en el contenido del documento proporcionado.

IMPORTANTE:
- Usa SOLO la información del documento proporcionado
- NO uses conocimiento general sobre el tema
- Si el documento no tiene suficiente información, indica cuántas preguntas puedes crear
- Las preguntas deben ser específicas al contenido del documento
- Incluye las respuestas correctas al final

Formato de respuesta:
1. Pregunta 1
a) Opción A
b) Opción B  
c) Opción C
d) Opción D

2. Pregunta 2
...

RESPUESTAS:
1. Respuesta correcta
2. Respuesta correcta
...`
          },
          {
            role: 'user',
            content: `Crea un quiz de ${questionCount} preguntas de ${quizType} basándote ÚNICAMENTE en este documento:

TÍTULO: ${document.title}
MATERIA: ${document.subject}

CONTENIDO DEL DOCUMENTO:
${documentContent}

Solicitud original: ${originalRequest}`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      });

      const quizContent = completion.choices[0]?.message?.content || 'No se pudo generar el quiz.';
      
      return {
        answer: `📝 **Quiz basado en "${document.title}"**\n\n${quizContent}\n\n---\n*Este quiz fue generado específicamente del documento "${document.title}". Si necesitas más preguntas o sobre otro tema, házmelo saber.*`
      };
    } catch (error) {
      console.error('❌ Error generando quiz con IA:', error);
      return {
        answer: `Error generando el quiz: ${error.message}. ¿Podrías intentar de nuevo?`
      };
    }
  }

  // Manejar consulta sobre inventario de apuntes
  private async handleNotesInventoryQuery(
    intent: UserIntent,
    conversationContext: ConversationContext,
    opts?: { userId?: string; conversationId?: string; title?: string }
  ) {
        let related: any[] = [];
        let total = 0;
        let searchQuery = intent.subject || conversationContext.subject || '';
        const originalQuery = searchQuery; // Guardar query original para mostrar
        
        // NO normalizar aquí - usar la query exacta que el usuario proporcionó
        // La normalización puede cambiar "matematicas discretas" a algo diferente
        
        try {
      if (searchQuery) {
        // Buscar por materia específica (sin normalizar para mantener precisión)
        const items = await this.docs.search(searchQuery);
            related = Array.isArray(items) ? items.slice(0, 10) : [];
        total = Array.isArray(items) ? items.length : 0;
        
        // Filtrar resultados para que sean más relevantes
        // Si la búsqueda tiene múltiples palabras, priorizar documentos que contengan todas
        if (total > 0 && searchQuery.split(/\s+/).length > 1) {
          const queryWords = this.removeAccents(searchQuery.toLowerCase()).split(/\s+/).filter(w => w.length > 2);
          related = related.filter((doc: any) => {
            const docText = this.removeAccents((doc.title || '') + ' ' + (doc.subject || '')).toLowerCase();
            // Verificar que al menos 2 palabras de la query estén en el documento
            const matches = queryWords.filter(word => docText.includes(word)).length;
            return matches >= Math.min(2, queryWords.length);
          });
          total = related.length;
        }
        
        // Si no se encontraron resultados, intentar búsqueda más amplia con keywords
        if (total === 0 && intent.keywords && intent.keywords.length > 0) {
          const keywordSearch = intent.keywords.slice(0, 2).join(' ');
          const keywordItems = await this.docs.search(keywordSearch);
          if (Array.isArray(keywordItems) && keywordItems.length > 0) {
            related = keywordItems.slice(0, 10);
            total = keywordItems.length;
            searchQuery = keywordSearch; // Actualizar query usado
          }
        }
          } else {
            // Si no hay materia específica, listar todos los apuntes disponibles
            const res = await this.docs.list(1, 20);
            related = res.items || [];
            total = res.total || related.length;
          }
        } catch (e) {
          console.warn('⚠️ Error obteniendo inventario de apuntes:', e);
        }

    // Usar query original para mostrar al usuario
    const subjectPart = originalQuery ? ` de "${originalQuery}"` : '';
    
    // Construir respuesta más inteligente y útil
    let answer = '';
    if (total > 0) {
      answer = `¡Sí! Tengo ${total} apunte${total > 1 ? 's' : ''}${subjectPart}:\n\n`;
      related.slice(0, 5).forEach((d: any, index: number) => {
        const title = d.title || d.subject || 'Documento';
        const subject = d.subject ? ` (${d.subject})` : '';
        answer += `${index + 1}. ${title}${subject}\n`;
      });
      if (total > 5) {
        answer += `\n... y ${total - 5} más.\n`;
      }
      answer += `\n¿Quieres que use alguno para ayudarte?`;
    } else {
      // Respuesta más útil cuando no hay apuntes
      if (originalQuery) {
        answer = `No tengo apuntes específicos de "${originalQuery}" en este momento. `;
      } else {
        answer = `No tengo apuntes disponibles en este momento. `;
      }
      answer += `Pero puedo ayudarte con conceptos y explicaciones sobre ${originalQuery || 'la materia'}. ¿Qué necesitas saber?`;
    }

        // Persistir historial mínimo si aplica
        let finalConversationId = opts?.conversationId;
        try {
          if (opts?.userId) {
            if (!finalConversationId) {
          const title = opts?.title || this.generateTitleFromText(searchQuery || 'Consulta sobre apuntes');
              const conv = await this.createConversation(opts.userId, title);
              finalConversationId = conv.id as unknown as string;
            }
        await this.addMessage(finalConversationId!, 'Consulta sobre apuntes disponibles', 'user');
            await this.addMessage(finalConversationId!, answer, 'assistant');
          }
        } catch (persistErr) {
          console.warn('⚠️ No se pudo persistir el historial de chat (inventario):', persistErr);
        }

        return {
          answer,
          conversationId: finalConversationId,
          showRelated: related.length > 0,
      subjectQuery: searchQuery || null,
          relatedDocuments: related
        };
      }

  // Encontrar documentos relevantes usando IA
  private async findRelevantDocuments(
    intent: UserIntent,
    conversationContext: ConversationContext,
    text: string
  ): Promise<{ context: string; documents: any[]; processed: number }> {
    try {
      // Obtener todos los documentos disponibles
        const result = await this.docs.list(1, 100);
        const docs = Array.isArray(result.items) ? result.items : [];
        console.log(`📚 Encontrados ${docs.length} documentos disponibles`);

      if (docs.length === 0) {
        return { context: '', documents: [], processed: 0 };
      }

      // Filtrar PDFs y rankear por relevancia inteligente
      const pdfDocs = docs.filter((d: any) => {
          const p = String((d.file_url || d.filePath || d.path || d.contentUrl) || '');
          return p.endsWith('.pdf') || p.includes('.pdf');
        });

      // Ranking inteligente basado en intención y contexto
      const rankedDocs = await this.rankDocumentsIntelligently(
        pdfDocs, 
        intent, 
        conversationContext, 
        text
      );

      const topDocs = rankedDocs.slice(0, Math.min(3, rankedDocs.length));

        if (topDocs.length === 0) {
          console.log('⚠️ No hay PDFs relevantes para esta consulta');
        return { context: '', documents: docs.slice(0, 5), processed: 0 };
      }

      // Procesar PDFs y extraer contexto relevante
      const context = await this.extractRelevantContext(topDocs, intent, text);
      
      return {
        context,
        documents: docs.slice(0, 5),
        processed: topDocs.length
      };
    } catch (error) {
      console.error('❌ Error en búsqueda inteligente de documentos:', error);
      return { context: '', documents: [], processed: 0 };
    }
  }

  // Ranking inteligente de documentos
  private async rankDocumentsIntelligently(
    docs: any[],
    intent: UserIntent,
    conversationContext: ConversationContext,
    text: string
  ): Promise<any[]> {
    const keywords = [...intent.keywords, ...conversationContext.recentTopics];
    const subject = intent.subject || conversationContext.subject;

    const scoreDoc = (d: any) => {
      const title = this.removeAccents((d.title || '').toLowerCase());
      const docSubject = this.removeAccents((d.subject || '').toLowerCase());
      const content = this.removeAccents((d.content || '').toLowerCase());
      
      let score = 0;
      
      // Puntuación por coincidencia de materia
      if (subject) {
        const subjectNorm = this.removeAccents(subject.toLowerCase());
        if (title.includes(subjectNorm) || docSubject.includes(subjectNorm)) score += 10;
        if (content.includes(subjectNorm)) score += 5;
      }
      
      // Puntuación por palabras clave
      for (const keyword of keywords) {
        if (keyword && title.includes(keyword)) score += 3;
        if (keyword && docSubject.includes(keyword)) score += 2;
        if (keyword && content.includes(keyword)) score += 1;
      }
      
      // Puntuación por popularidad
      score += Math.min(5, Math.floor((d.downloads || 0) / 10));
      score += Math.min(3, Math.floor((d.views || 0) / 20));
      
      // Puntuación por rating
      score += (d.rating || 0) * 2;
      
      return score;
    };

    return [...docs].sort((a, b) => scoreDoc(b) - scoreDoc(a));
  }

  // Extraer contexto relevante de documentos
  private async extractRelevantContext(
    docs: any[],
    intent: UserIntent,
    text: string
  ): Promise<string> {
    try {
      const topPaths = docs
              .map((doc: any) => this.resolvePathOrUrl(doc.file_url || doc.filePath || doc.path || doc.contentUrl))
              .filter((p): p is string => !!p);

      if (topPaths.length === 0) return '';

            const pdfContents = await this.pdfProcessor.processMultiplePdfs(topPaths);
            console.log(`✅ Procesados ${pdfContents.length} PDFs relevantes`);

      // Seleccionar chunks más relevantes usando IA
      const relevantChunks = await this.selectRelevantChunks(
        pdfContents, 
        docs, 
        intent, 
        text
      );

      if (relevantChunks.length === 0) {
        console.log('ℹ️ No se encontraron chunks relevantes');
        return '';
      }

      const combined = relevantChunks
        .map((c) => `--- ${c.title} ---\n${c.content}`)
        .join('\n\n');
      
      const context = `\n\nCONTEXTO DE DOCUMENTOS RELEVANTES:\n${combined}`;
      console.log(`✅ Contexto cargado: ${combined.length} caracteres`);
      
      return context;
    } catch (error) {
      console.error('❌ Error extrayendo contexto relevante:', error);
      return '';
    }
  }

  // Seleccionar chunks más relevantes usando IA
  private async selectRelevantChunks(
    pdfContents: any[],
    docs: any[],
    intent: UserIntent,
    text: string
  ): Promise<{ title: string; content: string; score: number }[]> {
    const allChunks: { title: string; content: string; score: number }[] = [];
    
            for (let i = 0; i < pdfContents.length; i++) {
              const pdf = pdfContents[i];
      const docInfo = docs[i];
              const title = (docInfo && (docInfo.title || docInfo.subject)) || `Documento ${i + 1}`;
              const parts = this.pdfProcessor.splitTextIntoChunks(pdf.content || '', 1200);
      
              for (const part of parts) {
        const score = this.calculateChunkRelevance(part, intent, text);
        if (score > 0) {
          allChunks.push({ title, content: part, score });
        }
      }
    }

    // Ordenar por relevancia y tomar los mejores
    return allChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  // Calcular relevancia de un chunk
  private calculateChunkRelevance(
    content: string,
    intent: UserIntent,
    text: string
  ): number {
    const normContent = this.removeAccents(content.toLowerCase());
    const normText = this.removeAccents(text.toLowerCase());
    
    let score = 0;
    
    // Coincidencia con palabras clave de la intención
    for (const keyword of intent.keywords) {
      if (keyword && normContent.includes(keyword)) score += 2;
    }
    
    // Coincidencia con materia
    if (intent.subject) {
      const subject = this.removeAccents(intent.subject.toLowerCase());
      if (normContent.includes(subject)) score += 3;
    }
    
    // Coincidencia con palabras del texto original
    const textWords = normText.split(/\s+/).filter(w => w.length > 3);
    for (const word of textWords) {
      if (normContent.includes(word)) score += 1;
    }
    
    return score;
  }

  // Generar respuesta inteligente con contexto completo
  private async generateIntelligentResponse(
    text: string,
    intent: UserIntent,
    conversationContext: ConversationContext,
    pdfContext: string,
    opts?: { userId?: string; conversationId?: string; title?: string }
  ) {
      const model = this.configService.get<string>('app.openaiModel') || 'gpt-4o-mini';

    // Construir prompt contextual
    const contextualPrompt = this.buildContextualPrompt(
      text, 
      intent, 
      conversationContext, 
      pdfContext
    );

      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
          content: contextualPrompt
          }
        ],
      temperature: this.getOptimalTemperature(intent, conversationContext),
      max_tokens: this.getOptimalMaxTokens(intent, conversationContext),
        top_p: 0.9
      });

  let answer = completion.choices[0]?.message?.content || 'No se pudo generar una respuesta.';

    // Persistir historial
      let finalConversationId = opts?.conversationId;
      try {
        if (opts?.userId) {
          if (!finalConversationId) {
            const title = opts?.title || this.generateTitleFromText(text);
            const conv = await this.createConversation(opts.userId, title);
            finalConversationId = conv.id as unknown as string;
          }
          await this.addMessage(finalConversationId!, text, 'user');
          await this.addMessage(finalConversationId!, answer, 'assistant');
        }
      } catch (persistErr) {
        console.warn('⚠️ No se pudo persistir el historial de chat:', persistErr);
      }

    // Buscar apuntes relacionados si no se usaron documentos
    let relatedDocuments: any[] = [];
    let showRelated = false;
    let usedDocument: any | undefined = undefined;
    let autoLock = false;
    // Solo ofrecer si realmente encontramos documentos y evitar contradicciones con respuestas que niegan acceso.
    if (intent.type === 'subject_specific' && !pdfContext) {
      try {
        const searchQuery = intent.subject || intent.keywords[0];
        if (searchQuery) {
          const related = await this.docs.search(searchQuery);
          const filtered = Array.isArray(related) ? related.filter(r => !!r?.title) : [];
          relatedDocuments = filtered.slice(0, 5);
          showRelated = relatedDocuments.length > 0;
          if (showRelated) {
            usedDocument = relatedDocuments[0];
            autoLock = true;
            // Si el modelo generó una negación de acceso, reemplazar esa parte por un encabezado neutro
            if (/no tengo acceso a documentos/i.test(answer) || /no tengo acceso/i.test(answer)) {
              answer = `He encontrado algunos apuntes relevantes sobre ${searchQuery}:\n` + relatedDocuments.map((d: any, i: number) => `${i + 1}. ${d.title}${d.subject ? ` (${d.subject})` : ''}`).join('\n') + `\n\n¿En qué aspecto específico necesitas ayuda?`;
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Error buscando apuntes relacionados:', e);
      }
    }

        return {
          answer,
          usage: completion.usage,
      conversationId: finalConversationId,
      showRelated,
      subjectQuery: intent.subject || null,
      relatedDocuments,
      usedDocument,
      autoLock
    };
  }

  // Aliases generados desde la malla curricular + algunos extras manuales
  private subjectAliases: Record<string, string[]> = {
    ...buildSubjectAliases(),
    // extras globales y genéricos
    'estadística': ['estadistica','probabilidad','estadistica descriptiva'],
    'programación': ['programacion','codigo','desarrollo','algoritmos']
  };

  private normalizeSubjectCandidate(candidate?: string): string | undefined {
    if (!candidate) return undefined;
    const s = this.removeAccents(candidate.toLowerCase()).trim();
    for (const [canon, aliases] of Object.entries(this.subjectAliases)) {
      for (const a of aliases) {
        if (s.includes(this.removeAccents(a))) return canon;
      }
    }
    return candidate;
  }

  private async shouldOfferDocuments(
    text: string,
    intent: UserIntent,
    conversationContext: ConversationContext
  ): Promise<{ offer: boolean; docs: any[]; subjectMatched?: string; queryUsed?: string }> {
    try {
      // Prioridad: materia detectada
      let subject = intent.subject ? this.normalizeSubjectCandidate(intent.subject) : undefined;
      if (subject) {
        const found = await this.docs.search(subject);
        if (Array.isArray(found) && found.length > 0) {
          return { offer: true, docs: found.slice(0, 8), subjectMatched: subject, queryUsed: subject };
        }
      }

      // Si no hubo materia clara, probar con keywords
      const keywords = intent.keywords && intent.keywords.length ? intent.keywords : this.extractKeywords(text);
      if (keywords.length > 0) {
        const q = keywords.slice(0, 2).join(' ');
        const foundKw = await this.docs.search(q);
        if (Array.isArray(foundKw) && foundKw.length > 0) {
          return { offer: true, docs: foundKw.slice(0, 8), queryUsed: q };
        }
      }

      // Señales explícitas de que quiere apuntes
      const low = text.toLowerCase();
      const docSignals = ['apunte','apuntes','pdf','documento','documentos','guia','guía','ejercicios','práctica','practica','control'];
      if (docSignals.some(sig => low.includes(sig))) {
        const recent = await this.docs.list(1, 12);
        if (recent.items && recent.items.length > 0) {
          return { offer: true, docs: recent.items.slice(0, 8), queryUsed: 'general' };
        }
      }
    } catch (e) {
      console.warn('⚠️ shouldOfferDocuments error:', e);
    }
    return { offer: false, docs: [] };
  }

  // Construir prompt contextual
  private buildContextualPrompt(
    text: string,
    intent: UserIntent,
    conversationContext: ConversationContext,
    pdfContext: string
  ): string {
    let prompt = `Pregunta: ${text}`;
    
    // Agregar contexto de conversación solo si es relevante
    if (conversationContext.recentTopics.length > 0 && conversationContext.recentTopics.length <= 3) {
      prompt += `\n\nContexto: ${conversationContext.recentTopics.join(', ')}.`;
    }
    
    // Agregar nivel del usuario solo si es específico
    if (conversationContext.userLevel && conversationContext.userLevel !== 'intermediate') {
      prompt += `\n\nNivel: ${conversationContext.userLevel}.`;
    }
    
    // Agregar preferencias de estilo solo si es específico
    if (conversationContext.preferredStyle && conversationContext.preferredStyle !== 'detailed') {
      const styleInstructions = {
        'concise': 'Sé conciso.',
        'step_by_step': 'Explica paso a paso.'
      };
      prompt += `\n\nEstilo: ${styleInstructions[conversationContext.preferredStyle]}`;
    }
    
    // Agregar contexto de documentos
    if (pdfContext) {
      prompt += pdfContext;
    }
    
    // Agregar información sobre la materia si es específica
    if (intent.subject) {
      prompt += `\n\nMateria: ${intent.subject}.`;
    }
    
    return prompt;
  }

  // Obtener temperatura óptima según el contexto
  private getOptimalTemperature(
    intent: UserIntent,
    conversationContext: ConversationContext
  ): number {
    if (intent.type === 'subject_specific' && conversationContext.userLevel === 'beginner') {
      return 0.3; // Más determinístico para explicaciones básicas
    }
    if (intent.type === 'academic_help' && conversationContext.preferredStyle === 'step_by_step') {
      return 0.4; // Ligeramente más creativo para ejemplos
    }
    return 0.7; // Balanceado por defecto
  }

  // Obtener tokens máximos óptimos según el contexto
  private getOptimalMaxTokens(
    intent: UserIntent,
    conversationContext: ConversationContext
  ): number {
    if (conversationContext.preferredStyle === 'detailed') {
      return 2000;
    }
    if (conversationContext.preferredStyle === 'concise') {
      return 800;
    }
    return 1500; // Balanceado por defecto
  }

  // Análisis inteligente de la intención del usuario usando IA
  private async analyzeUserIntent(text: string): Promise<UserIntent> {
    if (!this.openai) {
      return this.fallbackIntentAnalysis(text);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analiza la intención del usuario en esta consulta académica. Responde SOLO con un JSON válido:

{
  "type": "greeting_with_help" | "academic_help" | "document_search" | "general_question" | "subject_specific" | "quiz_request" | "exercise_request",
  "subject": "nombre de la materia si es específica",
  "confidence": 0.0-1.0,
  "keywords": ["palabra1", "palabra2"],
  "needsDocuments": true/false,
  "isGreeting": true/false,
  "quizType": "multiple_choice" | "true_false" | "open_ended",
  "questionCount": número de preguntas solicitadas
}

Tipos:
- greeting_with_help: Saludo + solicitud de ayuda con materia específica
- academic_help: Pide ayuda con conceptos, ejercicios, explicaciones
- document_search: Busca específicamente documentos o apuntes
- general_question: Pregunta general no académica
- subject_specific: Pregunta sobre una materia específica
- quiz_request: Solicita un quiz, examen o evaluación (ej: "hazme un quiz", "crea un examen")
- exercise_request: Solicita ejercicios o problemas para practicar

Si detectas una materia (matemáticas, física, química, programación, etc.), inclúyela en "subject".
Si la consulta sugiere que necesita documentos específicos, marca "needsDocuments": true.
Si es un saludo con solicitud de ayuda, marca "isGreeting": true.
Si solicita un quiz/examen, detecta el tipo y número de preguntas.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        const parsed = JSON.parse(response);
          return {
          type: parsed.type || 'general_question',
          subject: parsed.subject,
          confidence: parsed.confidence || 0.5,
          keywords: parsed.keywords || [],
          needsDocuments: parsed.needsDocuments || false
        };
      }
    } catch (error) {
      console.warn('Error en análisis de intención con IA:', error);
    }

    return this.fallbackIntentAnalysis(text);
  }

  // Análisis de respaldo cuando no hay IA disponible
  private fallbackIntentAnalysis(text: string): UserIntent {
    const lowerText = this.removeAccents(text.toLowerCase());
    
    // Detectar saludos con solicitud de ayuda
    const greetingPatterns = [
      /hola.*ayuda.*con/i,
      /hi.*help.*with/i,
      /buenos.*días.*ayuda/i,
      /buenas.*tardes.*ayuda/i,
      /buenas.*noches.*ayuda/i,
      /saludos.*ayuda/i
    ];
    
    const isGreetingWithHelp = greetingPatterns.some(pattern => pattern.test(text));
    
    // Detectar materias específicas
    const subjects = {
      'matemáticas': ['matematica', 'calculo', 'algebra', 'estadistica', 'probabilidad', 'derivadas', 'integrales'],
      'física': ['fisica', 'mecanica', 'termodinamica', 'electricidad', 'magnetismo', 'cinematica', 'dinamica'],
      'química': ['quimica', 'quimico', 'organica', 'inorganica', 'estequiometria', 'moleculas', 'atomos'],
      'programación': ['programacion', 'python', 'java', 'javascript', 'codigo', 'algoritmo', 'programar'],
      'ingeniería': ['ingenieria', 'estructuras', 'materiales', 'sistemas', 'civil', 'mecanica'],
      'biología': ['biologia', 'celulas', 'genetica', 'ecologia', 'anatomia'],
      'historia': ['historia', 'historico', 'guerra', 'revolucion', 'civilizacion']
    };

    let detectedSubject: string | undefined;
    for (const [subject, keywords] of Object.entries(subjects)) {
      if (keywords.some(k => lowerText.includes(k))) {
        detectedSubject = subject;
        break;
      }
    }

    // Detectar si necesita documentos
    const needsDocs = lowerText.includes('documento') || 
                     lowerText.includes('apunte') || 
                     lowerText.includes('pdf') ||
                     lowerText.includes('archivo') ||
                     isGreetingWithHelp; // Los saludos con ayuda siempre necesitan documentos

    // Extraer palabras clave
    const keywords = this.extractKeywords(text);

    // Detectar solicitudes de quiz/examen
    const quizPatterns = [
      /quiz|examen|evaluación|test|preguntas|alternativas/i,
      /hazme.*quiz|crea.*examen|genera.*preguntas/i,
      /\d+\s*preguntas|\d+\s*alternativas/i
    ];
    
    const isQuizRequest = quizPatterns.some(pattern => pattern.test(text));
    const questionCount = this.extractQuestionCount(text);
    const quizType = this.detectQuizType(text);

    // Determinar tipo de intención
    let type: UserIntent['type'] = 'academic_help';
    if (isQuizRequest) {
      type = 'quiz_request';
    } else if (isGreetingWithHelp && detectedSubject) {
      type = 'greeting_with_help';
    } else if (detectedSubject) {
      type = 'subject_specific';
    } else if (lowerText.includes('documento') || lowerText.includes('apunte')) {
      type = 'document_search';
    }

          return {
      type,
      subject: detectedSubject,
      confidence: detectedSubject ? 0.8 : 0.6,
      keywords,
      needsDocuments: needsDocs,
      isGreeting: isGreetingWithHelp,
      quizType: isQuizRequest ? quizType : undefined,
      questionCount: isQuizRequest ? questionCount : undefined
    };
  }

  // Extraer número de preguntas del texto
  private extractQuestionCount(text: string): number | undefined {
    const patterns = [
      /(\d+)\s*preguntas/i,
      /(\d+)\s*alternativas/i,
      /quiz\s*de\s*(\d+)/i,
      /examen\s*de\s*(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    return undefined;
  }

  // Detectar tipo de quiz
  private detectQuizType(text: string): 'multiple_choice' | 'true_false' | 'open_ended' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('alternativas') || lowerText.includes('opciones') || lowerText.includes('a)') || lowerText.includes('b)')) {
      return 'multiple_choice';
    }
    if (lowerText.includes('verdadero') || lowerText.includes('falso') || lowerText.includes('true') || lowerText.includes('false')) {
      return 'true_false';
    }
    
    return 'multiple_choice'; // Por defecto
  }

  // Obtener contexto de la conversación previa
  private async getConversationContext(conversationId?: string): Promise<ConversationContext> {
    if (!conversationId) {
      return { recentTopics: [] };
    }

    try {
      const messages = await this.getConversationMessages(conversationId);
      const recentMessages = messages.slice(-10); // Últimos 10 mensajes
      
      const topics = recentMessages
        .filter(m => m.role === 'user')
        .map(m => this.extractKeywords(m.content))
        .flat()
        .slice(0, 5);

      // Detectar nivel del usuario basado en el tipo de preguntas
      const userLevel = this.detectUserLevel(recentMessages);
      
      // Detectar estilo preferido
      const preferredStyle = this.detectPreferredStyle(recentMessages);

      // Extraer información del documento actual mencionado en la conversación
      const currentDocument = this.extractCurrentDocumentFromHistory(recentMessages);

      // Extraer historial de conversación para contexto
      const conversationHistory = recentMessages
        .slice(-5) // Últimos 5 mensajes
        .map(m => `${m.role}: ${m.content}`);

        return {
        recentTopics: [...new Set(topics)],
        userLevel,
        preferredStyle,
        currentDocument,
        conversationHistory
      };
    } catch (error) {
      console.warn('Error obteniendo contexto de conversación:', error);
      return { recentTopics: [] };
    }
  }

  // Extraer información del documento actual de la conversación
  private extractCurrentDocumentFromHistory(messages: Message[]): ConversationContext['currentDocument'] {
    // Buscar en los mensajes del asistente referencias a documentos específicos
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === 'assistant') {
        const content = message.content.toLowerCase();
        
        // Buscar patrones que indiquen un documento específico
        const documentPatterns = [
          /documento.*"([^"]+)"/i,
          /apunte.*"([^"]+)"/i,
          /basándome.*"([^"]+)"/i,
          /según.*"([^"]+)"/i,
          /en el.*"([^"]+)"/i
        ];
        
        for (const pattern of documentPatterns) {
          const match = message.content.match(pattern);
          if (match) {
        return {
              id: 'extracted', // Placeholder, se buscará por título
              title: match[1],
              subject: this.extractSubjectFromTitle(match[1])
            };
          }
        }
      }
    }
    
    return undefined;
  }

  // Extraer materia del título del documento
  private extractSubjectFromTitle(title: string): string {
    const lowerTitle = this.removeAccents(title.toLowerCase());
    
    const subjects = {
      'matemáticas': ['matematica', 'calculo', 'algebra', 'estadistica', 'discreta'],
      'física': ['fisica', 'mecanica', 'termodinamica', 'electricidad'],
      'química': ['quimica', 'organica', 'inorganica'],
      'programación': ['programacion', 'python', 'java', 'algoritmo']
    };

    for (const [subject, keywords] of Object.entries(subjects)) {
      if (keywords.some(k => lowerTitle.includes(k))) {
        return subject;
      }
    }
    
    return 'general';
  }

  // Detectar nivel del usuario basado en sus preguntas
  private detectUserLevel(messages: Message[]): 'beginner' | 'intermediate' | 'advanced' {
    const userMessages = messages.filter(m => m.role === 'user');
    const content = userMessages.map(m => m.content).join(' ').toLowerCase();
    
    const beginnerKeywords = ['básico', 'principiante', 'empezar', 'introducción', 'qué es'];
    const advancedKeywords = ['avanzado', 'complejo', 'optimización', 'implementación', 'análisis'];
    
    const beginnerScore = beginnerKeywords.filter(k => content.includes(k)).length;
    const advancedScore = advancedKeywords.filter(k => content.includes(k)).length;
    
    if (advancedScore > beginnerScore) return 'advanced';
    if (beginnerScore > 0) return 'beginner';
    return 'intermediate';
  }

  // Detectar estilo de respuesta preferido
  private detectPreferredStyle(messages: Message[]): 'detailed' | 'concise' | 'step_by_step' {
    const userMessages = messages.filter(m => m.role === 'user');
    const content = userMessages.map(m => m.content).join(' ').toLowerCase();
    
    if (content.includes('paso a paso') || content.includes('ejemplo') || content.includes('cómo')) {
      return 'step_by_step';
    }
    if (content.includes('resumen') || content.includes('breve') || content.includes('rápido')) {
      return 'concise';
    }
    return 'detailed';
  }

  // Heurística simple para detectar cuando el usuario explícitamente solicita usar documentos/PDFs
  private needsDocumentContext(text: string) {
    if (!text) return false;
    const s = text.toLowerCase();
    const keywords = [
      'documento',
      'documentos',
      'pdf',
      'archivo',
      'archivos',
      'apunte',
      'apuntes',
      'subido',
      'subidos',
      'analiza',
      'analizar',
      'buscar en',
      'basado en',
      'basada en',
      'usar documento',
      'usar documentos',
      'sobre el documento',
      'sobre el pdf',
      'referente a',
      'referente al documento'
    ];

    return keywords.some(k => s.includes(k));
  }

  // Detecta intención de materia/ramo: ej. "necesito ayuda con matematicas discretas"
  private extractSubjectIntent(text: string): string | null {
    if (!text) return null;
    const s = this.removeAccents(text.toLowerCase()).trim();

    // Patrones comunes en español
    const patterns: RegExp[] = [
      /(necesito|requiero|quiero|busco)?\s*ayuda\s*(en|con)\s+([^\.,;\n\r]+)$/i,
      /ayudame\s*(en|con)\s+([^\.,;\n\r]+)$/i,
      /(estudiar|aprender|repasar)\s+([^\.,;\n\r]+)$/i,
      /(problemas|ejercicios)\s*(de|con)\s+([^\.,;\n\r]+)$/i,
      /(materia|ramo|curso)\s*(de|:)?\s+([^\.,;\n\r]+)$/i
    ];

    for (const re of patterns) {
      const m = s.match(re);
      if (m) {
        // El último grupo suele capturar la materia
        const subject = (m[m.length - 1] || '').trim();
        if (subject && subject.length >= 3) {
          // Recortar conectores comunes al final
          const cleaned = subject
            .replace(/\b(para|y|con|de|en|del)\b.*$/i, '')
            .replace(/[\s:,-]+$/, '')
            .trim();
          if (cleaned && cleaned.length >= 3) return cleaned;
        }
      }
    }
    return null;
  }

  // Quitar tildes para facilitar matching
  private removeAccents(str: string): string {
    return str.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  // Detecta si la consulta es sobre si existen apuntes/notas en la BBDD
  // También extrae la materia si se menciona (ej: "tienes apuntes de quimica")
  private isQueryAboutNotes(text: string): { isQuery: boolean; subject?: string } {
    if (!text) return { isQuery: false };
    const s = this.removeAccents(text.toLowerCase());
    const keywords = [
      'tienes apuntes',
      'hay apuntes',
      'apuntes disponibles',
      'apuntes en la bbdd',
      'apuntes en su bbdd',
      'apuntes en la base de datos',
      'notas en la base de datos',
      'documentos subidos',
      'apuntes subidos',
      'tienes notas',
      'hay notas',
      'hay documentos',
      'tienen apuntes',
      'tienes material',
      'hay material',
      'tienes documentos',
      'tienes pdf'
    ];
    
    const isQuery = keywords.some(k => s.includes(k));
    if (!isQuery) return { isQuery: false };
    
    // Intentar extraer materia de la pregunta
    // Patrones: "tienes apuntes de X", "hay apuntes de X", "apuntes de X"
    const subjectPatterns = [
      /(?:tienes|hay|tienen)\s+(?:apuntes|notas|documentos|material|pdf)\s+(?:de|sobre|acerca de)\s+([a-záéíóúñ\s]+?)(?:\?|$|\.|,)/i,
      /(?:apuntes|notas|documentos|material|pdf)\s+(?:de|sobre|acerca de)\s+([a-záéíóúñ\s]+?)(?:\?|$|\.|,)/i,
      /(?:tienes|hay)\s+([a-záéíóúñ\s]+?)\s+(?:apuntes|notas|documentos|material)/i
    ];
    
    for (const pattern of subjectPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const subject = match[1].trim();
        // Validar que no sea una palabra vacía o muy corta
        if (subject.length >= 3 && !['el', 'la', 'los', 'las', 'un', 'una'].includes(subject.toLowerCase())) {
          return { isQuery: true, subject };
        }
      }
    }
    
    return { isQuery: true };
  }

  // Verifica si el documento coincide con la materia detectada (por título o subject)
  private subjectMatchesDoc(d: any, sqNorm: string): boolean {
    const norm = (s?: string) => this.removeAccents((s || '').toLowerCase());
    const title = norm(d?.title);
    const subj = norm(d?.subject);
    if (!sqNorm) return false;
    if (title.includes(sqNorm) || subj.includes(sqNorm)) return true;
    // Coincidencia por tokens: requiere al menos 1 token de la query en el título/subject
    const tokens = (sqNorm.match(/[a-z0-9]{3,}/gi) || []).filter(Boolean);
    return tokens.some(t => title.includes(t) || subj.includes(t));
  }

  // Detecta si el usuario pide explícitamente usar un apunte/documento y extrae el título sugerido
  private extractRequestedDocumentTitle(text: string): string | null {
    if (!text) return null;
    const s = this.removeAccents(text.toLowerCase());
    // Patrones básicos
    const patterns: RegExp[] = [
      /(usa|usar|utiliza|utilizar|apoyate|apoyarse|basate|basarse)\s*(en|el|la|este|esta)?\s*(apunte|documento|pdf)\s*(para\s*responder|para)?\s*[:\-]?\s*"([^"]+)"/i,
      /(usa|usar|utiliza|utilizar|apoyate|basate)\s*(en|el|la|este|esta)?\s*(apunte|documento|pdf)\s*(para\s*responder|para)?\s*[:\-]?\s*'([^']+)'/i,
      /(usa|usar|utiliza|utilizar|apoyate|basate)\s*(en|el|la|este|esta)?\s*(apunte|documento|pdf)\s*(para\s*responder|para)?\s*[:\-]?\s*([^\n\r]+)/i
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m) {
        const candidate = (m[5] || m[6] || m[7] || '').trim();
        if (candidate && candidate.length >= 2) {
          // Limpiar comillas/espacios finales
          return candidate.replace(/[\s\.:,;]+$/,'');
        }
      }
    }
    // Alternativa: si hay dos puntos, tomar lo que sigue
    const colonIdx = text.indexOf(':');
    if (colonIdx !== -1) {
      const tail = text.slice(colonIdx + 1).trim();
      if (tail && tail.length >= 2) return tail.replace(/[\s\.:,;]+$/,'');
    }
    return null;
  }

  // Extraer palabras clave simples para búsqueda (sin stopwords)
  private extractKeywords(text: string): string[] {
    if (!text) return [];
    const s = this.removeAccents(text.toLowerCase());
    const words = s.match(/[a-záéíóúñ0-9]{3,}/gi) || [];
    const stop = new Set(['necesito','ayuda','con','en','para','de','el','la','los','las','un','una','unos','unas','y','o','que','por','sobre','del','al','me','puedes','puedo','quiero','tengo','hay','ramo','materia','curso','tema','temas','apuntes','notas','documentos','pdf','bbdd','base','datos']);
    const filtered = words.filter(w => !stop.has(w) && w.length >= 3);
    // Devolver únicos, priorizando orden de aparición
    const seen = new Set<string>();
    const out: string[] = [];
    for (const w of filtered) {
      if (!seen.has(w)) {
        seen.add(w);
        out.push(w);
      }
    }
    return out.slice(0, 5);
  }

  // Evitar decir "no hay apuntes" si sí existen publicados
  private sanitizeAnswerWithInventory(answer: string, publishedCount: number): string {
    if (!answer) return answer;
    if (publishedCount <= 0) return answer;
    const s = this.removeAccents(answer.toLowerCase());
    const negatives = [
      'no tengo apuntes',
      'no hay apuntes',
      'no tengo documentos',
      'no hay documentos',
      'no tengo pdf',
      'no hay pdf'
    ];
    if (negatives.some(n => s.includes(n))) {
      return `Sí, tengo apuntes publicados. ${answer}`;
    }
    return answer;
  }

  async queryWithDocument(
    text: string,
    documentId: string,
    opts?: { userId?: string; conversationId?: string; title?: string }
  ) {
    // Si no hay OpenAI configurado → usar mock
    if (!this.openai) {
      console.warn('No OpenAI API key found, using mock response.');
      return this.getMockAcademicResponse(text);
    }

    try {
      // Obtener documento específico
      const doc = await this.docs.find(documentId);
      if (!doc) {
        return {
          error: 'Documento no encontrado',
          answer: 'No se pudo encontrar el documento especificado.'
        };
      }

      // Procesar el PDF específico
      let pdfContext = '';
      try {
        const docAny = doc as any;
        const filePath = this.resolvePathOrUrl(docAny.file_url || docAny.filePath || docAny.path || docAny.contentUrl);
        if (filePath) {
          const pdfContent = await this.pdfProcessor.extractTextFromPdf(filePath);
          if (pdfContent.trim()) {
            const docTitle = docAny.title || docAny.subject || 'Documento';
            pdfContext = `\n\nCONTEXTO DEL DOCUMENTO "${docTitle}":\n${pdfContent.substring(0, 8000)}`;
          }
        }
      } catch (error) {
        console.warn('Error processing PDF for context:', error);
      }

      const model = this.configService.get<string>('app.openaiModel') || 'gpt-4o-mini';
      
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: this.systemPrompt
          },
          {
            role: 'user',
            content: `Pregunta del estudiante: ${text}${pdfContext}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 0.9
      });

      const answer = completion.choices[0]?.message?.content || 'No se pudo generar una respuesta.';

      // Persistir historial si aplica
      let finalConversationId = opts?.conversationId;
      try {
        if (opts?.userId) {
          if (!finalConversationId) {
            const title = opts?.title || this.generateTitleFromText(text);
            const conv = await this.createConversation(opts.userId, title);
            finalConversationId = conv.id as unknown as string;
          }
          await this.addMessage(finalConversationId!, text, 'user');
          await this.addMessage(finalConversationId!, answer, 'assistant');
        }
      } catch (persistErr) {
        console.warn('⚠️ No se pudo persistir el historial (query-with-document):', persistErr);
      }

      return {
        answer,
        relatedDocuments: [doc],
        usedDocument: doc,
        model: model,
        usage: completion.usage,
        conversationId: finalConversationId
      };
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      const message = error?.message || error?.response?.data || String(error);
      console.error('Error calling OpenAI API with document:', { status, message });
      return {
        error: 'Error al conectar con el asistente académico. Intenta nuevamente más tarde.',
        answer: 'Lo siento, no pude procesar tu consulta en este momento. Por favor, intenta nuevamente.',
      };
    }
  }

  async analyzeAllDocuments(question: string) {
    // Si no hay OpenAI configurado → usar mock
    if (!this.openai) {
      console.warn('No OpenAI API key found, using mock response.');
      return this.getMockAcademicResponse(question);
    }

    try {
  // Obtener TODOS los documentos disponibles
  const res = await this.docs.list(1, 200);
  const allDocs = Array.isArray(res.items) ? res.items : [];
      
      console.log(`📚 Analizando ${allDocs.length} documentos para: "${question}"`);

      if (allDocs.length === 0) {
        return {
          answer: 'No hay documentos subidos para analizar. Por favor, sube algunos PDFs primero.',
          documentsProcessed: 0,
          model: 'gpt-4o'
        };
      }

      // Procesar TODOS los PDFs disponibles
      let pdfContext = '';
      try {
        const pdfPaths = allDocs
          .map((doc: any) => this.resolvePathOrUrl(doc.file_url || doc.filePath || doc.path || doc.contentUrl))
          .filter(path => path && (path.endsWith('.pdf') || path.includes('.pdf')));
        
        console.log(`📄 Procesando ${pdfPaths.length} archivos PDF...`);
        
        if (pdfPaths.length > 0) {
          const pdfContents = await this.pdfProcessor.processMultiplePdfs(pdfPaths);
          
          // Combinar contenido de PDFs con información del documento
          const combinedContent = pdfContents
            .map((pdf, index) => {
              const docInfo = allDocs.find(d => 
                (d as any).file_url === pdf.filePath ||
                (d as any).filePath === pdf.filePath || 
                (d as any).path === pdf.filePath ||
                (d as any).contentUrl === pdf.filePath
              );
              const docTitle = docInfo ? (docInfo as any).title || (docInfo as any).subject || `Documento ${index + 1}` : `Documento ${index + 1}`;
              return `--- ${docTitle} ---\n${pdf.content}`;
            })
            .join('\n\n')
            .substring(0, 15000); // Límite más alto para análisis completo
          
          if (combinedContent.trim()) {
            pdfContext = `\n\nCONTENIDO DE TODOS LOS DOCUMENTOS:\n${combinedContent}`;
            console.log(`✅ Contexto completo cargado: ${combinedContent.length} caracteres`);
          }
        }
      } catch (error) {
        console.warn('Error processing PDFs for analysis:', error);
      }

  const model = this.configService.get<string>('app.openaiModel') || 'gpt-4o-mini';
      
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `Eres un asistente académico especializado en análisis de documentos. 
            Tu tarea es analizar el contenido de los documentos PDF subidos y responder preguntas específicas basándote en ese contenido.
            Responde siempre en español y sé preciso con la información extraída de los documentos.`
          },
          {
            role: 'user',
            content: `Pregunta: ${question}${pdfContext}`
          }
        ],
        temperature: 0.3, // Menor temperatura para respuestas más precisas
        max_tokens: 2000,
        top_p: 0.9
      });

      const answer = completion.choices[0]?.message?.content || 'No se pudo generar una respuesta.';

      return {
        answer,
        documentsProcessed: allDocs.length,
        model: model,
        usage: completion.usage,
        pdfContextLength: pdfContext.length
      };
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      const message = error?.message || error?.response?.data || String(error);
      console.error('Error analyzing documents:', { status, message });
      return {
        error: 'Error al analizar los documentos. Intenta nuevamente más tarde.',
        answer: 'Lo siento, no pude procesar el análisis de documentos en este momento.',
      };
    }
  }

  // Normaliza una ruta potencial de PDF a una ruta local o URL completa
  private resolvePathOrUrl(p?: string): string | undefined {
    if (!p) return undefined;
    // Si ya es URL absoluta
    if (/^https?:\/\//i.test(p)) return p;
    // Si comienza con /uploads, construir URL absoluta para fetch si se requiere
    if (p.startsWith('/uploads/')) {
      const base = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
      return `${base}${p}`;
    }
    return p;
  }

  private async getMockAcademicResponse(text: string) {
    // Buscar documentos reales en la base de datos
    try {
      const result = await this.docs.list(1, 20);
      const allDocs = result.items || [];
      
      // Buscar documentos relacionados con el texto
      const related = allDocs.filter((d: { subject?: string; title?: string }) => {
        const searchText = text.toLowerCase();
        const docSubject = (d.subject || '').toLowerCase();
        const docTitle = (d.title || '').toLowerCase();
        return docSubject.includes(searchText) || docTitle.includes(searchText);
      });

      let response = '';
      
      if (related.length > 0) {
        response = `Tengo estos apuntes disponibles:\n\n`;
        related.slice(0, 5).forEach((doc: any, index: number) => {
          const title = doc.title || doc.subject || 'Documento';
          const subject = doc.subject ? ` (${doc.subject})` : '';
          response += `${index + 1}. ${title}${subject}\n`;
        });
        response += `\n¿Quieres que use alguno para ayudarte?`;
      } else {
        response = `No tengo apuntes específicos disponibles, pero puedo ayudarte con conceptos. ¿Qué necesitas saber?`;
      }

      return {
        answer: response,
        relatedDocuments: related.slice(0, 5),
      };
    } catch (error) {
      console.error('Error en getMockAcademicResponse:', error);
      return {
        answer: 'No pude acceder a los apuntes en este momento. ¿Podrías intentar de nuevo?',
        relatedDocuments: [],
      };
    }
  }

  // Genera un título corto a partir del primer mensaje del usuario
  private generateTitleFromText(text: string): string {
    if (!text) return 'Nueva conversación';
    // Limpiar markdown, código, LaTeX y URLs
    let t = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]*)`/g, ' $1 ')
      .replace(/\$\$[\s\S]*?\$\$/g, ' ')
      .replace(/\\\[[\s\S]*?\\\]/g, ' ')
      .replace(/\\\([\s\S]*?\\\)/g, ' ')
      .replace(/\$(?:[^$\n]+)\$/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/pregunta del estudiante\s*:\s*/i, ' ')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!t) return 'Nueva conversación';

    // Elegir primeras palabras significativas (8 máx), filtrando stopwords comunes en español
    const stopwords = new Set(['de','la','el','y','en','que','para','con','del','los','las','un','una','por','como','sobre','al','a','se','su','sus','lo','las','les','le']);
    const words = t.split(' ')
      .filter(w => !!w)
      .filter((w, idx) => idx === 0 || !stopwords.has(w.toLowerCase()));
    let candidate = words.slice(0, 8).join(' ');
    if (!candidate) candidate = t.split(' ').slice(0, 6).join(' ');

    // Capitalizar y limitar a 60 caracteres
    candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1);
    if (candidate.length > 60) {
      const cut = candidate.slice(0, 60);
      const lastSpace = cut.lastIndexOf(' ');
      candidate = (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim() + '…';
    }
    return candidate || 'Nueva conversación';
  }

  // Diagnóstico simple del estado del chatbot/OpenAI
  getDiagnostics() {
    const model = this.configService.get<string>('app.openaiModel') || 'gpt-4o-mini';
    return {
      openaiConfigured: !!this.openai,
      model,
    };
  }

  // Métodos para manejar conversaciones con Supabase
  async createConversation(userId: string, title?: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: title || 'Nueva conversación'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating conversation: ${error.message}`);
    }

    return data;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching conversations: ${error.message}`);
    }

    return data || [];
  }

  async addMessage(conversationId: string, content: string, role: 'user' | 'assistant'): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content,
        role
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error adding message: ${error.message}`);
    }

    // Actualizar la fecha de la conversación
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error fetching messages: ${error.message}`);
    }

    return data || [];
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      throw new Error(`Error deleting conversation: ${error.message}`);
    }
  }
}
