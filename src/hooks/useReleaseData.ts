
import { useState } from 'react';

export function useReleaseData(sellerId: string | null) {
  const [releaseData, setReleaseData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Função para definir dados de liberação manualmente
  const setReleaseDataManually = (data: string) => {
    setReleaseData(data);
    
    // Extrair a data de última atualização do conteúdo se existir
    const lastUpdateMatch = data.match(/LAST_UPDATE:\s*(.*)/);
    if (lastUpdateMatch && lastUpdateMatch[1]) {
      setLastUpdate(lastUpdateMatch[1]);
    }
    
    // Salvar os dados no localStorage para uso no inventário
    localStorage.setItem('releaseData', data);
  };

  return { 
    releaseData, 
    isLoading, 
    error, 
    lastUpdate,
    setReleaseData: setReleaseDataManually
  };
}
