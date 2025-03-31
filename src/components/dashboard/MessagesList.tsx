
import React, { useRef, useEffect, useState } from 'react';
import { formatDate } from '@/utils/dateFormatters';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAllGptData } from '@/hooks/useAllGptData';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';
import { getNgrokUrl, NGROK_BASE_URL } from '@/config/api';
import { useMlToken } from '@/hooks/useMlToken';

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
  const prevMessagesLengthRef = useRef<number>(0);
  // Track displayed message IDs to prevent duplicates
  const displayedMessageIdsRef = useRef<Set<string>>(new Set());
  // Get ML token for accessing the image attachments
  const mlToken = useMlToken();
  // Add state to track the fullscreen image
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  // Fetch GPT message IDs from the allgpt table
  const { gptMessageIds } = useAllGptData(sellerId);

  // Update displayed message IDs when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      // Update our tracking of displayed messages
      messages.forEach(msg => {
        displayedMessageIdsRef.current.add(msg.id);
      });
    }
  }, [messages]);
  
  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    // Check if messages length changed
    if (messages.length > 0) {
      // Only scroll if:
      // 1. This is the initial load (showing all messages)
      // 2. New messages were added (length increased from previous render)
      // 3. User just sent a message (which is at the bottom)
      const wasMessageAdded = messages.length > prevMessagesLengthRef.current;
      
      if (wasMessageAdded) {
        // Use setTimeout to ensure the DOM has updated
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      // Update the previous messages length reference
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  // Convert sellerId to number for comparison
  const sellerIdNum = sellerId ? parseInt(sellerId, 10) : null;

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !sellerId || !packId) {
      return;
    }

    setSending(true);
    try {
      const response = await axios.post(`${getNgrokUrl('/enviamsg')}`, {
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
  
  if (isLoading && messages.length === 0) {
    // Only show loading when there are no messages yet
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && messages.length === 0) {
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
                      {/* Display attachments if present */}
                      {message.message_attachments && message.message_attachments.length > 0 && (
                        <div className="mb-2">
                          {message.message_attachments.map((attachment, idx) => {
                            if (attachment.filename && attachment.filename.trim()) {
                              const attachmentUrl = `https://api.mercadolibre.com/messages/attachments/${attachment.filename.trim()}?site_id=MLB${mlToken ? `&access_token=${mlToken}` : ''}`;
                              return (
                                <div 
                                  key={idx}
                                  className="mb-2 cursor-pointer" 
                                  onClick={() => setFullScreenImage(attachmentUrl)}
                                >
                                  <img
                                    src={attachmentUrl}
                                    alt={`Anexo ${idx + 1}`}
                                    className="w-24 h-24 object-cover rounded"
                                    onError={(e) => {
                                      console.error("Erro ao carregar imagem:", e);
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                      
                      {/* Display message text */}
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      
                      {/* Display message time */}
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
      
      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setFullScreenImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={fullScreenImage} 
              alt="Imagem ampliada" 
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onError={(e) => {
                console.error("Erro ao carregar imagem em tela cheia:", e);
                setFullScreenImage(null);
                toast.error("Não foi possível carregar a imagem");
              }}
            />
            <button 
              className="absolute top-2 right-2 bg-white rounded-full p-2 text-black"
              onClick={() => setFullScreenImage(null)}
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesList;
