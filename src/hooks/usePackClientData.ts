
import { useState, useEffect, useRef } from 'react';
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
  "Item ID": string;  // Ensure this field is properly defined
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
  const loadedPackIds = useRef(new Set<string>());
  
  useEffect(() => {
    const fetchClientData = async () => {
      if (!sellerId || !packs.length) {
        return;
      }
      
      // Filtrar apenas os novos packs que ainda não foram carregados
      const newPacks = packs.filter(pack => !loadedPackIds.current.has(pack.pack_id));
      
      if (newPacks.length === 0) {
        return; // Nada novo para carregar
      }
      
      console.log(`Buscando dados de cliente para ${newPacks.length} novos pacotes`);
      setIsLoading(true);
      setError(null);

      try {
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
              
              // Marcar este pack como já carregado
              loadedPackIds.current.add(pack.pack_id);
              
              console.log(`Data for pack ${pack.pack_id} loaded successfully`);
              
              return { 
                packId: pack.pack_id, 
                data: response.data 
              };
            } catch (err) {
              console.error(`Error fetching data for pack ${pack.pack_id}:`, err);
              // Ainda marcamos como carregado para não tentar novamente
              loadedPackIds.current.add(pack.pack_id);
              return { 
                packId: pack.pack_id, 
                data: null 
              };
            }
          });
          
          // Wait for all promises in the batch to resolve
          const results = await Promise.all(batchPromises);
          
          // Add results to the map (updating the state immutably)
          setClientDataMap(prevMap => {
            const newMap = {...prevMap};
            results.forEach(result => {
              newMap[result.packId] = result.data;
            });
            return newMap;
          });
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
        setError("Erro ao carregar dados dos clientes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [sellerId, packs]);

  return { clientDataMap, isLoading, error };
}
