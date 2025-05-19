import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { DateRangeFilterSection } from '@/components/dashboard/metrics/DateRangeFilterSection';
import { FinancialMetrics } from '@/components/financeiro/FinancialMetrics';
import { DataInput } from '@/components/financeiro/DataInput';
import { InventoryList } from '@/components/financeiro/InventoryList';
import { useNavigate } from 'react-router-dom';
import { useMlToken } from '@/hooks/useMlToken';
import { useSettlementData } from '@/hooks/useSettlementData';
import { useInventoryData } from '@/hooks/useInventoryData';
import { usePublicidadeData } from '@/hooks/usePublicidadeData';
import { toast } from '@/components/ui/use-toast';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAdminSalesData } from '@/hooks/useAdminSalesData';
import { parseBrazilianDate } from '@/lib/utils';

const AdminFinanceiro: React.FC = () => {
  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  const [releaseOperationsWithOrder, setReleaseOperationsWithOrder] = useState<ReleaseOperation[]>([]);
  const [releaseOtherOperations, setReleaseOtherOperations] = useState<ReleaseOperation[]>([]);

  const [firstPurchaseDate, setFirstPurchaseDate] = useState<string | null>(null);
  const [totalUnitsSoldSinceFirstPurchase, setTotalUnitsSoldSinceFirstPurchase] = useState<number>(0);

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const [settlementData, setSettlementData] = useState<string>('');
  const [releaseData, setReleaseData] = useState<string>('');

  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null);

  const { fetchSalesData, salesByItemId, detailedSales } = useAdminSalesData();

  useEffect(() => {
    const fetchReleaseData = async () => {
      try {
        const response = await fetch("https://projetohermes-dda7e0c8d836.herokuapp.com/releases.txt");
        if (!response.ok) throw new Error("Erro ao buscar release.txt");
        const text = await response.text();
        
        // Extract last update date from the fetched data
        const lastUpdateMatch = text.match(/LAST_UPDATE: (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
        if (lastUpdateMatch && lastUpdateMatch[1]) {
          const lastUpdate = lastUpdateMatch[1];
          // Format the date for display
          const date = new Date(lastUpdate);
          const formattedDate = `${date.toLocaleDateString('pt-BR')} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          setLastUpdateDate(formattedDate);
        }
        
        handleReleaseDataChange(text);
      } catch (error) {
        console.error("Erro ao carregar release.txt:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar os dados iniciais de liberações",
          variant: "destructive"
        });
      }
    };

    if (!releaseData) {
      fetchReleaseData();
    }
  }, []);

  // Add the state for the filter toggle
  const [filterBySettlement, setFilterBySettlement] = useState<boolean>(false);

  const [metrics, setMetrics] = useState({
    grossSales: 0,
    totalAmount: 0,
    unitsSold: 0,
    totalMLRepasses: 0,
    totalMLFees: 0,
    totalReleased: 0,
    totalClaims: 0,
    totalDebts: 0,
    totalTransfers: 0,
    totalCreditCard: 0,
    totalShippingCashback: 0,
    totalAdvertisingCost: 0, // New field for advertising cost
  });

  const [activeTab, setActiveTab] = useState<'metricas' | 'entrada' | 'estoque'>('metricas');

  /* ------------------------------------------------------------------ */
  /* hooks / data                                                        */
  /* ------------------------------------------------------------------ */
  const navigate = useNavigate();

  const mlToken = useMlToken();
  let sellerId = '681274853';
  if (mlToken && typeof mlToken === 'object' && 'seller_id' in mlToken) {
    sellerId = (mlToken as { seller_id: string }).seller_id;
  }

  const {
    settlementTransactions,
    totalGrossSales,
    totalNetSales,
    totalUnits,
    isLoading: settlementLoading,
    refetch: refetchSettlement,
  } = useSettlementData(sellerId, startDate, endDate, true);

  // Load inventory data when entering the page
  const { 
    items: inventoryItems, 
    isLoading: inventoryLoading, 
    error: inventoryError,
    refreshDates 
  } = useInventoryData(sellerId);

  useEffect(() => {
    let earliest: Date | null = null;
    let earliestStr: string | null = null;

    inventoryItems.forEach(item => {
      item.purchases.forEach(purchase => {
        const date = parseBrazilianDate(purchase.date);
        if (date && (!earliest || date < earliest)) {
          earliest = date;
          earliestStr = purchase.date;
        }
      });
    });

    if (earliestStr) {
      setFirstPurchaseDate(earliestStr);
    }
  }, [inventoryItems]);

  // Load advertising data
  const {
    data: advertisingData,
    isLoading: advertisingLoading,
    error: advertisingError,
    fetchPublicidadeData
  } = usePublicidadeData(sellerId);

  // Show toast if there's an inventory error
  useEffect(() => {
    if (inventoryError) {
      toast({
        title: "Erro",
        description: `Erro ao carregar dados de estoque: ${inventoryError.message}`,
        variant: "destructive"
      });
    }
  }, [inventoryError]);

  // Show toast if there's an advertising error
  useEffect(() => {
    if (advertisingError) {
      toast({
        title: "Erro",
        description: `Erro ao carregar dados de publicidade: ${advertisingError.message}`,
        variant: "destructive"
      });
    }
  }, [advertisingError]);

  // Calculate total advertising cost when data changes
  useEffect(() => {
    if (advertisingData && advertisingData.results) {
      const totalCost = advertisingData.results.reduce((sum, item) => 
        sum + (item.metrics.cost || 0), 0);
      
      setMetrics(prev => ({
        ...prev,
        totalAdvertisingCost: totalCost
      }));
    }
  }, [advertisingData]);

  // Reprocessar dados de release quando as datas mudarem
  useEffect(() => {
    if (releaseData && startDate && endDate) {
      console.log("Reprocessando dados de release devido à mudança de datas:", startDate, endDate);
      const parsed = parseReleaseData(releaseData, startDate, endDate);
      setMetrics((prev) => ({
        ...prev,
        totalReleased: parsed.totalReleased,
        totalClaims: parsed.totalClaims,
        totalDebts: parsed.totalDebts,
        totalTransfers: parsed.totalTransfers,
        totalCreditCard: parsed.totalCreditCard,
        totalShippingCashback: parsed.totalShippingCashback,
      }));
      setReleaseOperationsWithOrder(parsed.operationsWithOrder);
      setReleaseOtherOperations(parsed.otherOperations);
    }
  }, [startDate, endDate, releaseData]);

  /* ------------------------------------------------------------------ */
  /* handlers                                                            */
  /* ------------------------------------------------------------------ */
  const handleFilter = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Selecione um período válido",
        variant: "destructive"
      });
      return;
    }

    refetchSettlement();
    fetchPublicidadeData(startDate, endDate);

    if (releaseData) {
      const parsed = parseReleaseData(releaseData, startDate, endDate);
      setMetrics((prev) => ({
        ...prev,
        totalReleased: parsed.totalReleased,
        totalClaims: parsed.totalClaims,
        totalDebts: parsed.totalDebts,
        totalTransfers: parsed.totalTransfers,
        totalCreditCard: parsed.totalCreditCard,
        totalShippingCashback: parsed.totalShippingCashback,
      }));
    }

    toast({
      title: "Filtro aplicado",
      description: `Filtrando de ${startDate.toLocaleDateString()} até ${endDate.toLocaleDateString()}`
    });
  };

  const handleReleaseDataChange = (data: string) => {
    setReleaseData(data);
    // Save release data to localStorage for date lookups in inventory
    localStorage.setItem('releaseData', data);
    
    // Extract the last update date from the release data
    const lastUpdateMatch = data.match(/LAST_UPDATE: (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    if (lastUpdateMatch && lastUpdateMatch[1]) {
      const lastUpdate = lastUpdateMatch[1];
      // Format the date for display
      const date = new Date(lastUpdate);
      const formattedDate = `${date.toLocaleDateString('pt-BR')} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      setLastUpdateDate(formattedDate);
    } else {
      setLastUpdateDate(null);
    }
    
    const parsed = parseReleaseData(data, startDate, endDate);
    setMetrics((prev) => ({
      ...prev,
      totalReleased: parsed.totalReleased,
      totalClaims: parsed.totalClaims,
      totalDebts: parsed.totalDebts,
      totalTransfers: parsed.totalTransfers,
      totalCreditCard: parsed.totalCreditCard,
      totalShippingCashback: parsed.totalShippingCashback,
    }));
    setReleaseOperationsWithOrder(parsed.operationsWithOrder);
    setReleaseOtherOperations(parsed.otherOperations);
  };

  // New handler for refreshing advertising data
  const handleRefreshAdvertisingData = () => {
    if (startDate && endDate) {
      fetchPublicidadeData(startDate, endDate);
    }
  };

  const fetchSalesSinceFirstPurchase = async () => {
    if (!firstPurchaseDate) return;

    try {
      const today = new Date();
      const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
      const total = await fetchSalesData(sellerId, firstPurchaseDate, formattedToday);
      setTotalUnitsSoldSinceFirstPurchase(total);
    } catch (err) {
      console.error("Erro ao buscar vendas:", err);
      toast({
        title: "Erro",
        description: "Não foi possível buscar as vendas desde a primeira reposição.",
        variant: "destructive"
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* utils                                                               */
  /* ------------------------------------------------------------------ */
  const isDateInRange = (dateStr: string, start?: Date, end?: Date): boolean => {
    if (!start || !end) return true;
    const d = new Date(dateStr);
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    return d >= s && d <= e;
  };

  const parseReleaseData = (
    data: string,
    start?: Date,
    end?: Date,
  ): {
    totalReleased: number;
    totalClaims: number;
    totalDebts: number;
    totalTransfers: number;
    totalCreditCard: number;
    totalShippingCashback: number;
    operationsWithOrder: ReleaseOperation[];
    otherOperations: ReleaseOperation[];
  } => {
    try {
      console.log("Analisando dados de release com datas:", start?.toISOString(), end?.toISOString());
      
      const lines = data.split('\n').filter((l) => l.trim());
      if (lines.length < 3) {
        return {
          totalReleased: 0,
          totalClaims: 0,
          totalDebts: 0,
          totalTransfers: 0,
          totalCreditCard: 0,
          totalShippingCashback: 0,
          operationsWithOrder: [],
          otherOperations: [],
        };
      }

      const dataLines = lines.slice(2).filter((l) => !l.startsWith(',,,total'));

      const filtered = dataLines.filter((l) => {
        const cols = l.split(',');
        if (cols[4]?.includes('initial_available_balance')) return false;
        return isDateInRange(cols[0], start, end);
      });

      let totalReleased = 0,
        totalClaims = 0,
        totalDebts = 0,
        totalTransfers = 0,
        totalCreditCard = 0,
        totalShippingCashback = 0;

      interface BySource {
        creditAmount: number;
        debitAmount: number;
        descriptions: Record<
          string,
          { creditCount: number; debitCount: number }
        >;
        predominantDescription: string;
        sourceId: string; // Incluir sourceId para rastreamento
        date: string; // Adicionar data para filtragem
      }

      const operationsBySourceId: Record<string, BySource> = {};

      /* agrupar */
      filtered.forEach((line) => {
        const cols = line.split(',');
        const date = cols[0]; // Capturar a data
        const sourceId = cols[1];
        const desc = cols[4];
        const credit = parseFloat(cols[5]) || 0;
        const debit = parseFloat(cols[6]) || 0;

        if (!operationsBySourceId[sourceId]) {
          operationsBySourceId[sourceId] = {
            creditAmount: 0,
            debitAmount: 0,
            descriptions: {},
            predominantDescription: '',
            sourceId,  // Armazenar o sourceId
            date,      // Armazenar a data
          };
        }
        const op = operationsBySourceId[sourceId];
        op.creditAmount += credit;
        op.debitAmount += debit;

        if (!op.descriptions[desc]) {
          op.descriptions[desc] = { creditCount: 0, debitCount: 0 };
        }
        if (credit > 0) op.descriptions[desc].creditCount++;
        if (debit > 0) op.descriptions[desc].debitCount++;
      });

      /* predominância */
      Object.values(operationsBySourceId).forEach((op) => {
        const net = op.creditAmount - op.debitAmount;
        let best = '',
          max = 0;
        Object.entries(op.descriptions).forEach(([d, c]) => {
          const cnt = net >= 0 ? c.creditCount : c.debitCount;
          if (cnt > max) {
            max = cnt;
            best = d;
          }
        });
        op.predominantDescription = best;
      });

      /* totais */
      Object.values(operationsBySourceId).forEach((op) => {
        const net = op.creditAmount - op.debitAmount;
        switch (op.predominantDescription) {
          case 'payment':
            totalReleased += net;
            break;
          case 'reserve_for_debt_payment':
            totalDebts += net;
            break;
          case 'credit_payment':
            totalCreditCard += net;
            break;
          case 'reserve_for_dispute':
          case 'refund':
          case 'mediation':
          case 'reserve_for_bpp_shipping_return':
            totalClaims += net;
            break;
          case 'payout':
          case 'reserve_for_payout':
            totalTransfers += net;
            break;
          case 'shipping':
          case 'cashback':
            totalShippingCashback += net;
            break;
        }
      });

      /* listas para popup - usando lógica atualizada para considerar o agrupamento por sourceId */
      const operationsWithOrder: ReleaseOperation[] = [];
      const otherOperations: ReleaseOperation[] = [];

      Object.entries(operationsBySourceId).forEach(([sourceId, op]) => {
        const net = op.creditAmount - op.debitAmount;
        const line = filtered.find((l) => l.split(',')[1] === sourceId)!;
        const cols = line.split(',');
        const ref = cols[2],
          itm = cols[7],
          ttl = cols[8]?.replace(/"/g, '') || '';
        const desc = op.predominantDescription;
        const date = op.date; // Usar a data da operação

        if (desc === 'payment' && net > 0 && ref && itm) {
          operationsWithOrder.push({
            orderId: ref,
            itemId: itm,
            title: ttl || ref,
            amount: net,
            sourceId, // Incluir sourceId para rastreamento
            date,     // Incluir data para filtragem
          });
        } else if (net !== 0) {
          const key = desc || 'Sem descrição';
          otherOperations.push({ 
            description: key, 
            amount: net,
            sourceId, // Incluir sourceId para rastreamento
            date,     // Incluir data para filtragem
          });
        }
      });

      console.log(`Operações filtradas por data: ${operationsWithOrder.length} com orderId, ${otherOperations.length} outras`);
      
      return {
        totalReleased,
        totalClaims,
        totalDebts,
        totalTransfers,
        totalCreditCard,
        totalShippingCashback,
        operationsWithOrder,
        otherOperations,
      };
    } catch (error) {
      console.error('Error parsing release data:', error);
      return {
        totalReleased: 0,
        totalClaims: 0,
        totalDebts: 0,
        totalTransfers: 0,
        totalCreditCard: 0,
        totalShippingCashback: 0,
        operationsWithOrder: [],
        otherOperations: [],
      };
    }
  };

  /* ------------------------------------------------------------------ */
  /* side‑effects                                                        */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    // Agora usaremos totalGrossSales apenas como entrada, mas deixamos a métrica ser calculada
    // dentro do componente FinancialMetrics baseado nas transações reais
    setMetrics((prev) => ({
      ...prev,
      grossSales: totalGrossSales,
      totalAmount: totalGrossSales,
      unitsSold: totalUnits,
      totalMLRepasses: totalNetSales,
      totalMLFees: totalGrossSales - totalNetSales,
    }));
  }, [totalGrossSales, totalNetSales, totalUnits]);

  // Initial fetch of advertising data when component mounts
  useEffect(() => {
    if (startDate && endDate) {
      fetchPublicidadeData(startDate, endDate);
    }
  }, []);

  useEffect(() => {
    if (firstPurchaseDate) {
      fetchSalesSinceFirstPurchase();
    }
  }, [firstPurchaseDate]);

  /* ------------------------------------------------------------------ */
  /* render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Administração Financeira</h1>
        </div>

        <Tabs
          defaultValue="metricas"
          value={activeTab}
          onValueChange={(value: "metricas" | "entrada" | "estoque") => setActiveTab(value)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
            <TabsTrigger value="entrada">Entrada</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
          </TabsList>

          <TabsContent value="metricas" className="space-y-4 mt-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <DateRangeFilterSection
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onFilter={handleFilter}
                className="flex-grow"
                lastUpdateDate={lastUpdateDate || undefined}
              />
              <div className="flex items-center space-x-2 mt-2 md:mt-0 md:ml-4">
                <Switch
                  id="filter-by-settlement"
                  checked={filterBySettlement}
                  onCheckedChange={setFilterBySettlement}
                />
                <Label htmlFor="filter-by-settlement" className="text-sm font-medium">
                  Limitar liberações ao período
                </Label>
              </div>
            </div>

            <FinancialMetrics
              grossSales={metrics.grossSales}
              totalAmount={metrics.totalAmount}
              unitsSold={metrics.unitsSold}
              totalMLRepasses={metrics.totalMLRepasses}
              totalMLFees={metrics.totalMLFees}
              totalReleased={metrics.totalReleased}
              totalClaims={metrics.totalClaims}
              totalDebts={metrics.totalDebts}
              totalTransfers={metrics.totalTransfers}
              totalCreditCard={metrics.totalCreditCard}
              totalShippingCashback={metrics.totalShippingCashback}
              settlementTransactions={settlementTransactions}
              releaseOperationsWithOrder={releaseOperationsWithOrder}
              releaseOtherOperations={releaseOtherOperations}
              startDate={startDate}
              endDate={endDate}
              filterBySettlement={filterBySettlement}
              inventoryItems={inventoryItems}
              advertisingItems={advertisingData?.results || []}
              totalAdvertisingCost={metrics.totalAdvertisingCost}
              onRefreshAdvertisingData={handleRefreshAdvertisingData}
              sellerId={sellerId} // Pass sellerId to FinancialMetrics
            />
          </TabsContent>

          <TabsContent value="entrada" className="mt-4">
            <DataInput
              settlementData={settlementData}
              releaseData={releaseData}
              onSettlementDataChange={setSettlementData}
              onReleaseDataChange={handleReleaseDataChange}
              startDate={startDate}
              endDate={endDate}
              settlementTransactions={settlementTransactions}
              settlementLoading={settlementLoading}
            />
          </TabsContent>

          <TabsContent value="estoque" className="mt-4">
            <InventoryList 
              inventoryItems={inventoryItems || []} 
              isLoading={inventoryLoading} 
              onRefreshDates={refreshDates}
              firstPurchaseDate={firstPurchaseDate}
              totalUnitsSold={totalUnitsSoldSinceFirstPurchase}
              salesByItemId={salesByItemId}
              detailedSales={detailedSales}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFinanceiro;
