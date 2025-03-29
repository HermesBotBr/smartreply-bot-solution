
import { useState, useEffect } from 'react';
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
  sellerId: string | null
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      // Reset states when inputs change
      setMessages([]);
      setError(null);
      
      // Skip if we don't have all required data
      if (!packId || !sellerId) {
        return;
      }
      
      setIsLoading(true);
      
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
          setMessages(response.data.messages);
          console.log(`Loaded ${response.data.messages.length} messages for pack ID: ${packId}`);
        } else {
          console.error("Invalid response format from messages API:", response.data);
          setError("Formato de resposta inválido ao carregar mensagens");
        }
      } catch (error: any) {
        console.error("Error fetching messages:", error);
        setError("Erro ao carregar mensagens");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    // Refresh messages every 30 seconds if we have all required data
    let intervalId: number | null = null;
    if (packId && sellerId) {
      intervalId = window.setInterval(fetchMessages, 30000);
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [packId, sellerId]);

  return { messages, isLoading, error };
}
