
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

// Interface for complaint-specific messages
interface ComplaintMessage {
  sender_role: string;
  receiver_role: string;
  message: string;
  translated_message: string | null;
  date_created: string;
  last_updated: string;
  message_date: string;
  date_read: string;
  attachments: any[];
  status: string;
  stage: string;
  message_moderation: {
    status: string;
    reason: string;
    source: string;
    date_moderated: string;
  };
  repeated: boolean;
  hash: string;
}

export function usePackMessages(
  packId: string | null, 
  sellerId: string | null,
  refreshTrigger: number = 0,
  preloadedMessages?: Message[],
  isComplaint: boolean = false,
  claimId?: number
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [complaintMessages, setComplaintMessages] = useState<ComplaintMessage[]>([]);
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
      // Fetch standard messages for all cases (regular packs and complaints)
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
      
      // If this is a complaint and we have a claim_id, fetch complaint-specific messages
      if (isComplaint && claimId && targetPackId === currentPackIdRef.current) {
        try {
          const complaintResponse = await axios.get(`${NGROK_BASE_URL}/conversas_rec`, {
            params: {
              seller_id: sellerId,
              claim_id: claimId
            }
          });
          
          if (Array.isArray(complaintResponse.data)) {
            setComplaintMessages(complaintResponse.data);
            console.log(`Carregadas ${complaintResponse.data.length} mensagens de reclamação para claim ID: ${claimId}`);
          } else {
            console.error("Formato de resposta inválido da API de mensagens de reclamação:", complaintResponse.data);
            if (!isBackgroundRefresh) {
              setError("Formato de resposta inválido ao carregar mensagens de reclamação");
            }
          }
        } catch (complaintError) {
          console.error("Erro ao buscar mensagens de reclamação:", complaintError);
          if (!isBackgroundRefresh) {
            setError("Erro ao carregar mensagens de reclamação");
          }
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
      setComplaintMessages([]);
      existingMessageIdsRef.current.clear();
      isInitialLoadRef.current = true;
      currentPackIdRef.current = packId;
    }
    
    if (packId && sellerId) {
      fetchMessages(packId);
    }
    
    const periodicRefreshIntervalId = setInterval(() => {
      if (packId && sellerId && !backgroundRefreshingRef.current && currentPackIdRef.current) {
        console.log('Atualização periódica, buscando mensagens recentes');
        fetchMessages(currentPackIdRef.current, true);
      }
    }, 30000);
    
    return () => {
      clearInterval(periodicRefreshIntervalId);
    };
  }, [packId, sellerId, refreshTrigger, isComplaint, claimId]);

  const updatePackMessages = async (targetPackId: string) => {
    if (!sellerId) return;
    
    console.log(`Atualização endpoint, buscando mensagens para pack_id ${targetPackId}`);
    
    if (targetPackId === currentPackIdRef.current) {
      fetchMessages(targetPackId, false);
    } else {
      fetchMessages(targetPackId, true);
    }
  };

  return { messages, complaintMessages, isLoading, error, updatePackMessages };
}
