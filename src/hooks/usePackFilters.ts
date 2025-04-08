
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useComplaintsData } from './useComplaintsData';
import { AllPacksRow } from './useAllPacksData';

export type FilterType = 'all' | 'human' | 'hermes' | 'complaints';

interface OnOffRow {
  pack_id: string;
  seller_id: string;
}

// Extended version of AllPacksRow that includes complaint-specific fields
export interface ComplaintPackRow extends AllPacksRow {
  original_pack_id?: string | null;
  claim_id?: string;
  reason_id?: string;
  motivo_reclamacao?: string;
  is_complaint?: boolean;
  order_id?: string;
}

export function usePackFilters(sellerId: string | null) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [humanRequiredPacks, setHumanRequiredPacks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the complaints hook
  const { 
    complaints, 
    isLoading: complaintsLoading, 
    error: complaintsError 
  } = useComplaintsData(sellerId);

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

  const filterPacks = (packs: AllPacksRow[]) => {
    if (filter === 'all') {
      return packs;
    } else if (filter === 'human') {
      return packs.filter(pack => humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'hermes') {
      // Show only packs that are NOT in the humanRequiredPacks array
      return packs.filter(pack => !humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'complaints') {
      // For complaints, we need to create virtual pack rows based on the complaints data
      // The original packs will be returned and handled in the PacksList component
      return [];
    }
    
    return packs;
  };

  // This function returns complaint data formatted as pack rows for display
  const getComplaintPackRows = (): ComplaintPackRow[] => {
    if (filter !== 'complaints' || !complaints.length) {
      return [];
    }

    return complaints.map(complaint => ({
      // Use claim_id as the pack_id for complaint rows
      pack_id: `claim-${complaint.claim_id}`,
      // Store the original pack_id if it exists
      original_pack_id: complaint.pack_id?.toString() || null,
      seller_id: sellerId || '',
      gpt: 'nao', // Complaints don't use GPT
      date_msg: complaint.data_criada, // Use complaint creation date for sorting
      claim_id: complaint.claim_id.toString(),
      reason_id: complaint.reason_id,
      motivo_reclamacao: complaint.motivo_reclamacao,
      data_criada: complaint.data_criada,
      is_complaint: true,
      order_id: complaint.order_id.toString()
    }));
  };

  return {
    filter,
    setFilter,
    humanRequiredPacks,
    isLoading: isLoading || complaintsLoading,
    error: error || complaintsError,
    filterPacks,
    complaints,
    getComplaintPackRows
  };
}
