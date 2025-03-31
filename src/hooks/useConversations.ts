
import { useState, useEffect, useRef } from 'react';
import { parseMessages } from '@/utils/messageParser';
import { getNgrokUrl } from '@/config/api';

export function useConversations() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialAutoScrollDone, setInitialAutoScrollDone] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const backgroundRefreshingRef = useRef(false);

  const loadData = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setRefreshing(true);
      }
      
      if (isBackgroundRefresh) {
        backgroundRefreshingRef.current = true;
      }
      
      console.log(isBackgroundRefresh ? "Background refreshing conversations..." : "Loading conversation data...");
      const response = await fetch(getNgrokUrl('all_msg.txt'));
      const textData = await response.text();
      const convs = parseMessages(textData);
      
      if (isBackgroundRefresh) {
        // For background refreshes, update state more carefully
        // Compare and only update what's needed
        setConversations(prevConvs => {
          // Check if there are any actual changes
          const hasChanges = JSON.stringify(prevConvs) !== JSON.stringify(convs);
          return hasChanges ? convs : prevConvs;
        });
        
        // Update the selectedConv if one is currently selected
        if (selectedConv) {
          const updatedConv = convs.find(c => c.orderId === selectedConv.orderId);
          if (updatedConv && JSON.stringify(updatedConv) !== JSON.stringify(selectedConv)) {
            setSelectedConv(updatedConv);
          }
        }
      } else {
        // For initial or manual refreshes, just replace everything
        setConversations(convs);
        
        // Update the selectedConv if one is currently selected
        if (selectedConv) {
          const updatedConv = convs.find(c => c.orderId === selectedConv.orderId);
          if (updatedConv) {
            setSelectedConv(updatedConv);
          }
        }
      }
      
      if (!isBackgroundRefresh) {
        setRefreshing(false);
      }
      
      if (isBackgroundRefresh) {
        backgroundRefreshingRef.current = false;
      }
      
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      if (!isBackgroundRefresh) {
        setRefreshing(false);
      }
      
      if (isBackgroundRefresh) {
        backgroundRefreshingRef.current = false;
      }
    }
  };

  // Initial load and regular interval update
  useEffect(() => {
    // Initial load (with loading indicator)
    loadData();
    
    // Set up interval for background refreshes
    const intervalId = setInterval(() => {
      // Only perform background refresh if we're not already refreshing
      if (!backgroundRefreshingRef.current) {
        loadData(true);
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Check for forced updates
  useEffect(() => {
    const checkForForcedUpdates = async () => {
      try {
        const response = await fetch('/api/update-all-conversations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // If there's a new update timestamp that we haven't processed yet
          if (data.timestamp && (!lastUpdate || data.timestamp > lastUpdate)) {
            console.log("Detected forced update, refreshing data...");
            await loadData();
            setLastUpdate(data.timestamp);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar atualizações forçadas:", error);
      }
    };

    // Check for forced updates every 5 seconds
    const forcedUpdateInterval = setInterval(checkForForcedUpdates, 5000);
    return () => clearInterval(forcedUpdateInterval);
  }, [lastUpdate]);

  async function forceUpdateSelectedConversation() {
    try {
      const response = await fetch('/api/usc', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        await loadData();
      } else {
        console.error('Erro ao forçar atualização:', data.error);
      }
    } catch (error) {
      console.error('Erro na requisição do endpoint:', error);
    }
  }

  async function forceUpdateAllConversations() {
    try {
      const response = await fetch('/api/update-all-conversations', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await loadData();
        return { success: true, message: data.message };
      } else {
        console.error('Erro ao forçar atualização de todas as conversas:', data.error);
        return { success: false, error: data.error || 'Erro desconhecido' };
      }
    } catch (error) {
      console.error('Erro na requisição do endpoint de atualização:', error);
      return { success: false, error: 'Falha na comunicação com o servidor' };
    }
  }

  return {
    conversations,
    selectedConv,
    setSelectedConv,
    refreshing,
    initialAutoScrollDone,
    setInitialAutoScrollDone,
    loadData,
    forceUpdateSelectedConversation,
    forceUpdateAllConversations
  };
}
