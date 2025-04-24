
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
        color="bg-gradient-to-br from-emerald-500 to-emerald-600"
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
        color="bg-gradient-to-br from-blue-500 to-blue-600"
        textColor="text-white"
      />
      
      <MetricCard
        title="Total de reclamações"
        value={totalComplaints}
        icon={AlertTriangle}
        description="Todas as reclamações no período"
        isLoading={complaintsLoading}
        color="bg-gradient-to-br from-orange-500 to-orange-600"
        textColor="text-white"
      />
      
      <MetricCard
        title="Total de queixas"
        value={totalQueixas}
        icon={MessageSquare}
        description="Mensagens com tags IH4002 ou PD4002"
        isLoading={tagsLoading || salesLoading}
        color="bg-gradient-to-br from-purple-500 to-purple-600"
        textColor="text-white"
      />
      
      <MetricCard
        title="Total de problemas"
        value={totalProblems}
        icon={AlertTriangle}
        description="Queixas + reclamações (sem duplicatas)"
        isLoading={complaintsLoading || tagsLoading || salesLoading}
        color="bg-gradient-to-br from-red-500 to-red-600"
        textColor="text-white"
      />
      
      <MetricCard
        title="% Reclamações/Vendas"
        value={`${complaintPercentage.toFixed(2)}%`}
        icon={Percent}
        description="Percentual de reclamações sobre o total de vendas"
        isLoading={complaintsLoading || salesLoading}
        color="bg-gradient-to-br from-indigo-500 to-indigo-600"
        textColor="text-white"
      />
      
      <MetricCard
        title="% Reclamações evitadas"
        value={`${avoidedComplaintsPercentage.toFixed(2)}%`}
        icon={Shield}
        description="Reclamações que não impactaram a reputação"
        isLoading={impactedComplaintsLoading}
        color="bg-gradient-to-br from-teal-500 to-teal-600"
        textColor="text-white"
      />
    </div>
  );
}
