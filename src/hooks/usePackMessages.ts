
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getNgrokUrl } from "@/config/api";

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
  paging: {
    limit: number;
    offset: number;
    total: number;
  };
  conversation_status: {
    status: string;
    substatus: string | null;
  };
  messages: Message[];
}

export function usePackMessages(
  packId: string | null, 
  sellerId: string | null, 
  accessToken: string | null
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
      if (!packId || !sellerId || !accessToken) {
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Instead of calling the Mercado Libre API directly, use our proxy endpoint
        const response = await axios.get(`/api/proxy-getMessages`, {
          params: {
            packId,
            sellerId,
            accessToken
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
        const errorMessage = error.response?.status === 401 
          ? "Token de acesso inválido ou expirado"
          : "Erro ao carregar mensagens";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    // Refresh messages every 30 seconds if we have all required data
    let intervalId: number | null = null;
    if (packId && sellerId && accessToken) {
      intervalId = window.setInterval(fetchMessages, 30000);
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [packId, sellerId, accessToken]);

  return { messages, isLoading, error };
}
