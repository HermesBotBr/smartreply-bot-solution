
import { useState, useEffect } from 'react';
import axios from 'axios';

export type FilterType = 'all' | 'human' | 'hermes' | 'mixed' | 'complaints';

interface OnOffRow {
  pack_id: string;
  seller_id: string;
}

export function usePackFilters(sellerId: string | null) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [humanRequiredPacks, setHumanRequiredPacks] = useState<string[]>([]);
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

  const filterPacks = (packs: any[]) => {
    if (filter === 'all') {
      return packs;
    } else if (filter === 'human') {
      return packs.filter(pack => humanRequiredPacks.includes(pack.pack_id));
    } else if (filter === 'hermes') {
      // Show only packs that are NOT in the humanRequiredPacks array
      return packs.filter(pack => !humanRequiredPacks.includes(pack.pack_id));
    }
    
    // Other filters will be implemented later
    return packs;
  };

  return {
    filter,
    setFilter,
    humanRequiredPacks,
    isLoading,
    error,
    filterPacks
  };
}
