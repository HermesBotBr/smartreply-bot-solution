
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getLocalApiUrl } from '@/config/api';
import { toast } from '@/components/ui/use-toast';

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
        const sellerIdMatch = textData.match(/SELLER_ID:\s*(\d+)/);
        const fileSellerID = sellerIdMatch ? sellerIdMatch[1].trim() : null;
        
        // Extract LAST_UPDATE line
        const lastUpdateMatch = textData.match(/LAST_UPDATE:\s*(.+)/);
        const fileLastUpdate = lastUpdateMatch ? lastUpdateMatch[1].trim() : null;
        
        // Log for debugging
        console.log('File Seller ID:', fileSellerID);
        console.log('Current Seller ID:', sellerId);
        
        // Convert both to strings and trim for comparison
        const normalizedFileSellerId = fileSellerID ? String(fileSellerID).trim() : '';
        const normalizedSellerId = sellerId ? String(sellerId).trim() : '';
        
        // Make sure the file contains data for the current seller
        if (normalizedFileSellerId === normalizedSellerId) {
          // Save the release data to localStorage for inventory lookup
          localStorage.setItem('releaseData', textData);
          
          setReleaseData(textData);
          setLastUpdate(fileLastUpdate);
          setError(null);
        } else {
          console.error(`Release data mismatch. File: "${normalizedFileSellerId}" Current: "${normalizedSellerId}"`);
          // Instead of showing error, try to use cached data if available
          const cachedData = localStorage.getItem('releaseData');
          if (cachedData) {
            console.log('Using cached release data from localStorage');
            setReleaseData(cachedData);
            
            // Try to extract last update from cached data
            const cachedLastUpdateMatch = cachedData.match(/LAST_UPDATE:\s*(.+)/);
            const cachedLastUpdate = cachedLastUpdateMatch ? cachedLastUpdateMatch[1].trim() : null;
            setLastUpdate(cachedLastUpdate);
            
            // Set a warning instead of an error
            setError(new Error('Using cached release data. Refresh to attempt new download.'));
          } else {
            setReleaseData('');
            setLastUpdate(null);
            setError(new Error(`ID do vendedor não corresponde ao arquivo de liberações. Esperado: ${normalizedSellerId}, Encontrado: ${normalizedFileSellerId}`));
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching release data:', err);
        
        // Try to use cached data on error
        const cachedData = localStorage.getItem('releaseData');
        if (cachedData) {
          console.log('Using cached release data on error');
          setReleaseData(cachedData);
          
          // Try to extract last update from cached data
          const cachedLastUpdateMatch = cachedData.match(/LAST_UPDATE:\s*(.+)/);
          const cachedLastUpdate = cachedLastUpdateMatch ? cachedLastUpdateMatch[1].trim() : null;
          setLastUpdate(cachedLastUpdate);
          
          setError(new Error('Usando dados em cache. Erro ao atualizar: ' + (err instanceof Error ? err.message : 'Erro desconhecido')));
        } else {
          setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        }
        
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
      const sellerIdMatch = textData.match(/SELLER_ID:\s*(\d+)/);
      const fileSellerID = sellerIdMatch ? sellerIdMatch[1].trim() : null;
      
      // Extract LAST_UPDATE line
      const lastUpdateMatch = textData.match(/LAST_UPDATE:\s*(.+)/);
      const fileLastUpdate = lastUpdateMatch ? lastUpdateMatch[1].trim() : null;
      
      // Log for debugging
      console.log('Refresh - File Seller ID:', fileSellerID);
      console.log('Refresh - Current Seller ID:', sellerId);
      
      // Convert both to strings and trim for comparison
      const normalizedFileSellerId = fileSellerID ? String(fileSellerID).trim() : '';
      const normalizedSellerId = sellerId ? String(sellerId).trim() : '';
      
      // Make sure the file contains data for the current seller
      if (normalizedFileSellerId === normalizedSellerId) {
        // Save the release data to localStorage for inventory lookup
        localStorage.setItem('releaseData', textData);
        
        setReleaseData(textData);
        setLastUpdate(fileLastUpdate);
        setError(null);
        
        toast({
          title: "Dados atualizados com sucesso",
          description: `Última atualização: ${fileLastUpdate}`,
        });
        
        setIsLoading(false);
        return true;
      } else {
        console.error(`Refresh - Release data mismatch. File: "${normalizedFileSellerId}" Current: "${normalizedSellerId}"`);
        setReleaseData('');
        setLastUpdate(null);
        setError(new Error(`ID do vendedor não corresponde ao arquivo de liberações. Esperado: ${normalizedSellerId}, Encontrado: ${normalizedFileSellerId}`));
        
        toast({
          variant: "destructive",
          title: "Erro na atualização",
          description: `ID do vendedor não corresponde ao arquivo de liberações. Esperado: ${normalizedSellerId}, Encontrado: ${normalizedFileSellerId}`,
        });
        
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Error refreshing release data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao atualizar dados: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
      });
      
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
