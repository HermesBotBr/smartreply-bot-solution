
import { useState, useEffect } from 'react';
import axios from 'axios';

interface ReleaseDataResponse {
  text: string;
}

export function useReleaseData(sellerId: string | null) {
  const [releaseData, setReleaseData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleaseData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch release data from our proxy API
        const response = await axios.get<string>('/api/proxy-releases');
        
        if (response.status !== 200) {
          throw new Error('Failed to fetch release data');
        }
        
        const data = response.data;
        
        // Extract the last update date from the data
        const lastUpdateMatch = data.match(/LAST_UPDATE: (.*)/);
        if (lastUpdateMatch && lastUpdateMatch[1]) {
          setLastUpdate(lastUpdateMatch[1]);
        }
        
        // Save the release data
        localStorage.setItem('releaseData', data);
        setReleaseData(data);
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
