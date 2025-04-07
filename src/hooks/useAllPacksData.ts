
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getNgrokUrl } from '@/config/api';

export interface AllPacksRow {
  pack_id: string;
  gpt: string | null;
  seller_id: string | null;
  date_msg: string | null;
}

export function useAllPacksData(sellerId: string | null) {
  const [packs, setPacks] = useState<AllPacksRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const [allSortedPacks, setAllSortedPacks] = useState<AllPacksRow[]>([]);

  const fetchAllPacks = useCallback(async (currentPage: number) => {
    if (!sellerId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Usa o endpoint exato para buscar todas as linhas da tabela all_packs
      const response = await axios.get('https://projetohermes-dda7e0c8d836.herokuapp.com/api/db/rows/all_packs');
      
      if (response.data && Array.isArray(response.data.rows)) {
        // Filtra apenas os pacotes do vendedor atual
        const sellerPacks = response.data.rows.filter(
          (pack: AllPacksRow) => pack.seller_id === sellerId
        );
        
        console.log(`Encontrados ${sellerPacks.length} pacotes para o seller_id ${sellerId}`);
        
        // Ordena os pacotes por data da mensagem (mais recente primeiro)
        const sortedPacks = sellerPacks.sort((a: AllPacksRow, b: AllPacksRow) => {
          // Pacotes com date_msg nulo vão para o final
          if (!a.date_msg && !b.date_msg) return 0;
          if (!a.date_msg) return 1;
          if (!b.date_msg) return -1;
          
          return new Date(b.date_msg).getTime() - new Date(a.date_msg).getTime();
        });
        
        // Salva todos os pacotes ordenados para usar na paginação
        setAllSortedPacks(sortedPacks);
        
        // Calcula o início e fim da página
        const startIndex = 0;
        const endIndex = currentPage * LIMIT;
        
        // Pega apenas os pacotes da página atual
        const pagedPacks = sortedPacks.slice(startIndex, endIndex);
        
        // Define se ainda há mais pacotes para carregar
        setHasMore(endIndex < sortedPacks.length);
        
        // Atualiza a lista de pacotes
        setPacks(pagedPacks);
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

  // Função para carregar mais pacotes
  const loadMorePacks = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prevPage => {
        const newPage = prevPage + 1;
        
        // Obter apenas os novos pacotes para esta página
        const startIndex = prevPage * LIMIT;
        const endIndex = newPage * LIMIT;
        
        // Adicionar apenas os novos pacotes à lista existente
        const newPacks = allSortedPacks.slice(startIndex, endIndex);
        setPacks(prevPacks => [...prevPacks, ...newPacks]);
        
        // Verificar se ainda há mais pacotes para carregar
        setHasMore(endIndex < allSortedPacks.length);
        
        console.log(`Carregando mais pacotes. Página ${newPage}, adicionando pacotes de ${startIndex} a ${endIndex}`);
        
        return newPage;
      });
    }
  }, [isLoading, hasMore, allSortedPacks, LIMIT]);

  // Função para atualizar a lista de pacotes
  const refreshPacks = useCallback(() => {
    console.log("🔄 Atualizando lista de pacotes da tabela all_packs");
    setPage(1); // Reset para a primeira página
    fetchAllPacks(1);
  }, [fetchAllPacks]);

  useEffect(() => {
    fetchAllPacks(page);
  }, [fetchAllPacks, page]);

  return { packs, setPacks, isLoading, error, refreshPacks, loadMorePacks, hasMore };
}
