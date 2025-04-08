
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';
import { useComplaintsFilter } from './useComplaintsFilter';

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
  preloadedMessages?: Message[]
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const backgroundRefreshingRef = useRef(false);
  const existingMessageIdsRef = useRef<Set<string>>(new Set());
  const currentPackIdRef = useRef<string | null>(null);
  
  // Usar o hook de reclamações
  const { 
    getComplaintByPackId, 
    loadComplaintMessages, 
    claimMessages 
  } = useComplaintsFilter(sellerId);

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
      // Verificar se este pacote está associado a uma reclamação
      const complaint = getComplaintByPackId(targetPackId);
      let messagesData: Message[] = [];
      
      // Se for uma reclamação e tiver o claim_id
      if (complaint && complaint.claim_id) {
        // Buscar o buyer_id da primeira mensagem (ou usar um valor padrão se não existir)
        const apiResponse = await axios.get(`${NGROK_BASE_URL}/conversas`, {
          params: {
            seller_id: sellerId,
            pack_id: targetPackId,
            limit: 1,
            offset: 0
          }
        });
        
        let buyerId = 0;
        if (apiResponse.data && 
            apiResponse.data.messages && 
            apiResponse.data.messages.length > 0 && 
            apiResponse.data.messages[0].to && 
            apiResponse.data.messages[0].to.user_id) {
          buyerId = apiResponse.data.messages[0].to.user_id;
        } else if (apiResponse.data && 
                   apiResponse.data.messages && 
                   apiResponse.data.messages.length > 0 && 
                   apiResponse.data.messages[0].from && 
                   apiResponse.data.messages[0].from.user_id !== parseInt(sellerId, 10)) {
          buyerId = apiResponse.data.messages[0].from.user_id;
        }
        
        // Carregar mensagens de reclamação
        await loadComplaintMessages(complaint, buyerId);
        
        // Obtendo as mensagens de reclamação do estado
        const claimId = complaint.claim_id.toString();
        if (claimMessages[claimId] && claimMessages[claimId].length > 0) {
          messagesData = claimMessages[claimId];
        }
      }
      
      // Se não temos mensagens de reclamação ou se este não é um pacote de reclamação,
      // buscar mensagens normais
      if (messagesData.length === 0) {
        const response = await axios.get(`${NGROK_BASE_URL}/conversas`, {
          params: {
            seller_id: sellerId,
            pack_id: targetPackId,
            limit: 3000,
            offset: 0
          }
        });
        
        if (response.data && Array.isArray(response.data.messages)) {
          messagesData = response.data.messages;
        }
      }
      
      if (targetPackId === currentPackIdRef.current) {
        if (isInitialLoadRef.current) {
          setMessages(messagesData);
          existingMessageIdsRef.current = new Set(messagesData.map(msg => msg.id));
          console.log(`Carregadas ${messagesData.length} mensagens para o pack ID: ${targetPackId}`);
        } else if (isBackgroundRefresh) {
          const messagesToAdd = messagesData.filter(newMsg => 
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
          console.log(`Recarregando todas as ${messagesData.length} mensagens para o pack ${targetPackId} devido a uma atualização forçada`);
          setMessages(messagesData);
          existingMessageIdsRef.current = new Set(messagesData.map(msg => msg.id));
        }
      } else {
        console.log(`Buscados ${messagesData.length} mensagens para o pacote não-ativo ${targetPackId}`);
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
      if (packId && sellerId && !backgroundRefreshingRef.current && currentPackIdRef.current) {
        console.log('Atualização periódica, buscando mensagens recentes');
        fetchMessages(currentPackIdRef.current, true);
      }
    }, 30000);
    
    return () => {
      clearInterval(periodicRefreshIntervalId);
    };
  }, [packId, sellerId, refreshTrigger, claimMessages]);

  const updatePackMessages = async (targetPackId: string) => {
    if (!sellerId) return;
    
    console.log(`Atualização endpoint, buscando mensagens para pack_id ${targetPackId}`);
    
    if (targetPackId === currentPackIdRef.current) {
      fetchMessages(targetPackId, false);
    } else {
      fetchMessages(targetPackId, true);
    }
  };

  return { messages, isLoading, error, updatePackMessages };
}
