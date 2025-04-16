
import React, { useState, useRef, useEffect } from 'react';
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getNgrokUrl } from '@/config/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface HermesChatProps {
  sellerId: string | null;
}

const HermesChat: React.FC<HermesChatProps> = ({ sellerId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sellerId) return;
    
    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await fetch(getNgrokUrl('/gerente'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          seller_id: sellerId,
          message: userMessage.content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from Hermes');
      }
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Desculpe, não consegui processar sua solicitação.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error communicating with Hermes:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white shadow max-w-3xl mx-auto">
      <div className="p-3 bg-primary text-white font-medium flex items-center">
        <h2 className="text-lg">Hermes Assistente</h2>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-4 min-h-[400px]">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Envie uma mensagem para começar a conversar com Hermes.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div 
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <Separator />
      
      <div className="p-3 border-t">
        <div className="flex gap-2 items-center rounded-full bg-gray-50 pl-4 pr-2 py-1 border">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envie uma mensagem ao Hermes..."
            className="resize-none border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 max-h-20 w-full text-sm"
            disabled={isLoading}
            rows={1}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isLoading || !sellerId}
            className="flex-shrink-0 rounded-full size-9 p-0"
            variant="default"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </div>
        {!sellerId && (
          <p className="text-red-500 text-sm mt-2">
            Seller ID não disponível. É necessário fazer login para utilizar o chat.
          </p>
        )}
      </div>
    </div>
  );
};

export default HermesChat;

