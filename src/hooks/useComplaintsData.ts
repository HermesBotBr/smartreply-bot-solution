
import { useState, useEffect } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';

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

// Function to convert a complaint message to a standard message format
export const convertComplaintMessageToStandard = (
  complaintMsg: ComplaintMessage,
  sellerId: string,
  claim_id: number
): any => {
  // Determine if the seller is the sender or receiver
  const isSeller = complaintMsg.sender_role === 'respondent';
  
  // Create a unique ID for the message
  const uniqueId = `claim-${claim_id}-${complaintMsg.hash}`;
  
  // For simplicity, we'll assume buyer_id is 0 when not known
  // In a real app, we might want to store this information somewhere
  const buyerId = 0;
  
  return {
    id: uniqueId,
    from: {
      user_id: isSeller ? parseInt(sellerId) : buyerId
    },
    to: {
      user_id: isSeller ? buyerId : parseInt(sellerId)
    },
    text: complaintMsg.message,
    message_date: {
      received: complaintMsg.message_date,
      available: complaintMsg.message_date,
      notified: complaintMsg.message_date,
      created: complaintMsg.message_date,
      read: complaintMsg.date_read || null
    },
    message_attachments: complaintMsg.attachments?.length ? 
      complaintMsg.attachments.map(att => ({ filename: att })) : 
      null,
    // Add a flag to identify this as a complaint message
    is_complaint_message: true
  };
};

export function useComplaintsData(sellerId: string | null) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complaintMessages, setComplaintMessages] = useState<{[key: string]: any[]}>({});

  // Fetch complaints for a seller
  useEffect(() => {
    if (!sellerId) return;

    const fetchComplaints = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${NGROK_BASE_URL}/reclama`, {
          params: { seller_id: sellerId }
        });
        
        if (response.data) {
          console.log(`Encontradas ${response.data.length} reclamações para o vendedor ${sellerId}`);
          setComplaints(response.data);
        } else {
          setError('Formato de resposta inválido do endpoint de reclamações');
        }
      } catch (error) {
        console.error('Erro ao buscar reclamações:', error);
        setError('Falha ao carregar reclamações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, [sellerId]);

  // Function to fetch complaint messages for a specific complaint
  const fetchComplaintMessages = async (complaint: Complaint) => {
    if (!sellerId) return [];
    
    // Skip if we already have messages for this complaint
    const complaintKey = `claim-${complaint.claim_id}`;
    if (complaintMessages[complaintKey]?.length) {
      return complaintMessages[complaintKey];
    }
    
    try {
      // First, try to get regular messages if pack_id exists
      let regularMessages: any[] = [];
      if (complaint.pack_id) {
        try {
          const regularResponse = await axios.get(`${NGROK_BASE_URL}/conversas`, {
            params: {
              seller_id: sellerId,
              pack_id: complaint.pack_id,
              limit: 3000,
              offset: 0
            }
          });
          
          if (regularResponse.data && Array.isArray(regularResponse.data.messages)) {
            regularMessages = regularResponse.data.messages;
            console.log(`Encontradas ${regularMessages.length} mensagens regulares para o pack_id ${complaint.pack_id}`);
          }
        } catch (error) {
          console.warn(`Erro ao buscar mensagens regulares para pack_id ${complaint.pack_id}:`, error);
        }
      }
      
      // Next, get complaint-specific messages
      let claimMessages: any[] = [];
      try {
        const claimResponse = await axios.get(`${NGROK_BASE_URL}/conversas_rec`, {
          params: {
            seller_id: sellerId,
            claim_id: complaint.claim_id
          }
        });
        
        if (claimResponse.data && Array.isArray(claimResponse.data)) {
          // Convert complaint messages to standard format
          claimMessages = claimResponse.data.map((msg: ComplaintMessage) => 
            convertComplaintMessageToStandard(msg, sellerId, complaint.claim_id)
          );
          console.log(`Encontradas ${claimMessages.length} mensagens de reclamação para o claim_id ${complaint.claim_id}`);
        }
      } catch (error) {
        console.warn(`Erro ao buscar mensagens de reclamação para claim_id ${complaint.claim_id}:`, error);
      }
      
      // Combine both types of messages
      const allMessages = [...regularMessages, ...claimMessages].sort((a, b) => {
        const dateA = new Date(a.message_date.created).getTime();
        const dateB = new Date(b.message_date.created).getTime();
        return dateA - dateB;
      });
      
      // Update state
      setComplaintMessages(prev => ({
        ...prev,
        [complaintKey]: allMessages
      }));
      
      return allMessages;
    } catch (error) {
      console.error(`Erro ao buscar mensagens para a reclamação ${complaint.claim_id}:`, error);
      return [];
    }
  };

  return {
    complaints,
    isLoading,
    error,
    complaintMessages,
    fetchComplaintMessages
  };
}
