
import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CalendarRange, 
  ShoppingCart, 
  AlertTriangle, 
  MessageSquare,
  Percent,
  Shield
} from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';

interface NewMetricsDashboardProps {
  sellerId: string | null;
}

export function NewMetricsDashboard({ sellerId }: NewMetricsDashboardProps) {
  // Date range state
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [fetchData, setFetchData] = useState(false);
  
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
  
  // Handle filter button click
  const handleFilter = () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione um período válido");
      return;
    }
    
    setFetchData(true);
  };
  
  // Reputation level color mapping
  const getReputationColor = (levelId: string | undefined) => {
    if (!levelId) return 'bg-gray-500';
    
    const colorMap: Record<string, string> = {
      '1_red': 'bg-red-500',
      '2_orange': 'bg-orange-500',
      '3_yellow': 'bg-yellow-500',
      '4_light_green': 'bg-lime-500',
      '5_green': 'bg-green-500'
    };
    
    return colorMap[levelId] || 'bg-gray-500';
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-6">Métricas e Estatísticas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box 1: Reputação atual */}
        <MetricCard
          title="Reputação atual"
          value={reputation?.seller_reputation?.transactions?.ratings?.negative 
            ? `${(reputation.seller_reputation.transactions.ratings.negative * 100).toFixed(2)}%`
            : '-'
          }
          icon={Star}
          description="Reclamações/vendas dos últimos 6 meses"
          isLoading={reputationLoading}
          color={getReputationColor(reputation?.seller_reputation?.level_id)}
        />
        
        {/* Box 2: Filtro de data */}
        <Card className="col-span-1 md:col-span-2">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-grow">
                <h3 className="text-sm font-medium mb-2">Período de análise</h3>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>
              <Button 
                className="mt-2" 
                onClick={handleFilter}
                disabled={!startDate || !endDate || isLoading}
              >
                {isLoading ? "Carregando..." : "Filtrar"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Box 3: Total de compras do período */}
        <MetricCard
          title="Total de vendas"
          value={totalSales}
          icon={ShoppingCart}
          description={startDate && endDate ? 
            `De ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}` : 
            "Selecione um período"
          }
          isLoading={salesLoading}
          color="bg-blue-600"
        />
        
        {/* Box 4: Total de reclamações do período */}
        <MetricCard
          title="Total de reclamações"
          value={totalComplaints}
          icon={AlertTriangle}
          description="Todas as reclamações no período"
          isLoading={complaintsLoading}
          color="bg-red-600"
        />
        
        {/* Box 5: Total de queixas */}
        <MetricCard
          title="Total de queixas"
          value={totalQueixas}
          icon={MessageSquare}
          description="Mensagens com tags IH4002 ou PD4002"
          isLoading={tagsLoading || salesLoading}
          color="bg-orange-500"
        />
        
        {/* Box 6: Total de problemas */}
        <MetricCard
          title="Total de problemas"
          value={totalProblems}
          icon={AlertTriangle}
          description="Queixas + reclamações (sem duplicatas)"
          isLoading={complaintsLoading || tagsLoading || salesLoading}
          color="bg-purple-600"
        />
        
        {/* Box 7: Porcentagem de reclamações sobre vendas */}
        <MetricCard
          title="% Reclamações/Vendas"
          value={`${complaintPercentage.toFixed(2)}%`}
          icon={Percent}
          description="Percentual de reclamações sobre o total de vendas"
          isLoading={complaintsLoading || salesLoading}
          color="bg-indigo-600"
        />
        
        {/* Box 8: Porcentagem de reclamações evitadas */}
        <MetricCard
          title="% Reclamações evitadas"
          value={`${avoidedComplaintsPercentage.toFixed(2)}%`}
          icon={Shield}
          description="Reclamações que não impactaram a reputação"
          isLoading={impactedComplaintsLoading}
          color="bg-emerald-600"
        />
      </div>
      
      {/* Hermes Chat section */}
      <div className="mt-12 h-[600px]">
        <h3 className="text-xl font-semibold mb-4">Hermes Assistente</h3>
        <HermesChat sellerId={sellerId} />
      </div>
    </div>
  );
}
