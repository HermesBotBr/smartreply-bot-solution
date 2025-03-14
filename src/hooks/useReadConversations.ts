import { useState, useEffect } from 'react';
import { useToast } from "./use-toast";
import { getNgrokUrl } from '@/config/api';

export function useReadConversations() {
  const [readConversations, setReadConversations] = useState<string[]>([]);
  const [serverSyncError, setServerSyncError] = useState(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState(0);
  const { toast } = useToast();

  const fetchReadConversations = async () => {
    try {
      console.log("Fetching read conversations from server");
      const response = await fetch(getNgrokUrl('read_conversations.txt'));
      if (!response.ok) {
        throw new Error(`Failed to fetch read conversations: ${response.status}`);
      }
      const text = await response.text();
      console.log("Read conversations response:", text);
      if (text && text.trim()) {
        const readConvs = text.split('\n')
          .map(line => line.trim())
          .filter(line => line && line !== "undefined" && line !== "null");
        console.log("Parsed read conversations:", readConvs);
        setReadConversations(readConvs);
        // Update localStorage as fallback
        localStorage.setItem('readConversations', JSON.stringify(readConvs));
        setServerSyncError(false);
      } else {
        console.log("No read conversations found on server");
        // Try to get from localStorage if server returns empty
        const storedReadConvs = localStorage.getItem('readConversations');
        if (storedReadConvs) {
          const parsedConvs = JSON.parse(storedReadConvs);
          console.log("Using localStorage read conversations:", parsedConvs);
          setReadConversations(parsedConvs);
        } else {
          setReadConversations([]);
        }
      }
    } catch (error) {
      console.error("Error fetching read conversations:", error);
      setServerSyncError(true);
      // Fallback to localStorage
      const storedReadConvs = localStorage.getItem('readConversations');
      if (storedReadConvs) {
        try {
          const parsedConvs = JSON.parse(storedReadConvs);
          console.log("Using localStorage fallback for read conversations:", parsedConvs);
          setReadConversations(parsedConvs);
        } catch (e) {
          console.error("Error parsing localStorage readConversations:", e);
          setReadConversations([]);
        }
      } else {
        setReadConversations([]);
      }
    }
  };

  const markAsRead = async (orderId: string | string[]) => {
    let orderIds: string[] = [];
    
    if (Array.isArray(orderId)) {
      orderIds = orderId.filter(id => id && !readConversations.some(rc => rc === id || rc.startsWith(`${id}:`)));
    } else if (orderId && !readConversations.some(rc => rc === orderId || rc.startsWith(`${orderId}:`))) {
      orderIds = [orderId];
    }
    
    if (orderIds.length === 0) return;
    
    console.log(`Marking conversation(s) as read: ${orderIds.join(', ')}`);
    
    // Get the currently selected conversation to track its latest message ID
    const updatedReadConvs = [...readConversations];
    
    // For each order ID, add both the orderID and orderID:latestMessageID format
    orderIds.forEach(id => {
      if (!updatedReadConvs.includes(id)) {
        updatedReadConvs.push(id);
      }
      
      // If we have access to the selected conversation details, track the latest message ID
      const selectedConvElement = document.querySelector('[data-selected-conv]');
      if (selectedConvElement) {
        const selectedConv = JSON.parse(selectedConvElement.getAttribute('data-selected-conv') || '{}');
        if (selectedConv?.orderId === id && selectedConv?.messages?.length > 0) {
          // Find the latest message
          const latestMessage = selectedConv.messages.reduce((prev: any, curr: any) => {
            return new Date(curr.date) > new Date(prev.date) ? curr : prev;
          }, selectedConv.messages[0]);
          
          // Add a read state with the message ID
          const messageReadState = `${id}:${latestMessage.id}`;
          if (!updatedReadConvs.includes(messageReadState)) {
            updatedReadConvs.push(messageReadState);
          }
        }
      }
    });
    
    setReadConversations(updatedReadConvs);
    
    // Save to localStorage
    localStorage.setItem('readConversations', JSON.stringify(updatedReadConvs));
    
    const now = Date.now();
    if (serverSyncError && now - lastSyncAttempt < 60000) { // 1 minute cooldown
      console.log("Skipping server sync due to recent errors");
      return;
    }
    
    setLastSyncAttempt(now);
    
    try {
      // Modified to send all order IDs in a single request
      const response = await fetch(getNgrokUrl('mark_read.php'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark conversations as read: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Server response for mark as read:", result);
      setServerSyncError(false);
    } catch (error) {
      console.error("Error marking conversations as read:", error);
      setServerSyncError(true);
      
      if (!serverSyncError) { // Only show error once
        toast({
          title: "Erro ao marcar conversas como lidas",
          description: "Os dados foram salvos localmente, mas não puderam ser sincronizados com o servidor",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    fetchReadConversations();
    
    const readInterval = setInterval(fetchReadConversations, 30000);
    return () => clearInterval(readInterval);
  }, []);

  return { 
    readConversations, 
    markAsRead 
  };
}
