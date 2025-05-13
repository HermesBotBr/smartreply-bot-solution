
import { useState, useEffect } from 'react';
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
        
        // Fetch release data from the public URL instead of the database
        const response = await axios.get(
          'https://projetohermes-dda7e0c8d836.herokuapp.com/releases.txt',
          { responseType: 'text' }
        );
        
        if (response.status !== 200) {
          throw new Error('Failed to fetch release data');
        }
        
        const textData = response.data;
        
        // Parse the text data to extract seller_id, last_update, and the releases content
        const sellerIdMatch = textData.match(/SELLER_ID: (\d+)/);
        const lastUpdateMatch = textData.match(/LAST_UPDATE: ([\d-]+ [\d:]+)/);
        
        // Extract only the CSV portion of the data (skip the header lines)
        const lines = textData.split('\n');
        let startIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('DATE,SOURCE_ID')) {
            startIndex = i;
            break;
          }
        }
        
        const releasesText = lines.slice(startIndex).join('\n');
        
        // If the current seller ID matches the one in the data, use it
        if (sellerIdMatch && sellerIdMatch[1] === sellerId) {
          // Save the release data to localStorage for inventory lookup
          localStorage.setItem('releaseData', releasesText);
          
          setReleaseData(releasesText);
          
          if (lastUpdateMatch) {
            setLastUpdate(lastUpdateMatch[1]);
          }
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
    },
    refetch: async () => {
      const fetchAgain = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(
            'https://projetohermes-dda7e0c8d836.herokuapp.com/releases.txt',
            { responseType: 'text' }
          );
          
          if (response.status !== 200) {
            throw new Error('Failed to fetch release data');
          }
          
          const textData = response.data;
          
          const sellerIdMatch = textData.match(/SELLER_ID: (\d+)/);
          const lastUpdateMatch = textData.match(/LAST_UPDATE: ([\d-]+ [\d:]+)/);
          
          const lines = textData.split('\n');
          let startIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('DATE,SOURCE_ID')) {
              startIndex = i;
              break;
            }
          }
          
          const releasesText = lines.slice(startIndex).join('\n');
          
          if (sellerIdMatch && sellerIdMatch[1] === sellerId) {
            localStorage.setItem('releaseData', releasesText);
            setReleaseData(releasesText);
            
            if (lastUpdateMatch) {
              setLastUpdate(lastUpdateMatch[1]);
            }
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error('Error re-fetching release data:', err);
          setError(err instanceof Error ? err : new Error('Unknown error occurred'));
          setIsLoading(false);
        }
      };
      
      await fetchAgain();
    }
  };
}
