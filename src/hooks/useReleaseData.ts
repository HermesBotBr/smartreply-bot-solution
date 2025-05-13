
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
        
        // Fetch release data directly from the URL instead of the database
        const response = await axios.get(
          `${getNgrokUrl('/releases.txt')}`,
          { responseType: 'text' }
        );
        
        if (response.status !== 200) {
          throw new Error('Failed to fetch release data');
        }
        
        const textData = response.data;
        
        // Extract SELLER_ID and LAST_UPDATE from the text
        const sellerIdMatch = textData.match(/SELLER_ID: (\d+)/);
        const lastUpdateMatch = textData.match(/LAST_UPDATE: ([\d-]+ [\d:]+)/);
        
        if (sellerIdMatch && sellerIdMatch[1] === sellerId) {
          // Save the release data to localStorage for inventory lookup
          localStorage.setItem('releaseData', textData);
          
          setReleaseData(textData);
          
          if (lastUpdateMatch && lastUpdateMatch[1]) {
            setLastUpdate(lastUpdateMatch[1]);
          }
        } else {
          console.warn('Data for this seller not found or seller ID mismatch');
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
