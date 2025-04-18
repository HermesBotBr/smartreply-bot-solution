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
  const existingConvIdsRef = useRef<Set<string>>(new Set());

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
      const newConvs = parseMessages(textData);
      
      if (isBackgroundRefresh) {
        setConversations(prevConvs => {
          if (existingConvIdsRef.current.size === 0) {
            prevConvs.forEach(conv => existingConvIdsRef.current.add(conv.orderId));
          }
          
          const convsToAdd = newConvs.filter(newConv => 
            !existingConvIdsRef.current.has(newConv.orderId)
          );
          
          if (convsToAdd.length > 0) {
            console.log(`Adding ${convsToAdd.length} new conversations from background refresh`);
            convsToAdd.forEach(conv => existingConvIdsRef.current.add(conv.orderId));
            
            return [...prevConvs, ...convsToAdd];
          }
          
          let hasUpdates = false;
          const updatedConvs = prevConvs.map(prevConv => {
            const updatedConv = newConvs.find(newConv => newConv.orderId === prevConv.orderId);
            if (updatedConv && JSON.stringify(updatedConv) !== JSON.stringify(prevConv)) {
              hasUpdates = true;
              return updatedConv;
            }
            return prevConv;
          });
          
          return hasUpdates ? updatedConvs : prevConvs;
        });
        
        if (selectedConv) {
          const updatedConv = newConvs.find(c => c.orderId === selectedConv.orderId);
          if (updatedConv && JSON.stringify(updatedConv) !== JSON.stringify(selectedConv)) {
            setSelectedConv(updatedConv);
          }
        }
      } else {
        setConversations(newConvs);
        
        existingConvIdsRef.current = new Set(newConvs.map(conv => conv.orderId));
        
        if (selectedConv) {
          const updatedConv = newConvs.find(c => c.orderId === selectedConv.orderId);
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

  useEffect(() => {
    loadData();
    
    const intervalId = setInterval(() => {
      if (!backgroundRefreshingRef.current) {
        loadData(true);
      }
    }, 4000);
    
    return () => clearInterval(intervalId);
  }, []);

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
