
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
    let messageIds: string[] = [];
    
    // Handle both array and single order id inputs
    if (Array.isArray(orderId)) {
      // For arrays, filter out already read conversations
      orderId.forEach(id => {
        if (!id) return;
        
        // Handle the special format orderId:messageId
        if (id.includes(':')) {
          const [oid, mid] = id.split(':');
          
          // Check if this specific message is already marked as read
          if (!readConversations.includes(`${oid}:${mid}`)) {
            messageIds.push(`${oid}:${mid}`);
            // We only add the order ID to be sent to the server if we're actually
            // marking something as new
            if (!orderIds.includes(oid)) {
              orderIds.push(oid);
            }
          }
        } else if (!readConversations.includes(id)) {
          orderIds.push(id);
        }
      });
    } else if (orderId) {
      // Handle the special format orderId:messageId
      if (orderId.includes(':')) {
        const [oid, mid] = orderId.split(':');
        
        // Check if this specific message is already marked as read
        if (!readConversations.includes(orderId)) {
          messageIds.push(orderId);
          orderIds = [oid]; // Add the order ID part to orderIds
        }
      } else if (!readConversations.includes(orderId)) {
        orderIds = [orderId];
      }
    }
    
    // If nothing new to mark as read, return early
    if (orderIds.length === 0 && messageIds.length === 0) return;
    
    console.log(`Marking conversation(s) as read: ${orderIds.join(', ')}`);
    if (messageIds.length > 0) {
      console.log(`Marking specific messages as read: ${messageIds.join(', ')}`);
    }
    
    // Update the read conversations state with both order IDs and message IDs
    const updatedReadConvs = [...readConversations];
    
    // Add order IDs to the read state
    orderIds.forEach(id => {
      if (!updatedReadConvs.includes(id)) {
        updatedReadConvs.push(id);
      }
    });
    
    // Add message IDs to the read state
    messageIds.forEach(id => {
      if (!updatedReadConvs.includes(id)) {
        updatedReadConvs.push(id);
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
      // Send only the order IDs to the server (not the message IDs)
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
