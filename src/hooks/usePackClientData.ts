
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getNgrokUrl } from "@/config/api";

export interface ClientData {
  Pack_id: string;
  Order_id: number;
  "Data da venda": string;
  "Reclamação aberta?": string;
  "Valor da venda": number;
  "MLB do anúncio": string;
  "Título do anúncio": string;
  "Item ID": string;
  Cor: string;
  Garantia: string;
  Quantidade: number;
  "ID do pagamento": number;
  Shipping_id: number;
  "Status de entrega": string;
  Buyer_id: number;
  "Nickname do cliente": string;
  "Nome completo do cliente": string;
}

export interface PackClientMap {
  [packId: string]: ClientData | null;
}

export function usePackClientData(sellerId: string | null, packs: { pack_id: string }[]) {
  const [clientDataMap, setClientDataMap] = useState<PackClientMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedPackIds, setProcessedPackIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchClientData = async () => {
      if (!sellerId || !packs.length) {
        return;
      }

      // Filtrar apenas os pack_ids que ainda não foram processados
      const newPacks = packs.filter(pack => !processedPackIds.has(pack.pack_id));
      
      if (newPacks.length === 0) {
        // Não há novos pacotes para processar
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Processar apenas os novos pacotes
        const newClientDataMap: PackClientMap = {};
        
        // Process packs in batches to avoid too many concurrent requests
        const batchSize = 5;
        for (let i = 0; i < newPacks.length; i += batchSize) {
          const batch = newPacks.slice(i, i + batchSize);
          
          // Create an array of promises for the batch
          const batchPromises = batch.map(async (pack) => {
            try {
              const response = await axios.get(getNgrokUrl(`/detetive`), {
                params: {
                  seller_id: sellerId,
                  pack_id: pack.pack_id
                }
              });
              
              console.log(`Data for new pack ${pack.pack_id}:`, response.data);
              
              return { 
                packId: pack.pack_id, 
                data: response.data 
              };
            } catch (err) {
              console.error(`Error fetching data for new pack ${pack.pack_id}:`, err);
              return { 
                packId: pack.pack_id, 
                data: null 
              };
            }
          });
          
          // Wait for all promises in the batch to resolve
          const results = await Promise.all(batchPromises);
          
          // Add results to the map
          results.forEach(result => {
            newClientDataMap[result.packId] = result.data;
          });
        }
        
        // Adicionar os novos pacotes processados ao conjunto de pacotes já processados
        const newProcessedPackIds = new Set(processedPackIds);
        newPacks.forEach(pack => newProcessedPackIds.add(pack.pack_id));
        setProcessedPackIds(newProcessedPackIds);
        
        // Atualizar o mapa de dados dos clientes, combinando os dados anteriores com os novos
        setClientDataMap(prevMap => ({...prevMap, ...newClientDataMap}));
      } catch (error) {
        console.error("Error fetching client data:", error);
        setError("Erro ao carregar dados dos clientes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [sellerId, packs, processedPackIds]);

  return { clientDataMap, isLoading, error };
}
