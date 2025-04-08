
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getNgrokUrl } from '@/config/api';

export interface Complaint {
  order_id: number;
  pack_id: number | null;
  claim_id: number;
  reason_id: string;
  motivo_reclamacao: string;
  afetou_reputacao: string;
  data_criada: string;
}

interface ComplaintMessage {
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

// Formatar mensagens de reclamação para o formato esperado pelo sistema
export function formatComplaintMessages(
  complaintMessages: ComplaintMessage[],
  buyerId: number,
  sellerId: string | null
): any[] {
  if (!complaintMessages || !Array.isArray(complaintMessages)) {
    return [];
  }

  return complaintMessages.map(msg => {
    const sellerIdNum = sellerId ? parseInt(sellerId, 10) : 0;
    const isFromSeller = msg.sender_role === 'respondent';

    return {
      id: msg.hash || `complaint-${Date.now()}-${Math.random()}`,
      from: {
        user_id: isFromSeller ? sellerIdNum : buyerId
      },
      to: {
        user_id: isFromSeller ? buyerId : sellerIdNum
      },
      text: msg.message || '',
      message_date: {
        received: msg.date_created,
        available: msg.date_created,
        notified: msg.date_created,
        created: msg.message_date || msg.date_created,
        read: msg.date_read || null
      },
      message_attachments: msg.attachments || null,
      status: msg.status || 'available'
    };
  });
}

export function useComplaintsFilter(sellerId: string | null) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintPackIds, setComplaintPackIds] = useState<Set<string>>(new Set());
  const [claimMessages, setClaimMessages] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar todas as reclamações para o vendedor
  useEffect(() => {
    if (!sellerId) return;

    const fetchComplaints = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`https://projetohermes-dda7e0c8d836.herokuapp.com/reclama`, {
          params: { seller_id: sellerId }
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`Encontradas ${response.data.length} reclamações para o vendedor ${sellerId}`);
          setComplaints(response.data);
          
          // Coletar os pack_ids válidos das reclamações
          const packIds = new Set<string>();
          response.data.forEach((complaint: Complaint) => {
            if (complaint.pack_id) {
              packIds.add(complaint.pack_id.toString());
            }
          });
          
          setComplaintPackIds(packIds);
        } else {
          console.error('Formato de resposta inválido do endpoint de reclamações:', response.data);
          setError('Formato de resposta inválido do endpoint de reclamações');
        }
      } catch (error) {
        console.error('Erro ao buscar reclamações:', error);
        setError('Erro ao buscar reclamações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, [sellerId]);

  // Função para buscar as mensagens de uma reclamação específica
  const fetchComplaintMessages = async (complaint: Complaint, buyerId: number): Promise<any[]> => {
    try {
      // 1. Buscar mensagens normais se houver pack_id
      let regularMessages: any[] = [];
      if (complaint.pack_id) {
        try {
          const regularResponse = await axios.get(`https://projetohermes-dda7e0c8d836.herokuapp.com/conversas`, {
            params: {
              seller_id: sellerId,
              pack_id: complaint.pack_id,
              limit: 3000,
              offset: 0
            }
          });
          
          if (regularResponse.data && regularResponse.data.messages && Array.isArray(regularResponse.data.messages)) {
            regularMessages = regularResponse.data.messages;
          }
        } catch (error) {
          console.error(`Erro ao buscar mensagens regulares para o pack_id ${complaint.pack_id}:`, error);
        }
      }
      
      // 2. Buscar mensagens de reclamação usando claim_id
      let complaintMessages: any[] = [];
      try {
        const complaintResponse = await axios.get(getNgrokUrl(`/conversas_rec`), {
          params: {
            seller_id: sellerId,
            claim_id: complaint.claim_id
          }
        });
        
        if (complaintResponse.data && Array.isArray(complaintResponse.data)) {
          // Converter mensagens de reclamação para o formato padrão
          complaintMessages = formatComplaintMessages(
            complaintResponse.data,
            buyerId,
            sellerId
          );
        }
      } catch (error) {
        console.error(`Erro ao buscar mensagens de reclamação para o claim_id ${complaint.claim_id}:`, error);
      }
      
      // 3. Combinar e ordenar todas as mensagens por data
      const allMessages = [...regularMessages, ...complaintMessages].sort((a, b) => {
        return new Date(a.message_date.created).getTime() - new Date(b.message_date.created).getTime();
      });
      
      return allMessages;
    } catch (error) {
      console.error(`Erro ao buscar mensagens para a reclamação ${complaint.claim_id}:`, error);
      return [];
    }
  };

  // Função para buscar mensagens de uma reclamação específica e armazenar no estado
  const loadComplaintMessages = async (complaint: Complaint, buyerId: number) => {
    const claimId = complaint.claim_id.toString();
    
    // Verificar se já temos as mensagens desta reclamação
    if (claimMessages[claimId] && claimMessages[claimId].length > 0) {
      return;
    }
    
    try {
      const messages = await fetchComplaintMessages(complaint, buyerId);
      setClaimMessages(prev => ({
        ...prev,
        [claimId]: messages
      }));
    } catch (error) {
      console.error(`Erro ao carregar mensagens para a reclamação ${claimId}:`, error);
    }
  };

  // Função para verificar se um pack_id está associado a uma reclamação
  const isComplaintPack = (packId: string): boolean => {
    return complaintPackIds.has(packId);
  };

  // Função para obter a reclamação associada a um pack_id
  const getComplaintByPackId = (packId: string): Complaint | null => {
    return complaints.find(complaint => complaint.pack_id?.toString() === packId) || null;
  };

  return {
    complaints,
    complaintPackIds,
    claimMessages,
    isLoading,
    error,
    isComplaintPack,
    getComplaintByPackId,
    loadComplaintMessages
  };
}
