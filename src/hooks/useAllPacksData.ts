
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';

export interface AllPacksRow {
  pack_id: string;
  gpt: string | null;
  seller_id: string | null;
}

export function useAllPacksData(sellerId: string | null) {
  const [packs, setPacks] = useState<AllPacksRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPacks = useCallback(async () => {
    if (!sellerId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Busca todas as linhas da tabela all_packs
      const response = await axios.get(`${NGROK_BASE_URL}/api/db/rows/all_packs`);
      
      if (response.data && Array.isArray(response.data.rows)) {
        // Filtra apenas os pacotes do vendedor atual
        const sellerPacks = response.data.rows.filter(
          (pack: AllPacksRow) => pack.seller_id === sellerId
        );
        
        console.log(`Encontrados ${sellerPacks.length} pacotes para o seller_id ${sellerId}`);
        setPacks(sellerPacks);
      } else {
        setError('Formato de resposta inválido ao carregar pacotes da tabela all_packs');
      }
    } catch (error) {
      console.error('Erro ao carregar pacotes da tabela all_packs:', error);
      setError('Falha ao carregar pacotes do vendedor da tabela all_packs');
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  // Função para atualizar a lista de pacotes
  const refreshPacks = useCallback(() => {
    console.log("🔄 Atualizando lista de pacotes da tabela all_packs");
    fetchAllPacks();
  }, [fetchAllPacks]);

  useEffect(() => {
    fetchAllPacks();
  }, [fetchAllPacks]);

  return { packs, isLoading, error, refreshPacks };
}
