
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getNgrokUrl } from '@/config/api';
import { toast } from 'sonner';

export interface Complaint {
  order_id: number;
  pack_id: string | null;
  claim_id: number;
  reason_id: string;
  motivo_reclamacao: string;
  afetou_reputacao: string;
  data_criada: string;
}

export interface ComplaintMessage {
  sender_role: string;
  receiver_role: string;
  message: string;
  translated_message: string | null;
  date_created: string;
  last_updated: string;
  message_date: string;
  date_read: string | null;
  attachments: any[];
  status: string;
  stage: string;
  message_moderation: {
    status: string;
    reason: string;
    source: string;
    date_moderated: string;
  };
  repeated: boolean;
  hash: string;
}

export function useComplaintsFilter(sellerId: string | null) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsMessages, setComplaintsMessages] = useState<Record<string, ComplaintMessage[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca todas as reclamações para um vendedor
  const fetchComplaints = useCallback(async () => {
    if (!sellerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${getNgrokUrl('/reclama')}`, {
        params: { seller_id: sellerId }
      });

      // Novo formato de resposta: { sales: Complaint[] }
      if (response.data) {
        let complaintsData: Complaint[] = [];
        
        // Verificamos se a resposta está no novo formato com propriedade 'sales'
        if (response.data.sales && Array.isArray(response.data.sales)) {
          complaintsData = response.data.sales;
        } 
        // Ou se é um array direto (formato antigo)
        else if (Array.isArray(response.data)) {
          complaintsData = response.data;
        } 
        else {
          throw new Error('Formato de resposta inválido');
        }
        
        setComplaints(complaintsData);
        console.log(`Encontradas ${complaintsData.length} reclamações para o vendedor ${sellerId}`);
      } else {
        console.error('Formato de resposta inválido do endpoint de reclamações:', response.data);
        setError('Formato de resposta inválido do endpoint de reclamações');
      }
    } catch (error) {
      console.error('Erro ao buscar reclamações:', error);
      setError('Erro ao carregar reclamações');
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  // Busca mensagens de uma reclamação específica
  const fetchComplaintMessages = useCallback(async (claimId: number) => {
    if (!sellerId || !claimId) return null;

    try {
      const response = await axios.get(`${getNgrokUrl('/conversas_rec')}`, {
        params: {
          seller_id: sellerId,
          claim_id: claimId
        }
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error(`Formato de resposta inválido para mensagens da reclamação ${claimId}:`, response.data);
        return [];
      }
    } catch (error) {
      console.error(`Erro ao buscar mensagens da reclamação ${claimId}:`, error);
      return [];
    }
  }, [sellerId]);

  // Carrega todas as reclamações quando o sellerId muda
  useEffect(() => {
    if (sellerId) {
      fetchComplaints();
    } else {
      setComplaints([]);
      setComplaintsMessages({});
    }
  }, [sellerId, fetchComplaints]);

  // Transforma dados de reclamação para o formato esperado pelo PacksList
  const transformComplaintsToPackFormat = useCallback(async (): Promise<any[]> => {
    if (complaints.length === 0) return [];

    const result = [];
    
    // Cria um mapa para armazenar mensagens de reclamação por claim_id
    const messagesMap: Record<string, ComplaintMessage[]> = {};

    // Busca mensagens para cada reclamação
    for (const complaint of complaints) {
      if (complaint.claim_id) {
        const messages = await fetchComplaintMessages(complaint.claim_id);
        if (messages && messages.length > 0) {
          messagesMap[complaint.claim_id.toString()] = messages;
        }
      }
    }

    // Atualiza o estado com todas as mensagens de reclamação
    setComplaintsMessages(messagesMap);

    // Transforma cada reclamação em um formato compatível com o PacksList
    for (const complaint of complaints) {
      // Só adiciona reclamações que têm pack_id ou mensagens disponíveis
      if (complaint.pack_id || (complaint.claim_id && messagesMap[complaint.claim_id.toString()])) {
        // Cria um objeto no formato esperado pelo PacksList
        const formattedPack = {
          pack_id: complaint.pack_id || `claim-${complaint.claim_id}`,
          seller_id: sellerId,
          date_msg: complaint.data_criada,
          gpt: null,
          // Adiciona informações adicionais específicas de reclamação
          is_complaint: true,
          claim_id: complaint.claim_id,
          complaint_reason: complaint.motivo_reclamacao,
          order_id: complaint.order_id
        };

        result.push(formattedPack);
      }
    }

    return result;
  }, [complaints, fetchComplaintMessages, sellerId]);

  return {
    complaints,
    complaintsMessages,
    isLoading,
    error,
    transformComplaintsToPackFormat
  };
}
