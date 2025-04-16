
import React, { useState } from 'react';
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComplaintsData } from '@/hooks/useComplaintsData';
import { useMetricsData } from '@/hooks/useMetricsData';
import { useReportGeneration } from '@/hooks/useReportGeneration';
import ComplaintsPopup from './metrics/ComplaintsPopup';
import MetricsSummaryCards from './metrics/MetricsSummaryCards';
import HermesChat from './metrics/HermesChat';

const MetricsDisplay = ({ 
  onOrderClick,
  sellerId
}: { 
  onOrderClick?: (orderId: string) => void,
  sellerId?: string | null
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [activeComplaintType, setActiveComplaintType] = useState<'prevented' | 'unprevented'>('prevented');
  
  const { complaintsData, loading: complaintsLoading, fetchComplaintsAvoidedList, fetchUnpreventedComplaintsList } = useComplaintsData();
  const { metrics, loading: metricsLoading } = useMetricsData(
    complaintsData.complaintsAvoided,
    complaintsData.unpreventedComplaints
  );
  const { generatingReport, handleReportButtonClick } = useReportGeneration();

  const handleOrderClick = (orderId: string) => {
    setShowPopup(false);
    if (activeComplaintType === 'prevented') {
      window.open(`https://www.mercadolivre.com.br/vendas/novo/mensagens/${orderId}`);
    } else {
      window.open(`https://www.mercadolivre.com.br/vendas/${orderId}/detalhe`);
    }
  };

  const handlePopupOpen = async (type: 'prevented' | 'unprevented') => {
    setActiveComplaintType(type);
    if (type === 'prevented') {
      await fetchComplaintsAvoidedList();
    } else {
      await fetchUnpreventedComplaintsList();
    }
    setShowPopup(true);
  };

  const isLoading = complaintsLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Métricas e Estatísticas</h1>
        <Button 
          onClick={handleReportButtonClick}
          disabled={generatingReport}
          className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {generatingReport ? "Gerando..." : "Gerar relatório Hermes"}
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <MetricsSummaryCards 
          complaintsAvoided={complaintsData.complaintsAvoided}
          totalMessages={metrics?.summary.totalMessages || 0}
          totalQuestions={metrics?.summary.totalQuestions || 0}
          unpreventedComplaints={complaintsData.unpreventedComplaints}
          onPreventedClick={() => handlePopupOpen('prevented')}
          onUnpreventedClick={() => handlePopupOpen('unprevented')}
        />

        <div className="mb-6 md:hidden">
          <Button 
            onClick={handleReportButtonClick}
            disabled={generatingReport}
            className="bg-amber-500 hover:bg-amber-600 text-white w-full flex items-center justify-center gap-2 py-3"
          >
            <Zap className="h-4 w-4" />
            {generatingReport ? "Gerando..." : "Gerar relatório Hermes"}
          </Button>
        </div>

        <div className="h-[500px] mt-8">
          <HermesChat sellerId={sellerId || null} />
        </div>
      </div>

      <ComplaintsPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        complaintsList={
          activeComplaintType === 'prevented' 
            ? complaintsData.preventedComplaintsList 
            : complaintsData.unpreventedComplaintsList
        }
        title={
          activeComplaintType === 'prevented' 
            ? 'Reclamações Evitadas' 
            : 'Reclamações não impedidas'
        }
        onOrderClick={handleOrderClick}
      />
    </div>
  );
};

export default MetricsDisplay;
