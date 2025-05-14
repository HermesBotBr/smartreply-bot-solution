
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DateRangeFilterSection } from './DateRangeFilterSection';
import { MetricsGrid } from './MetricsTabsGrid';
import HermesChat from './HermesChat';
import { useReputationData } from '@/hooks/useReputationData';
import { useSalesData } from '@/hooks/useSalesData';
import { useComplaintsData } from '@/hooks/useComplaintsData';
import { useTagsData } from '@/hooks/useTagsData';
import { SalesItem, FilteredTag } from '@/types/metrics';

interface NewMetricsDashboardProps {
  sellerId: string | null;
}

export function NewMetricsDashboard({ sellerId }: NewMetricsDashboardProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("metrics");
  
  // Data fetching hooks
  const { reputation, isLoading: reputationLoading } = useReputationData(sellerId);
  const { salesData, isLoading: salesLoading, refetch: refetchSales } = useSalesData(sellerId, startDate, endDate);
  const { complaintsData, isLoading: complaintsLoading, refetch: refetchComplaints } = useComplaintsData(
    sellerId, startDate, endDate, false
  );
  const { complaintsData: impactedComplaintsData, isLoading: impactedComplaintsLoading, refetch: refetchImpactedComplaints } = 
    useComplaintsData(sellerId, startDate, endDate, true);
  const { filteredTags, isLoading: tagsLoading, refetch: refetchTags } = useTagsData(sellerId);

  // Derived state
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalComplaints, setTotalComplaints] = useState<number>(0);
  const [totalQueixas, setTotalQueixas] = useState<number>(0);
  const [totalProblems, setTotalProblems] = useState<number>(0);
  const [complaintPercentage, setComplaintPercentage] = useState<number>(0);
  const [avoidedComplaintsPercentage, setAvoidedComplaintsPercentage] = useState<number>(0);
  
  // Effects for data calculations
  useEffect(() => {
    if (salesData && salesData.sales) {
      const total = salesData.sales.reduce((acc, item) => acc + item.total_sales, 0);
      setTotalSales(total);
    }
  }, [salesData]);

  useEffect(() => {
    if (complaintsData && complaintsData.complaints) {
      setTotalComplaints(complaintsData.complaints.length);
    }
  }, [complaintsData]);
  
  useEffect(() => {
    if (impactedComplaintsData && impactedComplaintsData.complaints && totalComplaints > 0) {
      const percentage = ((totalComplaints - impactedComplaintsData.complaints.length) / totalComplaints) * 100;
      setAvoidedComplaintsPercentage(percentage);
    }
  }, [impactedComplaintsData, totalComplaints]);
  
  useEffect(() => {
    if (totalSales > 0 && totalComplaints > 0) {
      setComplaintPercentage((totalComplaints / totalSales) * 100);
    }
  }, [totalSales, totalComplaints]);
  
  useEffect(() => {
    if (!salesData?.sales || !filteredTags.length) return;
    
    const orderIds = salesData.sales.flatMap(
      (item: SalesItem) => item.orders.map(order => order.order_id.toString())
    );
    
    const matchingTags = filteredTags.filter(tag => {
      return orderIds.includes(tag.orderId) && 
             (tag.tags.includes('IH4002') || tag.tags.includes('PD4002'));
    });
    
    setTotalQueixas(matchingTags.length);
  }, [salesData, filteredTags]);
  
  useEffect(() => {
    if (complaintsData?.complaints) {
      const complaintOrderIds = new Set(
        complaintsData.complaints.map(complaint => complaint.order_id.toString())
      );
      
      const queixaOrderIds = new Set(
        filteredTags
          .filter(tag => tag.tags.includes('IH4002') || tag.tags.includes('PD4002'))
          .map(tag => tag.orderId)
      );
      
      const allProblemOrderIds = new Set([...complaintOrderIds, ...queixaOrderIds]);
      setTotalProblems(allProblemOrderIds.size);
    }
  }, [complaintsData, filteredTags]);
  
  const handleFilter = async () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione um período válido");
      return;
    }

    try {
      await Promise.all([
        refetchSales(),
        refetchComplaints(),
        refetchImpactedComplaints(),
        refetchTags(),
      ]);
    } catch (error) {
      toast.error("Erro ao buscar os dados. Tente novamente.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-bold">Métricas e Estatísticas</h2>
      </div>

      <DateRangeFilterSection 
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFilter={handleFilter}
      />

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="metrics">Métricas de Vendas</TabsTrigger>
          <TabsTrigger value="hermes">Hermes Assistente</TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics">
          <MetricsGrid 
            reputation={reputation}
            reputationLoading={reputationLoading}
            totalSales={totalSales}
            salesLoading={salesLoading}
            totalComplaints={totalComplaints}
            complaintsLoading={complaintsLoading}
            totalQueixas={totalQueixas}
            totalProblems={totalProblems}
            complaintPercentage={complaintPercentage}
            avoidedComplaintsPercentage={avoidedComplaintsPercentage}
            tagsLoading={tagsLoading}
            impactedComplaintsLoading={impactedComplaintsLoading}
            startDate={startDate}
            endDate={endDate}
          />
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
