
import React, { useEffect } from 'react';
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReportGeneration } from '@/hooks/useReportGeneration';
import { getNgrokUrl } from '@/config/api';
import { toast } from "sonner";
import { NewMetricsDashboard } from './metrics/NewMetricsDashboard';

const MetricsDisplay = ({ 
  onOrderClick,
  sellerId
}: { 
  onOrderClick?: (orderId: string) => void,
  sellerId?: string | null
}) => {
  const { generatingReport, handleReportButtonClick } = useReportGeneration();

  // Efeito para limpar o histórico do GPT quando o componente é montado
  useEffect(() => {
    const clearChatHistory = async () => {
      if (!sellerId) return;
      
      try {
        const response = await fetch(getNgrokUrl('/clearHistory'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ seller_id: sellerId })
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Histórico de chat limpo com sucesso');
        } else {
          console.error('Erro ao limpar histórico de chat:', data.error || 'Erro desconhecido');
        }
      } catch (error) {
        console.error('Falha ao conectar com o serviço de limpeza de histórico:', error);
      }
    };
    
    clearChatHistory();
  }, [sellerId]);

  console.log("MetricsDisplay - sellerId:", sellerId); // Add logging to verify sellerId

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
        <NewMetricsDashboard sellerId={sellerId || null} />
        
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
      </div>
    </div>
  );
};

export default MetricsDisplay;
