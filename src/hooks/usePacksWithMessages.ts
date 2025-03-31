
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
        console.log("Fetching latest messages for", packs.length, "packs");
        
        // Create a batch request to get latest message for each pack
        const packIds = packs.map(pack => pack.pack_id);
        const response = await axios.get(`${NGROK_BASE_URL}/latest-messages`, {
          params: {
            seller_id: sellerId,
            pack_ids: packIds.join(',')
          }
        });

        if (response.data && Array.isArray(response.data.messages)) {
          const messagesInfo: LatestMessageInfo[] = response.data.messages;
          console.log("Received", messagesInfo.length, "latest messages");
          
          // Add the messages to our map
          messagesInfo.forEach(info => {
            const messageText = info.text || "Sem mensagem";
            // Truncate if needed
            messagesMap[info.packId] = messageText.length > 50 
              ? `${messageText.substring(0, 50)}...` 
              : messageText;
          });
          
          // For packs without messages in the response, set default message
          packs.forEach(pack => {
            if (!messagesMap[pack.pack_id]) {
              messagesMap[pack.pack_id] = "Carregando mensagens...";
              
              // Try to fetch individual message if not in batch response
              fetchSinglePackMessage(pack.pack_id, sellerId).then(message => {
                if (message) {
                  setLatestMessages(prev => ({
                    ...prev,
                    [pack.pack_id]: message
                  }));
                }
              });
            }
          });
        } else {
          console.error("Invalid response format for latest messages:", response.data);
          throw new Error("Invalid response format");
        }

        setLatestMessages(messagesMap);
      } catch (error) {
        console.error("Error fetching latest messages for packs:", error);
        setError("Erro ao carregar mensagens");
        
        // Set fallback messages for all packs
        packs.forEach(pack => {
          messagesMap[pack.pack_id] = "Carregando mensagens...";
          
          // Try individual fetch as fallback
          fetchSinglePackMessage(pack.pack_id, sellerId).then(message => {
            if (message) {
              setLatestMessages(prev => ({
                ...prev,
                [pack.pack_id]: message
              }));
            }
          });
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
            limit: 1,  // We only need the most recent message
            offset: 0
          }
        });
        
        if (response.data && 
            Array.isArray(response.data.messages) && 
            response.data.messages.length > 0) {
          // Sort messages by creation date in descending order (newest first)
          const sortedMessages = [...response.data.messages].sort((a, b) => 
            new Date(b.message_date.created).getTime() - new Date(a.message_date.created).getTime()
          );
          
          // Get the newest message
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
