
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';
import { AllPacksRow } from './useAllPacksData';

interface LatestMessageInfo {
  packId: string;
  text: string;
  date: string;
}

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

export function usePacksWithMessages(packs: AllPacksRow[], sellerId: string | null) {
  const [latestMessages, setLatestMessages] = useState<Record<string, string>>({});
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar TODAS as mensagens para um pacote específico
  const fetchMessagesForPack = useCallback(async (packId: string, sellerId: string): Promise<{ latestText: string, messages: Message[] }> => {
    try {
      console.log(`Buscando todas as mensagens para o pacote ${packId}`);
      
      // Buscamos todas as mensagens de uma vez com um limite maior
      const response = await axios.get(`${NGROK_BASE_URL}/conversas`, {
        params: {
          seller_id: sellerId,
          pack_id: packId,
          limit: 3000,  // Limite maior para pegar todas as mensagens
          offset: 0
        }
      });
      
      if (response.data && Array.isArray(response.data.messages)) {
        const allMessages = response.data.messages;
        
        // Se encontramos mensagens
        if (allMessages.length > 0) {
          // Ordena as mensagens por data em ordem decrescente (mais recente primeiro)
          const sortedMessages = [...allMessages].sort((a, b) => {
            const dateA = new Date(a.message_date.created).getTime();
            const dateB = new Date(b.message_date.created).getTime();
            return dateB - dateA; // Ordem decrescente (mais recente primeiro)
          });
          
          // Pega a mensagem mais recente (primeira no array ordenado)
          const latestMessage = sortedMessages[0];
          const messageText = latestMessage.text || "Sem mensagem";
          
          console.log(`Última mensagem para o pacote ${packId} (de ${allMessages.length} mensagens):`, 
            messageText.substring(0, 30) + (messageText.length > 30 ? '...' : ''));
          
          // Trunca se necessário para exibição na lista
          const truncatedText = messageText.length > 50 
            ? `${messageText.substring(0, 50)}...` 
            : messageText;
            
          return {
            latestText: truncatedText,
            messages: allMessages
          };
        }
      }
      
      return {
        latestText: "Sem mensagem",
        messages: []
      };
    } catch (error) {
      console.error(`Erro ao buscar mensagens para o pacote ${packId}:`, error);
      return {
        latestText: "Erro ao carregar mensagem",
        messages: []
      };
    }
  }, []);

  // Função para buscar todas as mensagens de todos os pacotes
  const fetchAllPackMessages = useCallback(async () => {
    if (!sellerId || packs.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const messagesMap: Record<string, string> = {};
    const allMessagesMap: Record<string, Message[]> = {};
    
    try {
      console.log("Buscando mensagens para", packs.length, "pacotes");
      
      // Processa cada pacote individualmente
      const fetchPromises = packs.map(pack => fetchMessagesForPack(pack.pack_id, sellerId));
      const results = await Promise.allSettled(fetchPromises);
      
      // Processa os resultados
      results.forEach((result, index) => {
        const packId = packs[index].pack_id;
        
        if (result.status === 'fulfilled') {
          messagesMap[packId] = result.value.latestText;
          allMessagesMap[packId] = result.value.messages;
        } else {
          console.error(`Erro ao buscar mensagem para o pacote ${packId}:`, 
            result.status === 'rejected' ? result.reason : 'Nenhuma mensagem encontrada');
          messagesMap[packId] = "Erro ao carregar mensagem";
          allMessagesMap[packId] = [];
        }
      });
      
      setLatestMessages(messagesMap);
      setAllMessages(allMessagesMap);
    } catch (error) {
      console.error("Erro ao buscar mensagens para os pacotes:", error);
      setError("Erro ao carregar mensagens");
      
      // Define mensagens de fallback para todos os pacotes
      packs.forEach(pack => {
        messagesMap[pack.pack_id] = "Erro ao carregar mensagens";
        allMessagesMap[pack.pack_id] = [];
      });
      
      setLatestMessages(messagesMap);
      setAllMessages(allMessagesMap);
    } finally {
      setIsLoading(false);
    }
  }, [sellerId, packs, fetchMessagesForPack]);

  // Efeito para buscar mensagens quando os pacotes ou seller mudam
  useEffect(() => {
    fetchAllPackMessages();
  }, [fetchAllPackMessages]);

  return { latestMessages, allMessages, isLoading, error };
}
