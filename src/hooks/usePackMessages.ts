
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
  // Add a ref to track existing message IDs
  const existingMessageIdsRef = useRef<Set<string>>(new Set());
  // Add a ref to track the current packId
  const currentPackIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Clear messages and reset state when packId changes
    if (packId !== currentPackIdRef.current) {
      setMessages([]);
      existingMessageIdsRef.current.clear();
      isInitialLoadRef.current = true;
      currentPackIdRef.current = packId;
    }
    
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
          const newMessages = response.data.messages;
          
          // If this is a background refresh or any subsequent load, filter out messages we already have
          if (!isInitialLoadRef.current || isBackgroundRefresh) {
            // Find messages that don't exist in our existingMessageIds Set
            const messagesToAdd = newMessages.filter(newMsg => 
              !existingMessageIdsRef.current.has(newMsg.id)
            );
            
            // Only update state if there are new messages
            if (messagesToAdd.length > 0) {
              console.log(`Adding ${messagesToAdd.length} new messages from background refresh`);
              
              // Update our messages state with the new messages
              setMessages(prev => {
                const updatedMessages = [...prev, ...messagesToAdd].sort((a, b) => 
                  new Date(a.message_date.created).getTime() - new Date(b.message_date.created).getTime()
                );
                
                // Update our Set of existing message IDs
                messagesToAdd.forEach(msg => existingMessageIdsRef.current.add(msg.id));
                
                return updatedMessages;
              });
            } else {
              console.log('No new messages found during refresh');
            }
          } else {
            // For initial load, replace all messages and update our tracking Set
            setMessages(newMessages);
            
            // Initialize our Set of existing message IDs
            existingMessageIdsRef.current = new Set(newMessages.map(msg => msg.id));
            
            console.log(`Loaded ${newMessages.length} messages for pack ID: ${packId}`);
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
