
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ShoppingCart, AlertTriangle, MessageSquare, Percent, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const mockChartData = [
  { name: 'Item 1', valor: 18 },
  { name: 'Item 2', valor: 27 },
  { name: 'Item 3', valor: 23 },
  { name: 'Item 4', valor: 35 },
  { name: 'Item 5', valor: 33 },
];

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
  endDate
}: MetricsGridProps) {
  const [selectedTab, setSelectedTab] = useState('reputation');

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    // Rola suavemente o card selecionado até o centro
    const el = document.getElementById(`tab-${tab}`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };
  
  // Format date range for display
  const dateRangeText = startDate && endDate 
    ? `De ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`
    : 'Período não selecionado';

  const metrics = [
    {
      key: 'reputation',
      label: 'Reputação atual',
      icon: Star,
      value: reputationLoading ? 'Carregando...' : `${reputation?.seller_reputation?.metrics?.claims?.rate.toFixed(2) || '0.00'}%`,
      description: 'Reclamações/vendas dos últimos 6 meses',
    },
    {
      key: 'sales',
      label: 'Total de vendas',
      icon: ShoppingCart,
      value: salesLoading ? 'Carregando...' : totalSales,
      description: dateRangeText,
    },
    {
      key: 'complaints',
      label: 'Total de reclamações',
      icon: AlertTriangle,
      value: complaintsLoading ? 'Carregando...' : totalComplaints,
      description: 'Todas as reclamações no período',
    },
    {
      key: 'queixas',
      label: 'Total de queixas',
      icon: MessageSquare,
      value: tagsLoading ? 'Carregando...' : totalQueixas,
      description: 'Mensagens com tags IH4002 ou PD4002',
    },
    {
      key: 'problemas',
      label: 'Total de problemas',
      icon: AlertTriangle,
      value: complaintsLoading || tagsLoading ? 'Carregando...' : totalProblems,
      description: 'Queixas + reclamações (sem duplicatas)',
    },
    {
      key: 'percReclamacoes',
      label: '% Reclamações/Vendas',
      icon: Percent,
      value: salesLoading || complaintsLoading ? 'Carregando...' : `${complaintPercentage.toFixed(2)}%`,
      description: 'Percentual de reclamações sobre o total de vendas',
    },
    {
      key: 'evitadas',
      label: '% Reclamações evitadas',
      icon: Shield,
      value: impactedComplaintsLoading ? 'Carregando...' : `${avoidedComplaintsPercentage.toFixed(2)}%`,
      description: 'Reclamações que não impactaram a reputação',
    },
  ];

  return (
    <Tabs defaultValue="reputation" value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="overflow-x-auto flex gap-2 pb-6 z-10 relative scrollbar-hide snap-x snap-mandatory">
        {metrics.map(({ key, label, icon: Icon, value }) => (
          <TabsTrigger
            key={key}
            value={key}
            id={`tab-${key}`}
            className="min-w-[200px] snap-start flex-col items-start py-4 px-5 bg-primary text-white rounded-2xl hover:opacity-90 data-[state=active]:bg-primary/80"
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-sm font-medium">{label}</span>
              <Icon className="w-4 h-4 text-white/70" />
            </div>
            <div className="mt-1 text-xl font-bold">{value}</div>
          </TabsTrigger>
        ))}
      </TabsList>

      {metrics.map(({ key, description }) => (
        <TabsContent key={key} value={key} className="bg-white/20 p-4 rounded-xl shadow-inner">
          <p className="mb-2 text-sm text-muted-foreground">{description}</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="valor" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
