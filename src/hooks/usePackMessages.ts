
import { useState, useEffect, useRef, useCallback } from 'react';
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
  refreshTrigger: number = 0,
  preloadedMessages?: Message[],
  isComplaint: boolean = false
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
      // Se for uma reclamação, não buscamos mensagens do endpoint normal
      if (isComplaint) {
        // No caso de reclamações, usamos os dados que já temos
        // ou poderíamos buscar detalhes adicionais se necessário
        setMessages([
          {
            id: `complaint-${targetPackId}`,
            from: { user_id: 0 },
            to: { user_id: parseInt(sellerId) },
            text: "Esta é uma reclamação. Verifique os detalhes acima.",
            message_date: {
              received: new Date().toISOString(),
              available: new Date().toISOString(),
              notified: new Date().toISOString(),
              created: new Date().toISOString(),
              read: new Date().toISOString()
            },
            message_attachments: null
          }
        ]);
        return;
      }
      
      const response = await axios.get(`${NGROK_BASE_URL}/conversas`, {
        params: {
          seller_id: sellerId,
          pack_id: targetPackId,
          limit: 3000,
          offset: 0
        }
      });
      
      if (response.data && Array.isArray(response.data.messages)) {
        const newMessages = response.data.messages;
        
        if (targetPackId === currentPackIdRef.current) {
          if (isInitialLoadRef.current) {
            setMessages(newMessages);
            existingMessageIdsRef.current = new Set(newMessages.map(msg => msg.id));
            console.log(`Carregadas ${newMessages.length} mensagens para o pack ID: ${targetPackId}`);
          } else if (isBackgroundRefresh) {
            const messagesToAdd = newMessages.filter(newMsg => 
              !existingMessageIdsRef.current.has(newMsg.id)
            );
            
            if (messagesToAdd.length > 0) {
              console.log(`Adicionando ${messagesToAdd.length} novas mensagens do refresh para o pack ${targetPackId}`);
              
              setMessages(prev => {
                const updatedMessages = [...prev, ...messagesToAdd].sort((a, b) => 
                  new Date(a.message_date.created).getTime() - new Date(b.message_date.created).getTime()
                );
                
                messagesToAdd.forEach(msg => existingMessageIdsRef.current.add(msg.id));
                
                return updatedMessages;
              });
            } else {
              console.log('Não foram encontradas novas mensagens');
            }
          } else {
            // Quando não é um refresh em background, significa que estamos forçando uma atualização
            // então devemos recarregar todas as mensagens
            console.log(`Recarregando todas as ${newMessages.length} mensagens para o pack ${targetPackId} devido a uma atualização forçada`);
            setMessages(newMessages);
            existingMessageIdsRef.current = new Set(newMessages.map(msg => msg.id));
          }
        } else {
          console.log(`Buscados ${newMessages.length} mensagens para o pacote não-ativo ${targetPackId}`);
        }
      } else {
        if (!isBackgroundRefresh && targetPackId === currentPackIdRef.current) {
          console.error("Formato de resposta inválido da API de mensagens:", response.data);
          setError("Formato de resposta inválido ao carregar mensagens");
        }
      }
    } catch (error: any) {
      if (!isBackgroundRefresh && targetPackId === currentPackIdRef.current) {
        console.error("Erro ao buscar mensagens:", error);
        setError("Erro ao carregar mensagens");
      } else {
        console.error("Erro no refresh em background:", error);
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
    
    const periodicRefreshIntervalId = setInterval(() => {
      if (packId && sellerId && !isComplaint && !backgroundRefreshingRef.current && currentPackIdRef.current) {
        console.log('Atualização periódica, buscando mensagens recentes');
        fetchMessages(currentPackIdRef.current, true);
      }
    }, 30000);
    
    return () => {
      clearInterval(periodicRefreshIntervalId);
    };
  }, [packId, sellerId, refreshTrigger, isComplaint]);

  const updatePackMessages = async (targetPackId: string) => {
    if (!sellerId || isComplaint) return;
    
    console.log(`Atualização endpoint, buscando mensagens para pack_id ${targetPackId}`);
    
    if (targetPackId === currentPackIdRef.current) {
      fetchMessages(targetPackId, false);
    } else {
      fetchMessages(targetPackId, true);
    }
  };

  return { messages, isLoading, error, updatePackMessages };
}
