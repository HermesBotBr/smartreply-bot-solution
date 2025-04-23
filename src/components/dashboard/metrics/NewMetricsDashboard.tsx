import React, { useState, useEffect } from 'react';
import { Star, ShoppingCart, AlertTriangle, MessageSquare, Percent, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MetricCard } from './MetricCard';
import { DateRangePicker } from './DateRangePicker';
import { useReputationData } from '@/hooks/useReputationData';
import { useSalesData } from '@/hooks/useSalesData';
import { useComplaintsData } from '@/hooks/useComplaintsData';
import { useTagsData } from '@/hooks/useTagsData';
import { SalesItem, FilteredTag } from '@/types/metrics';
import HermesChat from './HermesChat';

interface NewMetricsDashboardProps {
  sellerId: string | null;
}

export function NewMetricsDashboard({ sellerId }: NewMetricsDashboardProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [fetchData, setFetchData] = useState(false);
  const [activeTab, setActiveTab] = useState("metrics");
  
  // Data hooks
  const { reputation, isLoading: reputationLoading } = useReputationData(sellerId);
  const { salesData, isLoading: salesLoading } = useSalesData(sellerId, startDate, endDate, fetchData);
  const { complaintsData, isLoading: complaintsLoading } = useComplaintsData(
    sellerId, startDate, endDate, false, fetchData
  );
  const { complaintsData: impactedComplaintsData, isLoading: impactedComplaintsLoading } = 
    useComplaintsData(sellerId, startDate, endDate, true, fetchData);
  const { filteredTags, isLoading: tagsLoading } = useTagsData(sellerId);
  
  // Derived metrics state
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalComplaints, setTotalComplaints] = useState<number>(0);
  const [totalQueixas, setTotalQueixas] = useState<number>(0);
  const [totalProblems, setTotalProblems] = useState<number>(0);
  const [complaintPercentage, setComplaintPercentage] = useState<number>(0);
  const [avoidedComplaintsPercentage, setAvoidedComplaintsPercentage] = useState<number>(0);
  
  const isLoading = reputationLoading || salesLoading || complaintsLoading || 
                    impactedComplaintsLoading || tagsLoading;
                    
  // Filter sales by date range and calculate total sales
  useEffect(() => {
    if (salesData && salesData.sales) {
      const total = salesData.sales.reduce((acc, item) => acc + item.total_sales, 0);
      setTotalSales(total);
    }
  }, [salesData]);

  // Calculate total complaints
  useEffect(() => {
    if (complaintsData && complaintsData.complaints) {
      setTotalComplaints(complaintsData.complaints.length);
    }
  }, [complaintsData]);
  
  // Calculate complaints with reputation impact
  useEffect(() => {
    if (impactedComplaintsData && impactedComplaintsData.complaints && totalComplaints > 0) {
      const percentage = ((totalComplaints - impactedComplaintsData.complaints.length) / totalComplaints) * 100;
      setAvoidedComplaintsPercentage(percentage);
    }
  }, [impactedComplaintsData, totalComplaints]);
  
  // Calculate complaint percentage
  useEffect(() => {
    if (totalSales > 0 && totalComplaints > 0) {
      setComplaintPercentage((totalComplaints / totalSales) * 100);
    }
  }, [totalSales, totalComplaints]);
  
  // Calculate queixas based on sales data and tags
  useEffect(() => {
    if (!salesData || !salesData.sales || !filteredTags.length) return;
    
    const orderIds = salesData.sales.flatMap(
      (item: SalesItem) => item.orders.map(order => order.order_id.toString())
    );
    
    // Check which filtered tags contain the target tags and are in our sales period
    const matchingTags = filteredTags.filter(tag => {
      return orderIds.includes(tag.orderId) && 
             (tag.tags.includes('IH4002') || tag.tags.includes('PD4002'));
    });
    
    setTotalQueixas(matchingTags.length);
  }, [salesData, filteredTags]);
  
  // Calculate total problems (queixas + complaints)
  useEffect(() => {
    // Use a Set to ensure no duplicate order IDs
    if (complaintsData && complaintsData.complaints) {
      const complaintOrderIds = new Set(
        complaintsData.complaints.map(complaint => complaint.order_id.toString())
      );
      
      const queixaOrderIds = new Set(
        filteredTags
          .filter(tag => tag.tags.includes('IH4002') || tag.tags.includes('PD4002'))
          .map(tag => tag.orderId)
      );
      
      // Combine both sets and count unique entries
      const allProblemOrderIds = new Set([...complaintOrderIds, ...queixaOrderIds]);
      setTotalProblems(allProblemOrderIds.size);
    }
  }, [complaintsData, filteredTags]);
  
  const handleFilter = () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione um período válido");
      return;
    }
    setFetchData(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-bold">Métricas e Estatísticas</h2>
        <Button variant="outline" onClick={handleFilter}>
          Filtrar
        </Button>
      </div>

      <div className="bg-card p-4 rounded-lg mb-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-medium">Período de análise</h3>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="metrics">Métricas de Vendas</TabsTrigger>
          <TabsTrigger value="hermes">Hermes Assistente</TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Reputação atual"
              value={reputation?.seller_reputation?.transactions?.ratings?.negative 
                ? `${(reputation.seller_reputation.transactions.ratings.negative * 100).toFixed(2)}%`
                : '-'
              }
              icon={Star}
              description="Reclamações/vendas dos últimos 6 meses"
              isLoading={reputationLoading}
              color="bg-emerald-500"
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
              color="bg-blue-500"
              textColor="text-white"
            />
            
            <MetricCard
              title="Total de reclamações"
              value={totalComplaints}
              icon={AlertTriangle}
              description="Todas as reclamações no período"
              isLoading={complaintsLoading}
              color="bg-red-500"
              textColor="text-white"
            />
            
            <MetricCard
              title="Total de queixas"
              value={totalQueixas}
              icon={MessageSquare}
              description="Mensagens com tags IH4002 ou PD4002"
              isLoading={tagsLoading || salesLoading}
              color="bg-orange-500"
              textColor="text-white"
            />
            
            <MetricCard
              title="Total de problemas"
              value={totalProblems}
              icon={AlertTriangle}
              description="Queixas + reclamações (sem duplicatas)"
              isLoading={complaintsLoading || tagsLoading || salesLoading}
              color="bg-purple-500"
              textColor="text-white"
            />
            
            <MetricCard
              title="% Reclamações/Vendas"
              value={`${complaintPercentage.toFixed(2)}%`}
              icon={Percent}
              description="Percentual de reclamações sobre o total de vendas"
              isLoading={complaintsLoading || salesLoading}
              color="bg-indigo-500"
              textColor="text-white"
            />
            
            <MetricCard
              title="% Reclamações evitadas"
              value={`${avoidedComplaintsPercentage.toFixed(2)}%`}
              icon={Shield}
              description="Reclamações que não impactaram a reputação"
              isLoading={impactedComplaintsLoading}
              color="bg-teal-500"
              textColor="text-white"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="hermes">
          <div className="h-[600px]">
            <HermesChat sellerId={sellerId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
