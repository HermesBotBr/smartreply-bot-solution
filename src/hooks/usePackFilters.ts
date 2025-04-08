
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export type FilterType = 'all' | 'human' | 'hermes' | 'complaints';

interface OnOffRow {
  pack_id: string;
  seller_id: string;
}

export interface Complaint {
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [humanRequiredPacks, setHumanRequiredPacks] = useState<string[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch human required packs when sellerId changes
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

  // Fetch complaints immediately when sellerId is available, regardless of filter
  useEffect(() => {
    if (sellerId) {
      fetchComplaints(sellerId);
    }
  }, [sellerId]);

  // Also fetch complaints when filter is explicitly set to 'complaints'
  // This ensures we refresh the data when the user selects the complaints filter
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

  const filterPacks = useCallback((packs: any[]) => {
    // First, apply the filter type (all, human, hermes, complaints)
    let filteredPacks = [];
    
    if (filter === 'all') {
      filteredPacks = packs;
    } else if (filter === 'human') {
      filteredPacks = packs.filter(pack => humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'hermes') {
      // Show only packs that are NOT in the humanRequiredPacks array
      filteredPacks = packs.filter(pack => !humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'complaints') {
      // Para reclamações, criamos uma lista de "packs virtuais" baseados nos dados de reclamações
      filteredPacks = complaints.map(complaint => {
        // Se pack_id for null, usar order_id como pack_id
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
    
    // Then, if there's a search query, filter by client name
    if (searchQuery && searchQuery.trim() !== '') {
      return filteredPacks.filter(pack => {
        // The client name filtering will be done at rendering time in PacksList
        // because that's where we have access to the clientDataMap
        // We'll return true here and let PacksList handle the filtering
        return true;
      });
    }
    
    return filteredPacks;
  }, [filter, humanRequiredPacks, complaints, sellerId, searchQuery]);

  return {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    humanRequiredPacks,
    complaints,
    isLoading,
    error,
    filterPacks
  };
}
