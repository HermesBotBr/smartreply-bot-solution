import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useComplaintsFilter } from './useComplaintsFilter';

export type FilterType = 'all' | 'human' | 'hermes' | 'complaints';

interface OnOffRow {
  pack_id: string;
  seller_id: string;
}

export function usePackFilters(sellerId: string | null) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [humanRequiredPacks, setHumanRequiredPacks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complaintsFilteredPacks, setComplaintsFilteredPacks] = useState<any[]>([]);
  
  // Usamos o hook de reclamações
  const { 
    complaints, 
    complaintsMessages, 
    isLoading: complaintsLoading, 
    error: complaintsError,
    transformComplaintsToPackFormat 
  } = useComplaintsFilter(sellerId);

  // Buscando packs que requerem atendimento humano
  useEffect(() => {
    if (!sellerId) return;

    const fetchHumanRequiredPacks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get('https://projetohermes-dda7e0c8d836.herokuapp.com/api/db/rows/all_onoff');
        
        if (response.data && Array.isArray(response.data.rows)) {
          // Filter rows that match the current seller
          const matchingPacks = response.data.rows
            .filter((row: OnOffRow) => row.seller_id === sellerId)
            .map((row: OnOffRow) => row.pack_id);
          
          setHumanRequiredPacks(matchingPacks);
          console.log(`Found ${matchingPacks.length} packs requiring human attention for seller ${sellerId}`);
        } else {
          setError('Invalid response format from all_onoff API');
        }
      } catch (error) {
        console.error('Error fetching human required packs:', error);
        setError('Failed to load packs requiring human attention');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHumanRequiredPacks();
  }, [sellerId]);

  // Efeito para buscar e processar reclamações quando o filtro mudar para 'complaints'
  useEffect(() => {
    if (filter === 'complaints' && sellerId) {
      const loadComplaints = async () => {
        try {
          const formattedComplaints = await transformComplaintsToPackFormat();
          setComplaintsFilteredPacks(formattedComplaints);
        } catch (err) {
          console.error("Erro ao transformar reclamações:", err);
          setError("Erro ao processar as reclamações");
        }
      };
      
      loadComplaints();
    }
  }, [filter, sellerId, transformComplaintsToPackFormat, complaints]);

  // Função que aplica os filtros aos pacotes
  const filterPacks = useCallback((packs: any[]) => {
    if (filter === 'all') {
      return packs;
    } else if (filter === 'human') {
      return packs.filter(pack => humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'hermes') {
      // Show only packs that are NOT in the humanRequiredPacks array
      return packs.filter(pack => !humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'complaints') {
      // Retorna os pacotes formatados de reclamações
      return complaintsFilteredPacks;
    }
    
    return packs;
  }, [filter, humanRequiredPacks, complaintsFilteredPacks]);

  return {
    filter,
    setFilter,
    humanRequiredPacks,
    isLoading: isLoading || complaintsLoading,
    error: error || complaintsError,
    filterPacks,
    complaintsMessages
  };
}
