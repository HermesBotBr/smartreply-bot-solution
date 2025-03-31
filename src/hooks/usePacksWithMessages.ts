
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchAllPackMessages = async () => {
      if (!sellerId || packs.length === 0) return;

      setIsLoading(true);
      const messagesMap: Record<string, string> = {};
      
      try {
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
          
          // Add the messages to our map
          messagesInfo.forEach(info => {
            const messageText = info.text || "Sem mensagem";
            // Truncate if needed
            messagesMap[info.packId] = messageText.length > 50 
              ? `${messageText.substring(0, 50)}...` 
              : messageText;
          });
        }
      } catch (error) {
        console.error("Error fetching latest messages for packs:", error);
        // Provide fallback for all packs
        packs.forEach(pack => {
          messagesMap[pack.pack_id] = "Sem mensagem";
        });
      } finally {
        setIsLoading(false);
        setLatestMessages(messagesMap);
      }
    };

    fetchAllPackMessages();
  }, [sellerId, packs]);

  return { latestMessages, isLoading };
}
