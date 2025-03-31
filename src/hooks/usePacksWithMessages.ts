
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchAllPackMessages = async () => {
      if (!sellerId || packs.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      const messagesMap: Record<string, string> = {};
      
      try {
        console.log("Fetching messages for", packs.length, "packs");
        
        // Process each pack individually instead of using a batch endpoint
        const fetchPromises = packs.map(pack => fetchSinglePackMessage(pack.pack_id, sellerId));
        const results = await Promise.allSettled(fetchPromises);
        
        // Process results
        results.forEach((result, index) => {
          const packId = packs[index].pack_id;
          
          if (result.status === 'fulfilled' && result.value) {
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
    };
    
    // Function to fetch message for a single pack
    const fetchSinglePackMessage = async (packId: string, sellerId: string): Promise<string | null> => {
      try {
        const response = await axios.get(`${NGROK_BASE_URL}/conversas`, {
          params: {
            seller_id: sellerId,
            pack_id: packId,
            limit: 10,  // Get the 10 most recent messages
            offset: 0
          }
        });
        
        if (response.data && 
            Array.isArray(response.data.messages) && 
            response.data.messages.length > 0) {
          // Get the newest message - sort by date in descending order
          const sortedMessages = [...response.data.messages].sort((a, b) => {
            // Compare created dates - we want the newest message (highest date value)
            const dateA = new Date(a.message_date.created).getTime();
            const dateB = new Date(b.message_date.created).getTime();
            return dateB - dateA; // Descending order (newest first)
          });
          
          // Get the newest message (first in sorted array)
          const latestMessage = sortedMessages[0];
          const messageText = latestMessage.text || "Sem mensagem";
          
          // Truncate if needed
          return messageText.length > 50 
            ? `${messageText.substring(0, 50)}...` 
            : messageText;
        }
        
        return "Sem mensagem";
      } catch (error) {
        console.error(`Error fetching message for pack ${packId}:`, error);
        return "Erro ao carregar mensagem";
      }
    };

    fetchAllPackMessages();
  }, [sellerId, packs]);

  return { latestMessages, isLoading, error };
}
