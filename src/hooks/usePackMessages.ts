
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';
import { io } from 'socket.io-client';

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

// Defina fetchMessages fora do useEffect para que possa ser chamado em diferentes contextos
const fetchMessages = async (isBackgroundRefresh = false) => {
  if (!packId || !sellerId) {
    return;
  }
  
  if (!isBackgroundRefresh) {
    setIsLoading(true);
  }
  
  if (isBackgroundRefresh) {
    backgroundRefreshingRef.current = true;
  }
  
  try {
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
      
      if (!isInitialLoadRef.current || isBackgroundRefresh) {
        const messagesToAdd = newMessages.filter(newMsg => 
          !existingMessageIdsRef.current.has(newMsg.id)
        );
        
        if (messagesToAdd.length > 0) {
          console.log(`Adding ${messagesToAdd.length} new messages from background refresh`);
          setMessages(prev => {
            const updatedMessages = [...prev, ...messagesToAdd].sort((a, b) => 
              new Date(a.message_date.created).getTime() - new Date(b.message_date.created).getTime()
            );
            messagesToAdd.forEach(msg => existingMessageIdsRef.current.add(msg.id));
            return updatedMessages;
          });
        } else {
          console.log('No new messages found during refresh');
        }
      } else {
        setMessages(newMessages);
        existingMessageIdsRef.current = new Set(newMessages.map(msg => msg.id));
        console.log(`Loaded ${newMessages.length} messages for pack ID: ${packId}`);
      }
    } else {
      if (!isBackgroundRefresh) {
        console.error("Invalid response format from messages API:", response.data);
        setError("Formato de resposta inválido ao carregar mensagens");
      }
    }
  } catch (error: any) {
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
    if (isBackgroundRefresh) {
      backgroundRefreshingRef.current = false;
    }
    isInitialLoadRef.current = false;
  }
};

useEffect(() => {
  if (packId !== currentPackIdRef.current) {
    setMessages([]);
    existingMessageIdsRef.current.clear();
    isInitialLoadRef.current = true;
    currentPackIdRef.current = packId;
  }
  
  // Initial fetch (with loading indicator)
  fetchMessages();
  
  const intervalId = setInterval(() => {
    if (!backgroundRefreshingRef.current && packId && sellerId) {
      fetchMessages(true);
    }
  }, 30000);
  
  return () => {
    clearInterval(intervalId);
  };
}, [packId, sellerId, refreshTrigger]);

// Efeito para conexão via socket e escuta do evento "forceRefresh"
useEffect(() => {
  const socket = io(NGROK_BASE_URL);
  
  socket.on('forceRefresh', () => {
    console.log('Received forceRefresh event, fetching messages');
    fetchMessages();
  });
  
  return () => {
    socket.disconnect();
  };
}, []);


  return { messages, isLoading, error };
}
