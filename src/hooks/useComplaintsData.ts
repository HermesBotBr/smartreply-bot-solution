
import { useState, useEffect } from 'react';
import { getNgrokUrl } from '@/config/api';
import axios from 'axios';

export interface ComplaintsData {
  complaintsAvoided: number;
  unpreventedComplaints: number;
  preventedComplaintsList: string[];
  unpreventedComplaintsList: string[];
}

export interface Complaint {
  order_id: number;
  pack_id: string | null;
  claim_id: number;
  reason_id: string;
  motivo_reclamacao: string;
  afetou_reputacao: string;
  data_criada: string;
}

export function useComplaintsData() {
  const [complaintsData, setComplaintsData] = useState<ComplaintsData>({
    complaintsAvoided: 0,
    unpreventedComplaints: 0,
    preventedComplaintsList: [],
    unpreventedComplaintsList: [],
  });
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [error, setError] = useState<string>('');
  const [complaintMessages, setComplaintMessages] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const complaintsAvoided = await fetchComplaintsAvoidedCount();
        const unpreventedComplaints = await fetchUnpreventedComplaintsCount();
        
        setComplaintsData({
          complaintsAvoided,
          unpreventedComplaints,
          preventedComplaintsList: [],
          unpreventedComplaintsList: [],
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching complaints data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchComplaintMessages = async (complaint: Complaint) => {
    if (!complaint.pack_id || !complaint.claim_id) {
      return [];
    }
    
    try {
      // Combine messages from both regular and complaint endpoints
      const regularMessages = await fetchRegularMessages(complaint.pack_id);
      const claimMessages = await fetchClaimMessages(complaint.claim_id);
      
      const combinedMessages = [...regularMessages, ...claimMessages].sort((a, b) => {
        const dateA = new Date(a.message_date?.created || a.message_date);
        const dateB = new Date(b.message_date?.created || b.message_date);
        return dateA.getTime() - dateB.getTime();
      });
      
      setComplaintMessages(prev => ({
        ...prev,
        [complaint.claim_id]: combinedMessages
      }));
      
      return combinedMessages;
    } catch (error) {
      console.error("Error fetching complaint messages:", error);
      return [];
    }
  };

  const fetchRegularMessages = async (packId: string) => {
    try {
      const response = await axios.get(`${getNgrokUrl('')}/conversas`, {
        params: {
          seller_id: getSellerId(),
          pack_id: packId,
          limit: 3000,
          offset: 0
        }
      });
      
      if (response.data && Array.isArray(response.data.messages)) {
        return response.data.messages;
      }
      return [];
    } catch (error) {
      console.error("Error fetching regular messages:", error);
      return [];
    }
  };

  const fetchClaimMessages = async (claimId: number) => {
    try {
      const response = await axios.get(`${getNgrokUrl('')}/conversas_rec`, {
        params: {
          seller_id: getSellerId(),
          claim_id: claimId
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Transform claim messages to have a similar structure as regular messages
        return response.data.map((msg: any) => ({
          ...msg,
          id: msg.hash,
          from: {
            user_id: msg.sender_role === 'complainant' ? 'buyer' : getSellerId()
          },
          to: {
            user_id: msg.receiver_role === 'complainant' ? 'buyer' : getSellerId()
          },
          text: msg.message,
          isClaimMessage: true
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching claim messages:", error);
      return [];
    }
  };

  const getSellerId = () => {
    const auth = localStorage.getItem('hermesAuth');
    if (auth) {
      try {
        const authData = JSON.parse(auth);
        return authData.sellerId;
      } catch (error) {
        console.error("Error parsing auth data:", error);
      }
    }
    return null;
  };

  const fetchComplaintsAvoidedList = async () => {
    try {
      const response = await fetch(getNgrokUrl('all_tags.txt'));
      const text = await response.text();
      const sections = text.split('\n\n');
      let orders: string[] = [];
      sections.forEach(section => {
        if (section.startsWith('GPT impediu reclamação')) {
          const lines = section.split('\n').slice(1);
          orders = lines.filter(line => line.trim() !== '').map(line => {
            const parts = line.split(' - ');
            return parts[0].trim();
          });
        }
      });
      
      setComplaintsData(prev => ({
        ...prev,
        preventedComplaintsList: orders
      }));
      
      return orders;
    } catch (error) {
      console.error("Erro ao buscar lista de tags:", error);
      return [];
    }
  };

  const fetchUnpreventedComplaintsList = async () => {
    try {
      const response = await fetch(getNgrokUrl('all_tags.txt'));
      const text = await response.text();
      const sections = text.split('\n\n');
      let orders: string[] = [];
      sections.forEach(section => {
        if (section.startsWith('Reclamação no Mercado Livre')) {
          const lines = section.split('\n').slice(1);
          orders = lines.filter(line => line.trim() !== '');
        }
      });
      
      setComplaintsData(prev => ({
        ...prev,
        unpreventedComplaintsList: orders
      }));
      
      return orders;
    } catch (error) {
      console.error("Erro ao buscar lista de reclamações não impedidas:", error);
      return [];
    }
  };

  const fetchComplaintsAvoidedCount = async () => {
    try {
      const response = await fetch(getNgrokUrl('all_tags.txt'));
      const text = await response.text();
      const sections = text.split('\n\n');
      let complaintsCount = 0;
      sections.forEach(section => {
        if (section.startsWith('GPT impediu reclamação')) {
          const lines = section.split('\n').slice(1);
          complaintsCount = lines.filter(line => line.trim() !== '').length;
        }
      });
      return complaintsCount;
    } catch (error) {
      console.error("Erro ao buscar tags:", error);
      return 0;
    }
  };

  const fetchUnpreventedComplaintsCount = async () => {
    try {
      const response = await fetch(getNgrokUrl('all_tags.txt'));
      const text = await response.text();
      const sections = text.split('\n\n');
      let complaintsCount = 0;
      sections.forEach(section => {
        if (section.startsWith('Reclamação no Mercado Livre')) {
          const lines = section.split('\n').slice(1);
          complaintsCount = lines.filter(line => line.trim() !== '').length;
        }
      });
      return complaintsCount;
    } catch (error) {
      console.error("Erro ao buscar tags de reclamações não impedidas:", error);
      return 0;
    }
  };

  return {
    complaintsData,
    loading,
    fetchComplaintsAvoidedList,
    fetchUnpreventedComplaintsList,
    complaints,
    isLoading: loading,
    error,
    complaintMessages,
    fetchComplaintMessages
  };
}
