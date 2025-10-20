import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Loader2, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { fetchJson } from '../lib/api';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface BrainyChatProps {
  onBack: () => void;
}

const BrainyChat: React.FC<BrainyChatProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy Brainy, tu asistente académico especializado en ayudarte con tus asignaturas universitarias. Puedo ayudarte con explicaciones de conceptos, resolución de problemas, métodos de estudio y más. ¿En qué materia necesitas ayuda hoy?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [token, setToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{ id: string; title?: string; updated_at?: string }>>([]);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [relatedDocs, setRelatedDocs] = useState<any[] | null>(null);
  const [relatedSubject, setRelatedSubject] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastUserMessageRef = useRef<string>('');
  const [activeDocument, setActiveDocument] = useState<{ id: string; title?: string; subject?: string } | null>(null);

  // Funciones para reproducir sonidos
  const playSendSound = () => {
    if (!soundsEnabled) return;
    
    try {
      // Crear un sonido de envío usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  };

  const playReceiveSound = () => {
    if (!soundsEnabled) return;
    
    try {
      // Crear un sonido de recepción usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  };

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    if (autoScroll) scrollToBottom();
  }, [messages, autoScroll]);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    // Consider near-bottom if within 80px
    setAutoScroll(distanceFromBottom < 80);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Obtener token del backend (JWT) y userId desde /users/me
  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    let mounted = true;
    if (t) {
      fetchJson<any>('/users/me', { token: t })
        .then((me) => {
          if (!mounted) return;
          const id = (me && me.id) ? String(me.id) : undefined;
          setUserId(id);
        })
        .catch(() => {
          if (!mounted) return;
          setUserId(undefined);
        });
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Cargar conversaciones del usuario
  const loadConversations = async () => {
    if (!token || !userId) {
      setConversations([]);
      return;
    }
    try {
      setIsLoadingConvs(true);
      const list = await fetchJson<any[]>(`/chat/conversations/${userId}`, { token });
      // Asegurar forma mínima
      const mapped = (Array.isArray(list) ? list : []).map((c: any) => ({ id: String(c.id), title: c.title, updated_at: c.updated_at }));
      setConversations(mapped);
    } catch (e) {
      setConversations([]);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  useEffect(() => {
    // Cuando tengamos token y userId, cargamos conversaciones
    if (token && userId) {
      loadConversations();
    }
  }, [token, userId]);

  // Abrir una conversación existente
  const openConversation = async (id: string) => {
    if (!token) return;
    try {
      const msgs = await fetchJson<any[]>(`/chat/conversations/${id}/messages`, { token });
      const mapped: Message[] = (Array.isArray(msgs) ? msgs : []).map((m: any) => ({
        id: String(m.id),
        text: m.content || '',
        isUser: (m.role === 'user'),
        timestamp: new Date(m.created_at || Date.now())
      }));
      setMessages(mapped.length > 0 ? mapped : messages);
      setConversationId(id);
      // Focus back to input
      inputRef.current?.focus();
    } catch (e) {
      // ignore silently
    }
  };

  // Borrar una conversación
  const deleteConversation = async (id: string) => {
    if (!token) return;
    try {
      await fetchJson(`/chat/conversations/${id}`, { method: 'DELETE', token });
      if (conversationId === id) {
        setConversationId(undefined);
        // Reset messages to greeting
        setMessages([{ id: '1', text: messages[0]?.text || '¿En qué materia necesitas ayuda hoy?', isUser: false, timestamp: new Date() }]);
      }
      loadConversations();
    } catch (e) {
      // ignore silently
    }
  };

  // Nuevo chat: limpia mensajes y conversationId
  const startNewChat = () => {
    setConversationId(undefined);
    setMessages([
      {
        id: '1',
        text: '¡Hola! Soy Brainy, tu asistente académico especializado en ayudarte con tus asignaturas universitarias. Puedo ayudarte con explicaciones de conceptos, resolución de problemas, métodos de estudio y más. ¿En qué materia necesitas ayuda hoy?',
        isUser: false,
        timestamp: new Date()
      }
    ]);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    lastUserMessageRef.current = userMessage.text;
  setInputText('');
    setIsLoading(true);
    
    // Reproducir sonido de envío
    playSendSound();

    try {
      // Si hay un documento activo, usar el endpoint query-with-document
      const endpoint = activeDocument
        ? `/chat/query-with-document/${activeDocument.id}`
        : '/chat/query';
      const body: any = activeDocument
        ? { text: userMessage.text, conversationId }
        : { text: userMessage.text, conversationId };

      const data = await fetchJson<any>(endpoint, {
        method: 'POST',
        token: token || undefined,
        body
      });
      
      // Extract the actual message content from the response
      let botText = '';
      console.log('Response data:', data); // Debug log
      
      if (data.answer) {
        botText = data.answer;
        // NOTE: intentionally do not append model attribution or proactively list related documents.
        // If the backend returns relatedDocuments and you want to show them, the backend should include
        // an explicit flag (e.g. showRelated: true) and the frontend can render them separately.
        if (data.showRelated && Array.isArray(data.relatedDocuments)) {
          setRelatedDocs(data.relatedDocuments);
          setRelatedSubject(data.subjectQuery || null);
        } else {
          setRelatedDocs(null);
          setRelatedSubject(null);
        }
        // Si el backend confirma qué documento se usó, podemos fijarlo o actualizar el título
        if (!activeDocument && data.usedDocument) {
          setActiveDocument({ id: String(data.usedDocument.id), title: data.usedDocument.title, subject: data.usedDocument.subject });
        }
      } else if (data.response) {
        botText = data.response;
      } else if (data.error) {
        botText = data.error;
      } else if (typeof data === 'string') {
        botText = data;
      } else {
        botText = 'No se pudo obtener una respuesta del asistente.';
        console.error('Unexpected response format:', data);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        isUser: false,
        timestamp: new Date()
      };

  setMessages(prev => [...prev, botMessage]);

      // Guardar conversationId si el backend lo devuelve
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        // recargar lista de conversaciones
        loadConversations();
      }
      
      // Reproducir sonido de recepción
      playReceiveSound();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Error al conectar con el chatbot. Intenta nuevamente más tarde.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Reproducir sonido de error (más grave)
      playReceiveSound();
    } finally {
      setIsLoading(false);
      // Reenfocar el input para permitir seguir escribiendo sin hacer click
      try {
        inputRef.current?.focus();
      } catch {}
    }
  };

  const formatMessage = (text: string) => {
    // Basic Markdown: headings
    let html = text;
    html = html.replace(/^###\s+(.*)$/gm, '<h3 class="text-base font-semibold mt-3 mb-2">$1</h3>');
    html = html.replace(/^##\s+(.*)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-2">$1</h2>');
    html = html.replace(/^#\s+(.*)$/gm, '<h1 class="text-xl font-bold mt-3 mb-2">$1</h1>');
    // Bold/italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Math rendering with KaTeX if available
    try {
      // Block math $$...$$
      html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_m, expr) => renderKatex(expr, true));
      // Block math \[ ... \]
      html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_m, expr) => renderKatex(expr, true));
      // Inline math $...$
      html = html.replace(/(?<!\\)\$(.+?)(?<!\\)\$/g, (_m, expr) => renderKatex(expr, false));
      // Inline math \( ... \)
      html = html.replace(/\\\((.+?)\\\)/g, (_m, expr) => renderKatex(expr, false));
    } catch {
      // Fallback: leave as-is
    }

    // Newlines
    html = html.replace(/\n/g, '<br>');
    return html;
  };

  function renderKatex(expr: string, displayMode: boolean): string {
    try {
      if (katex && typeof katex.renderToString === 'function') {
        return katex.renderToString(expr, { displayMode, throwOnError: false });
      }
    } catch {}
    // Fallback to code style if KaTeX is not available
    return displayMode
      ? `<pre class="bg-accent/40 rounded p-2 overflow-auto">${escapeHtml(expr)}</pre>`
      : `<code class="bg-accent/40 rounded px-1">${escapeHtml(expr)}</code>`;
  }

  function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
  <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Brainy</h1>
                <p className="text-sm text-muted-foreground">Tu asistente académico</p>
              </div>
            </div>
          </div>
          
          {/* Botón de sonido */}
          <button
            onClick={() => setSoundsEnabled(!soundsEnabled)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
            title={soundsEnabled ? 'Desactivar sonidos' : 'Activar sonidos'}
          >
            {soundsEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Content area: left sidebar + chat */}
  <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left sidebar: Conversations */}
        <aside className="w-80 border-r border-border bg-card flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Conversaciones</h2>
            <button
              onClick={startNewChat}
              className="text-sm text-primary hover:text-primary/90 px-2 py-1 rounded-md hover:bg-accent"
              title="Nuevo chat"
            >
              Nuevo
            </button>
          </div>
          {!token ? (
            <div className="p-4 text-sm text-muted-foreground">Inicia sesión para ver tu historial de chats.</div>
          ) : !userId ? (
            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoadingConvs ? (
                <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No hay conversaciones aún.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {conversations.map((c) => (
                    <li key={c.id} className="px-3 py-2 hover:bg-accent/50 flex items-center justify-between group">
                      <button
                        className="text-left flex-1 pr-2"
                        onClick={() => openConversation(c.id)}
                        title={c.title || 'Conversación'}
                      >
                        <p className="text-sm text-foreground truncate">{c.title || 'Conversación'}</p>
                        {c.updated_at && (
                          <p className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleString()}</p>
                        )}
                      </button>
                      <button
                        onClick={() => deleteConversation(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>

        {/* Chat column */}
  <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar"
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
          >
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start space-x-3 max-w-[80%] ${
                      message.isUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.isUser
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : 'bg-gradient-to-br from-purple-500 to-blue-600'
                      }`}
                    >
                      {message.isUser ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.isUser
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-card border border-border text-foreground rounded-bl-md'
                      }`}
                    >
                      <p 
                        className="text-sm leading-relaxed" 
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
                      />
                      <p
                        className={`text-xs mt-1 ${
                          message.isUser ? 'text-blue-100' : 'text-muted-foreground'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Brainy está pensando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-card border-t border-border px-4 py-4">
            <div className="max-w-4xl mx-auto">
              {/* Documento activo (modo pegajoso) */}
              {activeDocument && (
                <div className="mb-2 flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/50 border border-border text-foreground">
                    Usando: <strong className="truncate max-w-[220px]">{activeDocument.title || 'Apunte seleccionado'}</strong>
                    {activeDocument.subject && (
                      <span className="text-muted-foreground">({activeDocument.subject})</span>
                    )}
                  </span>
                  <button
                    onClick={() => setActiveDocument(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Dejar de usar este apunte"
                  >
                    Quitar
                  </button>
                </div>
              )}
              {/* Related documents suggestion */}
              {relatedDocs && relatedDocs.length > 0 && (
                <div className="mb-3 p-3 border border-border bg-accent/30 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">
                    {relatedSubject ? `Apuntes relacionados con "${relatedSubject}":` : 'Apuntes relacionados:'}
                  </p>
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                    {relatedDocs.map((d: any) => (
                      <a
                        key={d.id}
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (isLoading) return;
                          try {
                            setIsLoading(true);
                            playSendSound();
                            // Usar la última pregunta del usuario si existe, o un prompt por defecto
                            const question = lastUserMessageRef.current || 'Responde usando este apunte.';
                            const data = await fetchJson<any>(`/chat/query-with-document/${d.id}`, {
                              method: 'POST',
                              token: token || undefined,
                              body: { text: question }
                            });
                            const botText = data?.answer || data?.response || data?.error || 'No se pudo obtener una respuesta.';
                            const botMessage: Message = {
                              id: (Date.now() + 1).toString(),
                              text: botText,
                              isUser: false,
                              timestamp: new Date()
                            };
                            setMessages(prev => [...prev, botMessage]);
                            // Fijar documento activo para próximas preguntas
                            setActiveDocument({ id: String(d.id), title: d.title, subject: d.subject });
                            playReceiveSound();
                          } catch (err) {
                            const errorMessage: Message = {
                              id: (Date.now() + 1).toString(),
                              text: 'Error al usar el apunte seleccionado.',
                              isUser: false,
                              timestamp: new Date()
                            };
                            setMessages(prev => [...prev, errorMessage]);
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="min-w-[220px] max-w-[260px] p-2 bg-card border border-border rounded-lg hover:bg-accent/50"
                        title={d.title || d.subject}
                      >
                        <p className="text-sm font-medium text-foreground truncate">{d.title || 'Sin título'}</p>
                        {d.subject && (
                          <p className="text-xs text-muted-foreground truncate">{d.subject}</p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pregunta sobre cualquier materia universitaria..."
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-input border border-border rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="p-3 bg-primary text-white rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* (removed right sidebar) */}
      </div>
    </div>
  );
};

export default BrainyChat;
