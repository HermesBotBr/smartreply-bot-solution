import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useComplaintsFilter } from './useComplaintsFilter';

export type FilterType = 'all' | 'human' | 'hermes' | 'complaints';

interface OnOffRow {
  pack_id: string;
  seller_id: string;
}

interface ComplaintFormattedPack {
  pack_id: string;
  seller_id: string | null;
  date_msg: string;
  gpt: string;
  is_complaint: boolean;
  claim_id: number;
  complaint_reason: string;
  order_id: number;
  original_pack_id?: string | null;
}

export function usePackFilters(sellerId: string | null) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [humanRequiredPacks, setHumanRequiredPacks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complaintsFilteredPacks, setComplaintsFilteredPacks] = useState<ComplaintFormattedPack[]>([]);
  
  const { 
    complaints, 
    complaintsMessages, 
    isLoading: complaintsLoading, 
    error: complaintsError,
    transformComplaintsToPackFormat 
  } = useComplaintsFilter(sellerId);

  useEffect(() => {
    if (!sellerId) return;

    const fetchHumanRequiredPacks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get('https://projetohermes-dda7e0c8d836.herokuapp.com/api/db/rows/all_onoff');
        
        if (response.data && Array.isArray(response.data.rows)) {
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

  useEffect(() => {
    if (filter === 'complaints' && sellerId) {
      const loadComplaints = async () => {
        try {
          const formattedComplaints = await transformComplaintsToPackFormat();
          
          const validatedComplaints = formattedComplaints.map(item => {
            const displayPackId = item.pack_id || `claim-${item.claim_id}`;
            const originalPackId = item.pack_id;
            
            return {
              ...item,
              pack_id: displayPackId,
              original_pack_id: originalPackId,
              seller_id: sellerId,
              date_msg: item.date_msg || new Date().toISOString(),
              gpt: typeof item.gpt === 'string' ? item.gpt : "não",
              is_complaint: true,
              claim_id: typeof item.claim_id === 'number' ? item.claim_id : 0,
              complaint_reason: item.complaint_reason || "Motivo não especificado",
              order_id: typeof item.order_id === 'number' ? item.order_id : 0
            };
          });
          
          setComplaintsFilteredPacks(validatedComplaints);
        } catch (err) {
          console.error("Erro ao transformar reclamações:", err);
          setError("Erro ao processar as reclamações");
        }
      };
      
      loadComplaints();
    }
  }, [filter, sellerId, transformComplaintsToPackFormat, complaints]);

  const filterPacks = useCallback((packs: any[]) => {
    if (!Array.isArray(packs)) {
      console.error("filterPacks recebeu dados inválidos:", packs);
      return [];
    }
    
    const validPacks = packs.filter(pack => pack && typeof pack === 'object' && pack.pack_id);
    
    if (filter === 'all') {
      return validPacks;
    } else if (filter === 'human') {
      return validPacks.filter(pack => humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'hermes') {
      return validPacks.filter(pack => !humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'complaints') {
      return complaintsFilteredPacks;
    }
    
    return validPacks;
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
