import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export type FilterType = 'all' | 'human' | 'hermes' | 'complaints';

interface OnOffRow {
  pack_id: string;
  seller_id: string;
}

interface Complaint {
  order_id: number;
  pack_id: string | null;
  claim_id: number;
  reason_id: string;
  motivo_reclamacao: string;
  afetou_reputacao: string;
  data_criada: string;
}

export function usePackFilters(sellerId: string | null) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [humanRequiredPacks, setHumanRequiredPacks] = useState<string[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Função para buscar reclamações quando o filtro de reclamações é selecionado
  useEffect(() => {
    if (filter === 'complaints' && sellerId) {
      fetchComplaints(sellerId);
    }
  }, [filter, sellerId]);

  const fetchComplaints = async (sellerId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`https://projetohermes-dda7e0c8d836.herokuapp.com/reclama?seller_id=${sellerId}`);
      
      if (response.data && response.data.sales && Array.isArray(response.data.sales)) {
        setComplaints(response.data.sales);
        console.log(`Found ${response.data.sales.length} complaints for seller ${sellerId}`);
      } else if (response.data && Array.isArray(response.data)) {
        setComplaints(response.data);
        console.log(`Found ${response.data.length} complaints for seller ${sellerId}`);
      } else {
        setError('Invalid response format from complaints API');
        console.error('Invalid response format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Failed to load complaints');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPacks = (packs: any[]) => {
    if (filter === 'all') {
      return packs;
    } else if (filter === 'human') {
      return packs.filter(pack => humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'hermes') {
      // Show only packs that are NOT in the humanRequiredPacks array
      return packs.filter(pack => !humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'complaints') {
      // Para reclamações, criamos uma lista de "packs virtuais" baseados nos dados de reclamações
      return complaints.map(complaint => {
        const packId = complaint.pack_id || complaint.order_id.toString();
        return {
          pack_id: packId,
          seller_id: sellerId,
          gpt: "não",
          date_msg: complaint.data_criada,
          // Adicionamos informações extras para o componente PacksList
          complaint: true,
          claim_id: complaint.claim_id,
          order_id: complaint.order_id,
          reason: complaint.motivo_reclamacao
        };
      });
    }
    
    return packs;
  };

  return {
    filter,
    setFilter,
    humanRequiredPacks,
    complaints,
    isLoading,
    error,
    filterPacks
  };
}
