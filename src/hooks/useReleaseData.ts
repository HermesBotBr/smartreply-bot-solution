
import { useState, useEffect } from 'react';
import { getLocalApiUrl } from '@/config/api';
import axios from 'axios';

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
        
        // Buscar dados do arquivo releases.txt através do proxy
        const response = await axios.get(getLocalApiUrl('/messages/proxy-releases'), {
          responseType: 'text'
        });
        
        if (response.status !== 200) {
          throw new Error('Falha ao buscar dados de liberações');
        }
        
        const data = response.data;
        
        // Extrair a data de última atualização do conteúdo
        const lastUpdateMatch = data.match(/LAST_UPDATE:\s*(.*)/);
        if (lastUpdateMatch && lastUpdateMatch[1]) {
          setLastUpdate(lastUpdateMatch[1]);
        }
        
        // Salvar os dados no localStorage para uso no inventário
        localStorage.setItem('releaseData', data);
        
        // Definir os dados de liberação
        setReleaseData(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao buscar dados de liberações:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
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
    // Isso é para compatibilidade com código existente que espera um setter
    setReleaseData: (data: string) => {
      setReleaseData(data);
      localStorage.setItem('releaseData', data);
    }
  };
}
