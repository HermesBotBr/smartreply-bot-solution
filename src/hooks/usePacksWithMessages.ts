import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';
import { AllPacksRow } from './useAllPacksData';

interface Message {
  id: string;
  from: { user_id: number };
  to: { user_id: number };
  text: string;
  message_date: {
    received: string;
    available: string;
    created: string;
    read: string;
  };
  message_attachments: any[] | null;
}

interface LatestMessagesMeta {
  [packId: string]: {
    text: string;
    createdAt: string; // ISO string
  };
}

export function usePacksWithMessages(packs: AllPacksRow[], sellerId: string | null) {
  const [latestMessagesMeta, setLatestMessagesMeta] = useState<LatestMessagesMeta>({});
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessagesForPack = useCallback(async (packId: string, sellerId: string): Promise<{
    latestText: string;
    latestCreatedAt: string;
    messages: Message[];
  }> => {
    try {
      const response = await axios.get(`${NGROK_BASE_URL}/conversas`, {
        params: {
          seller_id: sellerId,
          pack_id: packId,
          limit: 3000,
          offset: 0
        }
      });

      const allMessages = response.data.messages || [];

      if (allMessages.length > 0) {
        const sorted = [...allMessages].sort((a, b) =>
          new Date(b.message_date.created).getTime() - new Date(a.message_date.created).getTime()
        );

        const latest = sorted[0];
        const truncatedText = latest.text.length > 50
          ? latest.text.slice(0, 50) + '...'
          : latest.text;

        return {
          latestText: truncatedText || "Sem mensagem",
          latestCreatedAt: latest.message_date.created || '',
          messages: allMessages
        };
      }

      return {
        latestText: "Sem mensagem",
        latestCreatedAt: '',
        messages: []
      };
    } catch (err) {
      console.error(`Erro ao buscar mensagens do pack ${packId}`, err);
      return {
        latestText: "Erro ao carregar mensagem",
        latestCreatedAt: '',
        messages: []
      };
    }
  }, []);

  const fetchAllPackMessages = useCallback(async () => {
    if (!sellerId || packs.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const textMap: LatestMessagesMeta = {};
    const allMap: Record<string, Message[]> = {};

    try {
      const fetches = await Promise.allSettled(
        packs.map(pack => fetchMessagesForPack(pack.pack_id, sellerId))
      );

      fetches.forEach((res, index) => {
        const packId = packs[index].pack_id;

        if (res.status === 'fulfilled') {
          textMap[packId] = {
            text: res.value.latestText,
            createdAt: res.value.latestCreatedAt
          };
          allMap[packId] = res.value.messages;
        } else {
          textMap[packId] = {
            text: "Erro ao carregar mensagem",
            createdAt: ''
          };
          allMap[packId] = [];
        }
      });

      setLatestMessagesMeta(textMap);
      setAllMessages(allMap);
    } catch (err) {
      console.error("Erro geral ao buscar mensagens:", err);
      setError("Erro ao carregar mensagens");
    } finally {
      setIsLoading(false);
    }
  }, [sellerId, packs, fetchMessagesForPack]);

  useEffect(() => {
    fetchAllPackMessages();
  }, [fetchAllPackMessages]);

  return { latestMessagesMeta, allMessages, isLoading, error };
}
