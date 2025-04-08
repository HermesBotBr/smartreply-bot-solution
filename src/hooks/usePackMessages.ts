
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';
import { useComplaintsData } from './useComplaintsData';

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
  is_complaint_message?: boolean;
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
  const [isComplaintPack, setIsComplaintPack] = useState(false);
  
  // Get complaint data and message fetching function
  const { fetchComplaintMessages } = useComplaintsData(sellerId);

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
      // Check if this is a complaint pack
      const isComplaint = targetPackId.startsWith('claim-');
      setIsComplaintPack(isComplaint);
      
      let newMessages: Message[] = [];
      
      if (isComplaint) {
        // Extract claim_id from the pack ID
        const claimId = targetPackId.replace('claim-', '');
        if (!claimId) {
          throw new Error('Invalid claim ID');
        }
        
        // Fetch complaint messages
        try {
          // Find the complaint object with this claim_id
          const claimIdNum = parseInt(claimId);
          const complaintObj = {
            claim_id: claimIdNum,
            pack_id: null,
            order_id: 0,
            reason_id: '',
            motivo_reclamacao: '',
            afetou_reputacao: '',
            data_criada: ''
          };
          
          newMessages = await fetchComplaintMessages(complaintObj);
          console.log(`Carregadas ${newMessages.length} mensagens para a reclamação ${claimId}`);
        } catch (err) {
          console.error(`Erro ao buscar mensagens para a reclamação ${claimId}:`, err);
          setError(`Erro ao carregar mensagens da reclamação: ${err}`);
        }
      } else {
        // Regular pack messages fetch
        const response = await axios.get(`${NGROK_BASE_URL}/conversas`, {
          params: {
            seller_id: sellerId,
            pack_id: targetPackId,
            limit: 3000,
            offset: 0
          }
        });
        
        if (response.data && Array.isArray(response.data.messages)) {
          newMessages = response.data.messages;
          console.log(`Carregadas ${newMessages.length} mensagens para o pack ID: ${targetPackId}`);
        }
      }
      
      // Process the messages based on current state
      if (targetPackId === currentPackIdRef.current) {
        if (isInitialLoadRef.current) {
          setMessages(newMessages);
          existingMessageIdsRef.current = new Set(newMessages.map(msg => msg.id));
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
      // Only do background refresh for non-complaint packs
      if (packId && sellerId && !backgroundRefreshingRef.current && currentPackIdRef.current && !packId.startsWith('claim-')) {
        console.log('Atualização periódica, buscando mensagens recentes');
        fetchMessages(currentPackIdRef.current, true);
      }
    }, 30000);
    
    return () => {
      clearInterval(periodicRefreshIntervalId);
    };
  }, [packId, sellerId, refreshTrigger]);

  const updatePackMessages = async (targetPackId: string) => {
    if (!sellerId) return;
    
    console.log(`Atualização endpoint, buscando mensagens para pack_id ${targetPackId}`);
    
    if (targetPackId === currentPackIdRef.current) {
      fetchMessages(targetPackId, false);
    } else {
      fetchMessages(targetPackId, true);
    }
  };

  return { 
    messages, 
    isLoading, 
    error, 
    updatePackMessages, 
    isComplaintPack 
  };
}
