
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';

interface MessageAttachment {
  filename: string;
  original_filename: string;
  status: string;
}

interface Message {
  id: string;
  from: { user_id: number };
  to: { user_id: number };
  text: string;
  message_date: {
    received: string;
    available: string;
    notified: string;
    created: string;
    read: string;
  };
  message_attachments: MessageAttachment[] | null;
}

interface MessagesResponse {
  total: number;
  limit: number;
  offset: number;
  messages: Message[];
}

export function usePackMessages(
  packId: string | null, 
  sellerId: string | null,
  refreshTrigger: number = 0
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const backgroundRefreshingRef = useRef(false);
  const existingMessageIdsRef = useRef<Set<string>>(new Set());
  const currentPackIdRef = useRef<string | null>(null);

  const fetchMessages = async (targetPackId: string, isBackgroundRefresh = false) => {
    if (!sellerId) {
      return;
    }
    
    if (!isBackgroundRefresh && targetPackId === currentPackIdRef.current) {
      setIsLoading(true);
    }
    
    if (isBackgroundRefresh) {
      backgroundRefreshingRef.current = true;
    }
    
    try {
      const response = await axios.get(`${NGROK_BASE_URL}/conversas`, {
        params: {
          seller_id: sellerId,
          pack_id: targetPackId,
          limit: 100,
          offset: 0
        }
      });
      
      if (response.data && Array.isArray(response.data.messages)) {
        const newMessages = response.data.messages;
        
        if (targetPackId === currentPackIdRef.current) {
          if (!isInitialLoadRef.current || isBackgroundRefresh) {
            const messagesToAdd = newMessages.filter(newMsg => 
              !existingMessageIdsRef.current.has(newMsg.id)
            );
            
            if (messagesToAdd.length > 0) {
              console.log(`Adding ${messagesToAdd.length} new messages from refresh for pack ${targetPackId}`);
              
              setMessages(prev => {
                const updatedMessages = [...prev, ...messagesToAdd].sort((a, b) => 
                  new Date(a.message_date.created).getTime() - new Date(b.message_date.created).getTime()
                );
                
                messagesToAdd.forEach(msg => existingMessageIdsRef.current.add(msg.id));
                
                return updatedMessages;
              });
            } else {
              console.log('No new messages found during refresh');
            }
          } else {
            setMessages(newMessages);
            
            existingMessageIdsRef.current = new Set(newMessages.map(msg => msg.id));
            
            console.log(`Loaded ${newMessages.length} messages for pack ID: ${targetPackId}`);
          }
        } else {
          console.log(`Fetched ${newMessages.length} messages for non-active pack ${targetPackId}`);
        }
      } else {
        if (!isBackgroundRefresh && targetPackId === currentPackIdRef.current) {
          console.error("Invalid response format from messages API:", response.data);
          setError("Formato de resposta inválido ao carregar mensagens");
        }
      }
    } catch (error: any) {
      if (!isBackgroundRefresh && targetPackId === currentPackIdRef.current) {
        console.error("Error fetching messages:", error);
        setError("Erro ao carregar mensagens");
      } else {
        console.error("Background refresh error:", error);
      }
    } finally {
      if (!isBackgroundRefresh && targetPackId === currentPackIdRef.current) {
        setIsLoading(false);
      }
      
      if (isBackgroundRefresh) {
        backgroundRefreshingRef.current = false;
      }
      
      if (targetPackId === currentPackIdRef.current) {
        isInitialLoadRef.current = false;
      }
    }
  };

  useEffect(() => {
    if (packId !== currentPackIdRef.current) {
      setMessages([]);
      existingMessageIdsRef.current.clear();
      isInitialLoadRef.current = true;
      currentPackIdRef.current = packId;
    }
    
    if (packId && sellerId) {
      fetchMessages(packId);
    }
    
    // Substituindo o checkForceRefreshInterval por uma atualização direta a cada 30 segundos
    const periodicRefreshIntervalId = setInterval(() => {
      if (packId && sellerId && !backgroundRefreshingRef.current && currentPackIdRef.current) {
        console.log('Periodic refresh triggered, fetching latest messages');
        fetchMessages(currentPackIdRef.current, true);
      }
    }, 30000); // Atualização a cada 30 segundos
    
    return () => {
      clearInterval(periodicRefreshIntervalId);
    };
  }, [packId, sellerId, refreshTrigger]);

  const updatePackMessages = async (targetPackId: string) => {
    if (!sellerId) return;
    
    if (targetPackId === currentPackIdRef.current) {
      fetchMessages(targetPackId, false);
    } else {
      fetchMessages(targetPackId, true);
    }
  };

  return { messages, isLoading, error, updatePackMessages };
}
