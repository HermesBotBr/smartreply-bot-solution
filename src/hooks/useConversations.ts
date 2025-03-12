
import { useState, useEffect } from 'react';
import { parseMessages } from '@/utils/messageParser';
import { getNgrokUrl } from '@/config/api';

export function useConversations() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialAutoScrollDone, setInitialAutoScrollDone] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(getNgrokUrl('all_msg.txt'));
      const textData = await response.text();
      const convs = parseMessages(textData);
      setConversations(convs);
      
      if (selectedConv) {
        const updatedConv = convs.find(c => c.orderId === selectedConv.orderId);
        if (updatedConv) {
          setSelectedConv(updatedConv);
        }
      }
      
      setRefreshing(false);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, []);

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
