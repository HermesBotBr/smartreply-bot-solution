
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

interface MessagesResponse {
  total: number;
  limit: number;
  offset: number;
  messages: Message[];
}

export function usePackMessages(
  packId: string | null, 
  sellerId: string | null,
  refreshTrigger: number = 0
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const backgroundRefreshingRef = useRef(false);

  useEffect(() => {
    const fetchMessages = async (isBackgroundRefresh = false) => {
      // Skip if we don't have all required data
      if (!packId || !sellerId) {
        return;
      }
      
      // Only show loading for initial loads or manual refreshes (not background refreshes)
      if (!isBackgroundRefresh) {
        setIsLoading(true);
      }
      
      // For background refreshes, mark that we're refreshing in the background
      if (isBackgroundRefresh) {
        backgroundRefreshingRef.current = true;
      }
      
      try {
        // Call the custom endpoint to fetch messages
        const response = await axios.get(`${NGROK_BASE_URL}/conversas`, {
          params: {
            seller_id: sellerId,
            pack_id: packId,
            limit: 100,
            offset: 0
          }
        });
        
        if (response.data && Array.isArray(response.data.messages)) {
          // If this is a background refresh, compare new messages with existing
          if (isBackgroundRefresh) {
            const currentMessages = [...messages];
            const newMessages = response.data.messages;
            
            // Find messages that don't exist in the current messages array
            const messagesToAdd = newMessages.filter(newMsg => 
              !currentMessages.some(currentMsg => currentMsg.id === newMsg.id)
            );
            
            // Only update state if there are new messages
            if (messagesToAdd.length > 0) {
              console.log(`Adding ${messagesToAdd.length} new messages from background refresh`);
              setMessages(prev => [...prev, ...messagesToAdd].sort((a, b) => 
                new Date(a.message_date.created).getTime() - new Date(b.message_date.created).getTime()
              ));
            }
          } else {
            // For initial loads or manual refreshes, replace all messages
            setMessages(response.data.messages);
            console.log(`Loaded ${response.data.messages.length} messages for pack ID: ${packId}`);
          }
        } else {
          // Only show error for non-background refreshes
          if (!isBackgroundRefresh) {
            console.error("Invalid response format from messages API:", response.data);
            setError("Formato de resposta inválido ao carregar mensagens");
          }
        }
      } catch (error: any) {
        // Only show error for non-background refreshes
        if (!isBackgroundRefresh) {
          console.error("Error fetching messages:", error);
          setError("Erro ao carregar mensagens");
        } else {
          console.error("Background refresh error:", error);
        }
      } finally {
        if (!isBackgroundRefresh) {
          setIsLoading(false);
        }
        
        // Reset the background refreshing flag
        if (isBackgroundRefresh) {
          backgroundRefreshingRef.current = false;
        }
        
        // After first successful load, mark initial load as complete
        isInitialLoadRef.current = false;
      }
    };
    
    // Initial fetch (with loading indicator)
    fetchMessages();
    
    // Set up background fetch interval
    const intervalId = setInterval(() => {
      // Only do background refresh if we're not already refreshing in background
      // and we have the required data
      if (!backgroundRefreshingRef.current && packId && sellerId) {
        fetchMessages(true); // true indicates this is a background refresh
      }
    }, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [packId, sellerId, refreshTrigger]);

  return { messages, isLoading, error };
}
