
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
        const fetchPromises = packs.map(pack => fetchLatestMessageWithPagination(pack.pack_id, sellerId));
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
    
    // Enhanced function to fetch message with pagination to ensure getting the truly latest message
    const fetchLatestMessageWithPagination = async (packId: string, sellerId: string): Promise<string | null> => {
      let offset = 0;
      const limit = 10;
      let allMessages: any[] = [];
      let hasMoreMessages = true;
      
      try {
        // Fetch messages with pagination until we find no more messages or reach a reasonable limit
        while (hasMoreMessages && offset < 100) { // Set a reasonable upper limit to prevent infinite loops
          console.log(`Fetching messages for pack ${packId}, offset: ${offset}, limit: ${limit}`);
          
          const response = await axios.get(`${NGROK_BASE_URL}/conversas`, {
            params: {
              seller_id: sellerId,
              pack_id: packId,
              limit: limit,
              offset: offset
            }
          });
          
          if (response.data && Array.isArray(response.data.messages)) {
            const fetchedMessages = response.data.messages;
            
            // If we got less messages than the limit, there are no more messages to fetch
            if (fetchedMessages.length < limit) {
              hasMoreMessages = false;
            }
            
            // Add fetched messages to our collection
            allMessages = [...allMessages, ...fetchedMessages];
            
            // If this is the first batch and it's empty, no need to continue
            if (offset === 0 && fetchedMessages.length === 0) {
              break;
            }
            
            // Increase offset for next page
            offset += limit;
          } else {
            // If the response doesn't contain messages array, stop pagination
            hasMoreMessages = false;
          }
        }
        
        // If we found any messages
        if (allMessages.length > 0) {
          // Sort all collected messages by date in descending order (newest first)
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
        
        return "Sem mensagem";
      } catch (error) {
        console.error(`Error fetching messages for pack ${packId}:`, error);
        return "Erro ao carregar mensagem";
      }
    };

    fetchAllPackMessages();
  }, [sellerId, packs]);

  return { latestMessages, isLoading, error };
}
