
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

// Interface para mensagens de reclamação
interface ComplaintMessage {
  sender_role: string;
  receiver_role: string;
  message: string;
  translated_message: string | null;
  date_created: string;
  last_updated: string;
  message_date: string;
  date_read: string | null;
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
  claimId: number | null = null,
  preloadedMessages?: Message[]
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const backgroundRefreshingRef = useRef(false);
  const existingMessageIdsRef = useRef<Set<string>>(new Set());
  const currentPackIdRef = useRef<string | null>(null);
  const currentClaimIdRef = useRef<number | null>(null);

  // Função para transformar mensagens de reclamação no formato padrão
  const transformComplaintMessages = (complaintMessages: ComplaintMessage[]): Message[] => {
    return complaintMessages.map((msg, index) => {
      // Determinar o ID do remetente e destinatário com base nos papéis
      const fromUserId = msg.sender_role === 'respondent' ? 
        (sellerId ? parseInt(sellerId) : 0) : // se for respondent (vendedor)
        999999999; // se for complainant (comprador) - ID fictício
      
      const toUserId = msg.sender_role === 'respondent' ?
        999999999 : // se for respondent (vendedor) enviando para o comprador
        (sellerId ? parseInt(sellerId) : 0); // se for complainant (comprador) enviando para o vendedor
        
      // Criar mensagem no formato padrão
      return {
        id: msg.hash || `complaint-${index}`,
        from: { user_id: fromUserId },
        to: { user_id: toUserId },
        text: msg.message,
        message_date: {
          received: msg.date_created,
          available: msg.date_created,
          notified: msg.date_created,
          created: msg.message_date || msg.date_created,
          read: msg.date_read || null
        },
        message_attachments: msg.attachments?.length ? 
          msg.attachments.map(att => ({
            filename: att.filename || '',
            original_filename: att.original_filename || '',
            status: 'active'
          })) : 
          null
      };
    });
  };

  const fetchComplaintMessages = async (targetClaimId: number) => {
    if (!sellerId) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Buscando mensagens da reclamação ${targetClaimId}`);
      
      const response = await axios.get(`${NGROK_BASE_URL}/conversas_rec`, {
        params: {
          seller_id: sellerId,
          claim_id: targetClaimId
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Transformar mensagens de reclamação para o formato padrão
        const formattedMessages = transformComplaintMessages(response.data);
        
        // Ordenar mensagens por data (mais antigas primeiro)
        const sortedMessages = formattedMessages.sort((a, b) => 
          new Date(a.message_date.created).getTime() - new Date(b.message_date.created).getTime()
        );
        
        console.log(`Carregadas ${sortedMessages.length} mensagens para a reclamação ID: ${targetClaimId}`);
        setMessages(sortedMessages);
        existingMessageIdsRef.current = new Set(sortedMessages.map(msg => msg.id));
        isInitialLoadRef.current = false;
      } else {
        console.error("Formato de resposta inválido da API de reclamações:", response.data);
        setError("Formato de resposta inválido ao carregar mensagens da reclamação");
      }
    } catch (error: any) {
      console.error("Erro ao buscar mensagens da reclamação:", error);
      setError("Erro ao carregar mensagens da reclamação");
    } finally {
      setIsLoading(false);
    }
  };

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
    // Reset when packId or claimId changes
    if (packId !== currentPackIdRef.current || claimId !== currentClaimIdRef.current) {
      setMessages([]);
      existingMessageIdsRef.current.clear();
      isInitialLoadRef.current = true;
      currentPackIdRef.current = packId;
      currentClaimIdRef.current = claimId;
    }
    
    // Fetch appropriate messages based on whether we have a claim_id
    if (sellerId) {
      if (claimId) {
        // Busca mensagens de reclamação
        fetchComplaintMessages(claimId);
      } else if (packId) {
        // Busca mensagens normais
        fetchMessages(packId);
      }
    }
    
    // Set up periodic refresh for normal messages (not complaint messages)
    const periodicRefreshIntervalId = setInterval(() => {
      if (packId && sellerId && !backgroundRefreshingRef.current && currentPackIdRef.current && !claimId) {
        console.log('Atualização periódica, buscando mensagens recentes');
        fetchMessages(currentPackIdRef.current, true);
      }
    }, 30000);
    
    return () => {
      clearInterval(periodicRefreshIntervalId);
    };
  }, [packId, sellerId, refreshTrigger, claimId]);

  const updatePackMessages = async (targetPackId: string) => {
    if (!sellerId) return;
    
    // Se for um ID de reclamação, não fazemos nada, pois reclamações não mudam rapidamente
    if (claimId) {
      console.log(`Ignorando atualização para reclamação ${claimId}`);
      return;
    }
    
    console.log(`Atualização endpoint, buscando mensagens para pack_id ${targetPackId}`);
    
    if (targetPackId === currentPackIdRef.current) {
      fetchMessages(targetPackId, false);
    } else {
      fetchMessages(targetPackId, true);
    }
  };

  return { messages, isLoading, error, updatePackMessages };
}
