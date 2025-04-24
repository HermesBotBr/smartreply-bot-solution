
import React from 'react';
import { Star, ShoppingCart, AlertTriangle, MessageSquare, Percent, Shield } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ReputationResponse } from '@/types/metrics';

interface MetricsGridProps {
  reputation: ReputationResponse | null;
  reputationLoading: boolean;
  totalSales: number;
  salesLoading: boolean;
  totalComplaints: number;
  complaintsLoading: boolean;
  totalQueixas: number;
  totalProblems: number;
  complaintPercentage: number;
  avoidedComplaintsPercentage: number;
  tagsLoading: boolean;
  impactedComplaintsLoading: boolean;
  startDate?: Date;
  endDate?: Date;
}

export function MetricsGrid({
  reputation,
  reputationLoading,
  totalSales,
  salesLoading,
  totalComplaints,
  complaintsLoading,
  totalQueixas,
  totalProblems,
  complaintPercentage,
  avoidedComplaintsPercentage,
  tagsLoading,
  impactedComplaintsLoading,
  startDate,
  endDate,
}: MetricsGridProps) {
  // Define a consistent color gradient
  const baseGradient = "bg-gradient-to-br from-primary to-primary/80";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <MetricCard
        title="Reputação atual"
        value={reputation?.seller_reputation?.transactions?.ratings?.negative 
          ? `${(reputation.seller_reputation.transactions.ratings.negative * 100).toFixed(2)}%`
          : '-'
        }
        icon={Star}
        description="Reclamações/vendas dos últimos 6 meses"
        isLoading={reputationLoading}
        color={baseGradient}
        textColor="text-white"
      />
      
      <MetricCard
        title="Total de vendas"
        value={totalSales}
        icon={ShoppingCart}
        description={startDate && endDate ? 
          `De ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}` : 
          "Selecione um período"
        }
        isLoading={salesLoading}
        color={baseGradient}
        textColor="text-white"
      />
      
      <MetricCard
        title="Total de reclamações"
        value={totalComplaints}
        icon={AlertTriangle}
        description="Todas as reclamações no período"
        isLoading={complaintsLoading}
        color={baseGradient}
        textColor="text-white"
      />
      
      <MetricCard
        title="Total de queixas"
        value={totalQueixas}
        icon={MessageSquare}
        description="Mensagens com tags IH4002 ou PD4002"
        isLoading={tagsLoading || salesLoading}
        color={baseGradient}
        textColor="text-white"
      />
      
      <MetricCard
        title="Total de problemas"
        value={totalProblems}
        icon={AlertTriangle}
        description="Queixas + reclamações (sem duplicatas)"
        isLoading={complaintsLoading || tagsLoading || salesLoading}
        color={baseGradient}
        textColor="text-white"
      />
      
      <MetricCard
        title="% Reclamações/Vendas"
        value={`${complaintPercentage.toFixed(2)}%`}
        icon={Percent}
        description="Percentual de reclamações sobre o total de vendas"
        isLoading={complaintsLoading || salesLoading}
        color={baseGradient}
        textColor="text-white"
      />
      
      <MetricCard
        title="% Reclamações evitadas"
        value={`${avoidedComplaintsPercentage.toFixed(2)}%`}
        icon={Shield}
        description="Reclamações que não impactaram a reputação"
        isLoading={impactedComplaintsLoading}
        color={baseGradient}
        textColor="text-white"
      />
    </div>
  );
}
