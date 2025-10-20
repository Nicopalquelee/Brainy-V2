import React, { useState } from 'react';
import { Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { ChatMessage } from '../types/Note';

const ChatSidebar = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente académico especializado en ayudarte con tus asignaturas universitarias. Puedo ayudarte con explicaciones de conceptos, resolución de problemas, métodos de estudio y más. ¿En qué materia necesitas ayuda hoy?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Llamar al backend para obtener respuesta del bot
    try {
      const api = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
      const base = api.replace(/\/$/, '');
      const res = await fetch(`${base}/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputValue })
      });
      const data = await res.json();
      
      // Extract the actual message content from the response
      let botText = '';
      if (data.answer?.choices?.[0]?.message?.content) {
        botText = data.answer.choices[0].message.content;
      } else if (data.answer?.choices) {
        botText = JSON.stringify(data.answer);
      } else if (data.answer) {
        botText = data.answer;
      } else {
        botText = 'No se pudo obtener una respuesta del asistente.';
      }
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Error al conectar con el chatbot. Intenta nuevamente más tarde.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }

    setInputValue('');
  };

  const getBotResponse = (_userInput: string): string => {
    // ahora la respuesta viene desde el backend; esto se mantiene por compatibilidad
    return 'Consultando al chatbot...';
  };

  const formatMessage = (text: string) => {
    // Convert markdown to HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/🐍|📚|📊|🔢|⚡|🧮|🧪|⚗️|🎓|💡|🤔/g, '$&'); // Keep emojis
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`bg-card border-l border-border flex flex-col transition-all duration-300 ${
      isMinimized ? 'w-16' : 'w-80'
    } h-screen sticky top-0`}>
      {/* Header del chat */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!isMinimized && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Asistente Académico</h3>
              <p className="text-xs text-muted-foreground">Especialista en materias universitarias</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Área de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-primary' 
                      : 'bg-secondary'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-3 h-3 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-foreground'
                  }`}>
                    <p 
                      className="text-sm leading-relaxed" 
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input de mensaje */}
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta sobre cualquier materia universitaria..."
                className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground p-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatSidebar;