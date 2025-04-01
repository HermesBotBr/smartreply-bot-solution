
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface PackUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    pack_id: string;
    seller_id: string;
    messages_count: number;
    timestamp: string;
  };
  error?: string;
}

export function useMessageNotifications(
  sellerId: string | null,
  onPackUpdate: (packId: string) => void
) {
  const [isCheckingEndpoint, setIsCheckingEndpoint] = useState(false);
  const endpointCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;

    if (endpointCheckIntervalRef.current) {
      clearInterval(endpointCheckIntervalRef.current);
    }

    // Não estamos mais verificando a tabela "notifica_mensagens"
    // Em vez disso, implementamos um sistema onde o endpoint /api/force-refresh-pack
    // é chamado externamente (por exemplo, via Postman) para acionar atualizações
    
    console.log("Sistema de notificações iniciado. Aguardando chamadas ao endpoint /api/force-refresh-pack");

    return () => {
      if (endpointCheckIntervalRef.current) {
        clearInterval(endpointCheckIntervalRef.current);
      }
    };
  }, [sellerId, onPackUpdate]);

  // Este método pode ser usado para testar o endpoint internamente, se necessário
  const testForceRefresh = async (packId: string) => {
    if (!sellerId) return false;
    
    try {
      const response = await axios.post('/api/force-refresh-pack', {
        seller_id: sellerId,
        pack_id: packId
      });
      
      if (response.data.success) {
        onPackUpdate(packId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao testar endpoint de atualização forçada:', error);
      return false;
    }
  };

  return { isCheckingEndpoint, testForceRefresh };
}
