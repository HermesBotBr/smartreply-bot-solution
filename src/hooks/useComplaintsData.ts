
import { useState, useEffect } from 'react';
import { getNgrokUrl } from '@/config/api';

export interface ComplaintsData {
  complaintsAvoided: number;
  unpreventedComplaints: number;
  preventedComplaintsList: string[];
  unpreventedComplaintsList: string[];
}

export function useComplaintsData() {
  const [complaintsData, setComplaintsData] = useState<ComplaintsData>({
    complaintsAvoided: 0,
    unpreventedComplaints: 0,
    preventedComplaintsList: [],
    unpreventedComplaintsList: [],
  });
  const [loading, setLoading] = useState(true);

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
    fetchUnpreventedComplaintsList
  };
}
