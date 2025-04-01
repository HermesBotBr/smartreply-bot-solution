
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

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

/**
 * Hook para gerenciar notificações de novas mensagens 
 * @param sellerId ID do vendedor
 * @param onPackUpdate Função a ser chamada quando houver atualização em um pacote
 */
export function useMessageNotifications(
  sellerId: string | null,
  onPackUpdate: (packId: string) => void
) {
  const [isPollingApi, setIsPollingApi] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastResponseTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    // Quando o componente é montado ou o sellerId muda
    if (!sellerId) return;

    // Limpa o intervalo anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Configura uma verificação para monitorar chamadas ao endpoint /api/force-refresh-pack
    const setupPackUpdateMonitoring = () => {
      console.log("📡 Sistema de monitoramento de atualizações iniciado para seller:", sellerId);
      
      // Configuramos um intervalo para verificar periodicamente se há atualizações vindas do endpoint
      pollingIntervalRef.current = setInterval(async () => {
        try {
          setIsPollingApi(true);
          const response = await axios.get('/api/check-update-queue', {
            params: { seller_id: sellerId }
          });
          
          if (response.data.updates && response.data.updates.length > 0) {
            console.log("📦 Atualizações detectadas:", response.data.updates);
            
            // Para cada pacote na fila de atualização, chamamos o callback
            response.data.updates.forEach((update: any) => {
              const packId = update.pack_id;
              console.log(`📬 Processando atualização para o pacote ${packId}`);
              
              // Armazenamos o timestamp da última atualização
              lastResponseTimestampRef.current = update.timestamp;
              
              // Chamamos o callback para atualizar o frontend
              onPackUpdate(packId);
            });
          }
        } catch (error) {
          console.error('⚠️ Erro ao verificar fila de atualizações:', error);
        } finally {
          setIsPollingApi(false);
        }
      }, 3000); // Verifica a cada 3 segundos
    };

    setupPackUpdateMonitoring();
    
    // Cleanup no unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [sellerId, onPackUpdate]);

  // Método exposto para testar forçar a atualização de um pacote específico (pode ser usado para testes internos)
  const testForceRefresh = async (packId: string) => {
    if (!sellerId) return false;
    
    try {
      setIsPollingApi(true);
      
      const response = await axios.post('/api/force-refresh-pack', {
        seller_id: sellerId,
        pack_id: packId
      });
      
      if (response.data.success) {
        console.log(`✅ Atualização forçada para o pacote ${packId} concluída:`, response.data);
        
        // Chamamos onPackUpdate com o packId para atualizar o frontend imediatamente
        onPackUpdate(packId);
        
        // Armazenamos o timestamp da última atualização
        if (response.data.data?.timestamp) {
          lastResponseTimestampRef.current = response.data.data.timestamp;
        }
        
        toast.success(`Mensagens do pacote ${packId} atualizadas com sucesso!`);
        return true;
      } else {
        console.error("❌ Erro ao forçar atualização:", response.data.error);
        toast.error(`Erro na atualização: ${response.data.error}`);
        return false;
      }
    } catch (error) {
      console.error('⚠️ Erro ao testar endpoint de atualização forçada:', error);
      toast.error('Falha na comunicação com o servidor');
      return false;
    } finally {
      setIsPollingApi(false);
    }
  };

  return { isPollingApi, testForceRefresh, lastUpdateTimestamp: lastResponseTimestampRef.current };
}
