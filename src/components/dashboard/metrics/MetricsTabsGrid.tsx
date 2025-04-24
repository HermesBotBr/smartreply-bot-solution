import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ShoppingCart, AlertTriangle, MessageSquare, Percent, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricTab {
  key: string;
  label: string;
  icon: React.ElementType;
  value: string | number;
  description: string;
}

interface MetricsGridProps {
  reputation: any;
  totalSales: number;
  totalComplaints: number;
  totalQueixas: number;
  totalProblems: number;
  complaintPercentage: number;
  avoidedComplaintsPercentage: number;
  startDate?: Date;
  endDate?: Date;
}

export function MetricsGrid({
  reputation,
  totalSales,
  totalComplaints,
  totalQueixas,
  totalProblems,
  complaintPercentage,
  avoidedComplaintsPercentage,
  startDate,
  endDate,
}: MetricsGridProps) {
  const [selectedTab, setSelectedTab] = useState('reputation');

  const metrics: MetricTab[] = [
    {
      key: 'reputation',
      label: 'Reputação atual',
      icon: Star,
      value: reputation?.seller_reputation?.transactions?.ratings?.negative
        ? `${(reputation.seller_reputation.transactions.ratings.negative * 100).toFixed(2)}%`
        : '-',
      description: 'Reclamações/vendas dos últimos 6 meses',
    },
    {
      key: 'sales',
      label: 'Total de vendas',
      icon: ShoppingCart,
      value: totalSales,
      description: startDate && endDate
        ? `De ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`
        : 'Selecione um período',
    },
    {
      key: 'complaints',
      label: 'Total de reclamações',
      icon: AlertTriangle,
      value: totalComplaints,
      description: 'Todas as reclamações no período',
    },
    {
      key: 'queixas',
      label: 'Total de queixas',
      icon: MessageSquare,
      value: totalQueixas,
      description: 'Mensagens com tags IH4002 ou PD4002',
    },
    {
      key: 'problemas',
      label: 'Problemas totais',
      icon: AlertTriangle,
      value: totalProblems,
      description: 'Queixas + reclamações (sem duplicatas)',
    },
    {
      key: 'percReclamacoes',
      label: '% Reclamações/Vendas',
      icon: Percent,
      value: `${complaintPercentage.toFixed(2)}%`,
      description: 'Percentual de reclamações sobre o total de vendas',
    },
    {
      key: 'evitadas',
      label: '% Reclamações evitadas',
      icon: Shield,
      value: `${avoidedComplaintsPercentage.toFixed(2)}%`,
      description: 'Reclamações que não impactaram a reputação',
    },
  ];


const mockChartData = [
  { name: 'Item 1', valor: 18 },
  { name: 'Item 2', valor: 27 },
  { name: 'Item 3', valor: 23 },
  { name: 'Item 4', valor: 35 },
  { name: 'Item 5', valor: 33 },
];

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    const el = document.getElementById(`tab-${tab}`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <Tabs defaultValue="reputation" value={selectedTab} onValueChange={handleTabChange} className="space-y-4">

      
      {/* WRAPPER de tudo: abas + gráfico */}
<div className="overflow-x-auto scrollbar-hide p-4 bg-white rounded-xl shadow-md h-[480px] flex flex-col justify-between gap-y-4">
        
        {/* LISTA DE ABAS */}
        <TabsList className="mt-6 flex gap-2 snap-x snap-mandatory w-max">

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

        {/* GRÁFICO */}
        <div className="mt-4 w-full flex-1">
          {metrics.map(({ key, description }) => (
            <TabsContent key={key} value={key} className="h-full">
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
        </div>
      </div>
    </Tabs>
  );
}
