
import React, { useRef, useEffect, useState } from 'react';
import { formatDate } from '@/utils/dateFormatters';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAllGptData } from '@/hooks/useAllGptData';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';

interface Message {
  id: string;
  from: { user_id: number };
  to: { user_id: number };
  text: string;
  message_date: {
    received: string;
    available: string;
    created: string;
    read: string;
  };
  message_attachments: any[] | null;
}

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sellerId: string | null;
  packId: string | null;
  onMessageSent?: () => void;
}

const MessagesList: React.FC<MessagesListProps> = ({ 
  messages, 
  isLoading, 
  error, 
  sellerId,
  packId,
  onMessageSent
}) => {
  // Create a ref for the messages container to scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  
  // Fetch GPT message IDs from the allgpt table
  const { gptMessageIds } = useAllGptData(sellerId);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isLoading]);

  // Convert sellerId to number for comparison
  const sellerIdNum = sellerId ? parseInt(sellerId, 10) : null;

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !sellerId || !packId) {
      return;
    }

    setSending(true);
    try {
      const response = await axios.post(`${NGROK_BASE_URL}/enviamsg`, {
        seller_id: sellerId,
        pack_id: packId,
        text: messageText
      });

      toast.success("Mensagem enviada com sucesso");
      setMessageText('');
      
      // Notify parent component that a message was sent to refresh the list
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-500 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <p>Nenhuma mensagem encontrada para esta conversa</p>
      </div>
    );
  }

  // Group messages by date
  const messagesByDate: Record<string, Message[]> = {};
  messages.forEach((message) => {
    const date = formatDate(message.message_date.created);
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    messagesByDate[date].push(message);
  });

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4">
          {Object.entries(messagesByDate).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex justify-center my-3">
                <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                  {date}
                </div>
              </div>
              
              {dateMessages.map((message) => {
                const isSeller = message.from.user_id === sellerIdNum;
                // Check if this message is a GPT message (only for seller messages)
                const isGptMessage = isSeller && gptMessageIds.includes(message.id);
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex ${isSeller ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div 
                      className={`rounded-lg p-3 max-w-[70%] shadow-sm ${
                        isSeller 
                          ? isGptMessage 
                            ? 'bg-blue-100 text-gray-800' // GPT message from seller
                            : 'bg-green-100 text-gray-800' // Regular message from seller
                          : 'bg-white text-gray-800'  // Message from buyer
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      <p className="text-xs text-gray-500 text-right mt-1">
                        {new Date(message.message_date.created).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {/* This is the element we'll scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Message input area */}
      <div className="p-3 bg-white border-t flex gap-2 sticky bottom-0">
        <Input 
          placeholder="Digite sua mensagem..." 
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={!packId || sending}
          className="flex-1"
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!packId || sending || !messageText.trim()} 
          className="flex-shrink-0"
        >
          {sending ? (
            <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full" />
          ) : (
            <Send size={18} className="mr-1" />
          )}
          Enviar
        </Button>
      </div>
    </div>
  );
}

export default MessagesList;
