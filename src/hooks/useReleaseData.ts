
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getLocalApiUrl } from '@/config/api';

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
        
        // Fetch release data from our proxy endpoint
        const response = await axios.get(
          getLocalApiUrl('/refresh-releases')
        );
        
        if (response.status !== 200) {
          throw new Error('Failed to fetch release data');
        }
        
        const textData = response.data;
        
        // Extract SELLER_ID line
        const sellerIdMatch = textData.match(/SELLER_ID: (\d+)/);
        const fileSellerID = sellerIdMatch ? sellerIdMatch[1] : null;
        
        // Extract LAST_UPDATE line
        const lastUpdateMatch = textData.match(/LAST_UPDATE: (.+)/);
        const fileLastUpdate = lastUpdateMatch ? lastUpdateMatch[1] : null;
        
        // Make sure the file contains data for the current seller
        if (fileSellerID === sellerId) {
          // Save the release data to localStorage for inventory lookup
          localStorage.setItem('releaseData', textData);
          
          setReleaseData(textData);
          setLastUpdate(fileLastUpdate);
        } else {
          console.error('Release data does not match current seller ID');
          setReleaseData('');
          setLastUpdate(null);
          setError(new Error('Release data does not match current seller ID'));
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

  // Function to manually refresh data
  const refetchReleaseData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch release data from our proxy endpoint
      const response = await axios.get(
        getLocalApiUrl('/refresh-releases')
      );
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch release data');
      }
      
      const textData = response.data;
      
      // Extract SELLER_ID line
      const sellerIdMatch = textData.match(/SELLER_ID: (\d+)/);
      const fileSellerID = sellerIdMatch ? sellerIdMatch[1] : null;
      
      // Extract LAST_UPDATE line
      const lastUpdateMatch = textData.match(/LAST_UPDATE: (.+)/);
      const fileLastUpdate = lastUpdateMatch ? lastUpdateMatch[1] : null;
      
      // Make sure the file contains data for the current seller
      if (fileSellerID === sellerId) {
        // Save the release data to localStorage for inventory lookup
        localStorage.setItem('releaseData', textData);
        
        setReleaseData(textData);
        setLastUpdate(fileLastUpdate);
      } else {
        console.error('Release data does not match current seller ID');
        setReleaseData('');
        setLastUpdate(null);
        setError(new Error('Release data does not match current seller ID'));
      }
      
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error fetching release data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setIsLoading(false);
      return false;
    }
  };

  return { 
    releaseData, 
    isLoading, 
    error, 
    lastUpdate,
    refetch: refetchReleaseData,
    // This is for compatibility with existing code that expects a setter
    setReleaseData: (data: string) => {
      setReleaseData(data);
      localStorage.setItem('releaseData', data);
    }
  };
}
