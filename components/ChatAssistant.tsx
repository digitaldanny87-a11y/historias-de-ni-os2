import React, { useState, useEffect, useRef } from 'react';
import { GenerateContentResponse } from "@google/genai";
import { createTopicChatSession } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
  suggestedTopics?: string[];
}

interface ChatAssistantProps {
  onAddTopic: (topic: string) => void;
  selectedTopics: string[];
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ onAddTopic, selectedTopics }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! 👋 Soy tu asistente creativo. Cuéntame qué le gusta al niño/a y te ayudaré a elegir temas geniales.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = createTopicChatSession();
      }
    } catch (e) {
      console.error("Failed to init chat session", e);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const parseResponse = (text: string) => {
    let cleanText = text;
    let suggestedTopics: string[] = [];

    // Try finding JSON block in markdown
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
    
    if (jsonBlockMatch) {
      try {
        suggestedTopics = JSON.parse(jsonBlockMatch[1]);
        cleanText = text.replace(jsonBlockMatch[0], '').trim();
      } catch (e) {
        console.error("Failed to parse topics JSON block", e);
      }
    } else {
        // Fallback: Try finding a raw array pattern like ["topic1", "topic2"]
        const rawArrayMatch = text.match(/\[\s*".*"\s*(?:,\s*".*"\s*)*\]/);
        if (rawArrayMatch) {
            try {
                suggestedTopics = JSON.parse(rawArrayMatch[0]);
                // We keep the text as is if it's mixed, or remove the array if it's at the end
                cleanText = text.replace(rawArrayMatch[0], '').trim();
            } catch (e) {
                console.error("Failed to parse raw JSON array", e);
            }
        }
    }
    
    return { cleanText, suggestedTopics };
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
         chatSessionRef.current = createTopicChatSession();
      }
      
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: userMsg });
      const rawText = result.text || "";
      const { cleanText, suggestedTopics } = parseResponse(rawText);

      setMessages(prev => [...prev, {
        role: 'model',
        text: cleanText,
        suggestedTopics
      }]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Lo siento, tuve un problema pensando. ¿Me lo repites?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      <div 
        className={`bg-white w-80 md:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 pointer-events-auto border border-blue-100 ${
          isOpen ? 'opacity-100 translate-y-0 h-[500px]' : 'opacity-0 translate-y-10 h-0 overflow-hidden'
        }`}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className="font-bold">Asistente Mágico</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
              
              {/* Suggested Topics Buttons */}
              {msg.suggestedTopics && msg.suggestedTopics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.suggestedTopics.map((topic, tIdx) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <button
                        key={tIdx}
                        onClick={() => !isSelected && onAddTopic(topic)}
                        disabled={isSelected}
                        className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-green-100 border-green-300 text-green-700 cursor-default'
                            : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
                        }`}
                      >
                        {isSelected ? '✓ Añadido' : `+ ${topic}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-center gap-1 text-gray-400 text-xs ml-2">
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Escribe aquí..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            ➤
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`mt-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl transition-transform hover:scale-110 pointer-events-auto ${
            isOpen ? 'bg-gray-200 text-gray-600 rotate-90' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white animate-bounce'
        }`}
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
};

export default ChatAssistant;