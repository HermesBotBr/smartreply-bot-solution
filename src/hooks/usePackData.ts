
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';

export interface Pack {
  pack_id: string;
  data_criacao: string;
  status: string;
}

export function usePackData(sellerId: string | null) {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPacks = useCallback(async () => {
    if (!sellerId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${NGROK_BASE_URL}/packs`, {
        params: { seller_id: sellerId }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setPacks(response.data);
      } else {
        setError('Formato de resposta inválido ao carregar pacotes');
      }
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error);
      setError('Falha ao carregar pacotes do vendedor');
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  // Função para atualizar a lista de pacotes (utilizada após uma notificação)
  const refreshPacks = useCallback(() => {
    console.log("🔄 Atualizando lista de pacotes");
    fetchPacks();
  }, [fetchPacks]);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  return { packs, isLoading, error, refreshPacks };
}
