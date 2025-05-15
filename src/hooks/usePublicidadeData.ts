
import { useState } from 'react';
import { getNgrokUrl } from '@/config/api';
import { toast } from '@/components/ui/use-toast';

export interface AdvertisingItem {
  item_id: string;
  title: string;
  metrics: {
    cost: number;
    clicks: number;
    prints: number;
    cpc: number;
    ctr: number;
    roas: number;
    direct_units_quantity: number;
  };
  thumbnail: string;
  permalink: string;
}

export interface AdvertisingData {
  results: AdvertisingItem[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
}

export const usePublicidadeData = (sellerId: string) => {
  const [data, setData] = useState<AdvertisingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchPublicidadeData = async (startDate?: Date, endDate?: Date) => {
    if (!sellerId) {
      toast({
        title: "Erro",
        description: "ID do vendedor não fornecido",
        variant: "destructive"
      });
      return;
    }
    
    if (!startDate || !endDate) {
      toast({
        description: "Período não selecionado para busca de dados de publicidade",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Format dates to DD/MM/YYYY
      const formattedStartDate = startDate.toLocaleDateString('pt-BR');
      const formattedEndDate = endDate.toLocaleDateString('pt-BR');
      
      const response = await fetch(getNgrokUrl('/publicidade_adm'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          seller_id: sellerId,
          start_date: formattedStartDate,
          end_date: formattedEndDate
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados de publicidade: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const error = err as Error;
      console.error("Erro ao buscar dados de publicidade:", error);
      setError(error);
      toast({
        title: "Erro",
        description: `Falha ao buscar dados de publicidade: ${error.message}`,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    data,
    isLoading,
    error,
    fetchPublicidadeData
  };
};
