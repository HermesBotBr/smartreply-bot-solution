
import { useState, useEffect } from 'react';
import { getNgrokUrl } from '@/config/api';
import axios from 'axios';

interface ReleaseDataResponse {
  rows: {
    seller_id: string;
    releases: string;
    last_update: string;
  }[];
}

export function useReleaseData(sellerId: string | null) {
  const [releaseData, setReleaseData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleaseData = async () => {
      if (!sellerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch release data from the database
        const response = await axios.get<ReleaseDataResponse>(
          `${getNgrokUrl('/api/db/rows/releases')}`
        );
        
        if (response.status !== 200) {
          throw new Error('Failed to fetch release data');
        }
        
        // Find the record for the current seller
        const sellerData = response.data.rows.find(
          row => row.seller_id === sellerId
        );
        
        if (sellerData) {
          // Save the release data to localStorage for inventory lookup
          localStorage.setItem('releaseData', sellerData.releases);
          
          setReleaseData(sellerData.releases);
          setLastUpdate(sellerData.last_update);
        } else {
          setReleaseData('');
          setLastUpdate(null);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching release data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setIsLoading(false);
      }
    };

    fetchReleaseData();
  }, [sellerId]);

  return { 
    releaseData, 
    isLoading, 
    error, 
    lastUpdate,
    // This is for compatibility with existing code that expects a setter
    setReleaseData: (data: string) => {
      setReleaseData(data);
      localStorage.setItem('releaseData', data);
    }
  };
}
