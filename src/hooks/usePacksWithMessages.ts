
import { useState, useEffect, useCallback } from 'react';
import { Pack } from '@/hooks/usePackData';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';

interface LatestMessageInfo {
  packId: string;
  text: string;
  date: string;
}

export function usePacksWithMessages(packs: Pack[], sellerId: string | null) {
  const [latestMessages, setLatestMessages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar mensagens para um pacote específico
  const fetchMessagesForPack = useCallback(async (packId: string, sellerId: string): Promise<string> => {
    try {
      console.log(`Fetching all messages for pack ${packId}`);
      
      // Get all messages at once with a higher limit
      const response = await axios.get(`${NGROK_BASE_URL}/conversas`, {
        params: {
          seller_id: sellerId,
          pack_id: packId,
          limit: 100,  // Get more messages in a single request
          offset: 0
        }
      });
      
      if (response.data && Array.isArray(response.data.messages)) {
        const allMessages = response.data.messages;
        
        // If we found any messages
        if (allMessages.length > 0) {
          // Sort all messages by date in descending order (newest first)
          const sortedMessages = [...allMessages].sort((a, b) => {
            const dateA = new Date(a.message_date.created).getTime();
            const dateB = new Date(b.message_date.created).getTime();
            return dateB - dateA; // Descending order (newest first)
          });
          
          // Get the newest message (first in sorted array)
          const latestMessage = sortedMessages[0];
          const messageText = latestMessage.text || "Sem mensagem";
          
          console.log(`Latest message for pack ${packId} (from ${allMessages.length} messages):`, 
            messageText.substring(0, 30) + (messageText.length > 30 ? '...' : ''));
          
          // Truncate if needed
          return messageText.length > 50 
            ? `${messageText.substring(0, 50)}...` 
            : messageText;
        }
      }
      
      return "Sem mensagem";
    } catch (error) {
      console.error(`Error fetching messages for pack ${packId}:`, error);
      return "Erro ao carregar mensagem";
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
    
    try {
      console.log("Fetching messages for", packs.length, "packs");
      
      // Process each pack individually
      const fetchPromises = packs.map(pack => fetchMessagesForPack(pack.pack_id, sellerId));
      const results = await Promise.allSettled(fetchPromises);
      
      // Process results
      results.forEach((result, index) => {
        const packId = packs[index].pack_id;
        
        if (result.status === 'fulfilled') {
          messagesMap[packId] = result.value;
        } else {
          console.error(`Error fetching message for pack ${packId}:`, 
            result.status === 'rejected' ? result.reason : 'No message found');
          messagesMap[packId] = "Erro ao carregar mensagem";
        }
      });
      
      setLatestMessages(messagesMap);
    } catch (error) {
      console.error("Error fetching messages for packs:", error);
      setError("Erro ao carregar mensagens");
      
      // Set fallback messages for all packs
      packs.forEach(pack => {
        messagesMap[pack.pack_id] = "Erro ao carregar mensagens";
      });
      
      setLatestMessages(messagesMap);
    } finally {
      setIsLoading(false);
    }
  }, [sellerId, packs, fetchMessagesForPack]);

  // Efeito para buscar mensagens quando os pacotes ou seller mudam
  useEffect(() => {
    fetchAllPackMessages();
  }, [fetchAllPackMessages]);

  return { latestMessages, isLoading, error };
}
