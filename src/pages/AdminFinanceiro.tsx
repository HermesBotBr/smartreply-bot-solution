
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { DateRangeFilterSection } from '@/components/dashboard/metrics/DateRangeFilterSection';
import { FinancialMetrics } from '@/components/financeiro/FinancialMetrics';
import { DataInput } from '@/components/financeiro/DataInput';
import { InventoryList } from '@/components/financeiro/InventoryList';
import { useNavigate } from 'react-router-dom';
import { useMlToken, MlTokenType } from '@/hooks/useMlToken';
import { useSettlementData } from '@/hooks/useSettlementData';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useReleaseData } from '@/hooks/useReleaseData';
import { useReleaseLineData } from '@/hooks/useReleaseLineData';
import { toast } from '@/components/ui/use-toast';
import { ReleaseOperation } from '@/types/ReleaseOperation';

const AdminFinanceiro: React.FC = () => {
  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  const [releaseOperationsWithOrder, setReleaseOperationsWithOrder] =
    useState<ReleaseOperation[]>([]);
  const [releaseOtherOperations, setReleaseOtherOperations] = useState<
    ReleaseOperation[]
  >([]);

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const [settlementData, setSettlementData] = useState<string>('');
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
  });

  const [activeTab, setActiveTab] = useState<'metricas' | 'entrada' | 'estoque'>('metricas');

  /* ------------------------------------------------------------------ */
  /* hooks / data                                                        */
  /* ------------------------------------------------------------------ */
  const navigate = useNavigate();

  // Get ML token and extract seller_id safely with proper type checking
  const mlToken = useMlToken();
  const sellerId = React.useMemo(() => {
    if (!mlToken) return '681274853'; // Default ID if mlToken is null
    
    // Log mlToken for debugging
    console.log('ML Token:', mlToken);
    
    try {
      // Handle different shapes of mlToken with proper type guards
      if (typeof mlToken === 'object' && mlToken !== null) {
        if ('seller_id' in mlToken) {
          return String(mlToken.seller_id).trim();
        } else if ('id' in mlToken && mlToken.id) {
          return String(mlToken.id).trim();
        }
      } else if (typeof mlToken === 'string' && mlToken.includes('seller_id')) {
        // Try to parse if it's a JSON string
        try {
          const parsed = JSON.parse(mlToken);
          if (parsed && parsed.seller_id) {
            return String(parsed.seller_id).trim();
          }
        } catch (e) {
          console.error('Failed to parse mlToken string:', e);
        }
      }
    } catch (e) {
      console.error('Error extracting seller_id:', e);
    }
    
    // Default fallback ID if extraction fails
    return '681274853';
  }, [mlToken]);
  
  console.log('Using seller ID:', sellerId);

  const {
    settlementTransactions,
    totalGrossSales,
    totalNetSales,
    totalUnits,
    isLoading: settlementLoading,
    refetch: refetchSettlement,
  } = useSettlementData(sellerId, startDate, endDate, true);
  
  // Use the new hook to get release line data
  const {
    releaseLineTransactions,
    isLoading: releaseLineLoading,
    lastUpdate: releaseLineLastUpdate,
    refetch: refetchReleaseLines,
  } = useReleaseLineData(sellerId, startDate, endDate);

  const { releaseData, isLoading: releaseLoading, lastUpdate } = useReleaseData(sellerId);

  const { 
    items: inventoryItems, 
    isLoading: inventoryLoading, 
    error: inventoryError 
  } = useInventoryData(sellerId);

  // Show toast if there's an inventory error
  useEffect(() => {
    if (inventoryError) {
      toast({
        title: "Erro",
        description: `Erro ao carregar dados de estoque: ${inventoryError.message}`,
        variant: "destructive",
      });
    }
  }, [inventoryError]);

  /* ------------------------------------------------------------------ */
  /* handlers                                                            */
  /* ------------------------------------------------------------------ */
  const parseReleaseData = useCallback(
    (
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
          sourceId: string;
          date: string;
        }

        const operationsBySourceId: Record<string, BySource> = {};

        /* agrupar */
        filtered.forEach((line) => {
          const cols = line.split(',');
          const date = cols[0];
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
              sourceId,
              date,
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

          if (desc === 'payment' && net > 0 && ref && itm) {
            operationsWithOrder.push({
              orderId: ref,
              itemId: itm,
              title: ttl || ref,
              amount: net,
              sourceId,
              date: op.date
            });
          } else if (net !== 0) {
            const key = desc || 'Sem descrição';
            otherOperations.push({ 
              description: key, 
              amount: net,
              sourceId,
              date: op.date
            });
          }
        });

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
    },
    []
  );

  // New function to process release line data directly
  const processReleaseLineData = useCallback(() => {
    if (releaseLineTransactions && releaseLineTransactions.length > 0) {
      let totalReleased = 0;
      let totalClaims = 0;
      let totalDebts = 0;
      let totalTransfers = 0;
      let totalCreditCard = 0;
      let totalShippingCashback = 0;
      
      const operationsWithOrder: ReleaseOperation[] = [];
      const otherOperations: ReleaseOperation[] = [];
      
      releaseLineTransactions.forEach(transaction => {
        const amount = transaction.netValue;
        
        // Categorize based on the group
        switch (transaction.group) {
          case 'Venda':
            totalReleased += amount;
            if (transaction.orderId) {
              operationsWithOrder.push({
                orderId: transaction.orderId,
                itemId: transaction.itemId || '',
                title: transaction.title || transaction.orderId,
                amount,
                sourceId: transaction.sourceId,
                date: transaction.date
              });
            }
            break;
          case 'Reclamações':
            totalClaims += amount;
            otherOperations.push({ 
              description: 'Reclamações', 
              amount,
              sourceId: transaction.sourceId,
              date: transaction.date
            });
            break;
          case 'Dívidas':
            totalDebts += amount;
            otherOperations.push({ 
              description: 'Dívidas', 
              amount,
              sourceId: transaction.sourceId,
              date: transaction.date
            });
            break;
          case 'Transferências':
            totalTransfers += amount;
            otherOperations.push({ 
              description: 'Transferências', 
              amount,
              sourceId: transaction.sourceId,
              date: transaction.date
            });
            break;
          case 'Cartão de Crédito':
            totalCreditCard += amount;
            otherOperations.push({ 
              description: 'Cartão de Crédito', 
              amount,
              sourceId: transaction.sourceId,
              date: transaction.date
            });
            break;
          case 'Correção de Envios e Cashbacks':
            totalShippingCashback += amount;
            otherOperations.push({ 
              description: 'Correção de Envios e Cashbacks', 
              amount,
              sourceId: transaction.sourceId,
              date: transaction.date
            });
            break;
          default:
            otherOperations.push({ 
              description: transaction.group || 'Outros', 
              amount,
              sourceId: transaction.sourceId,
              date: transaction.date
            });
        }
      });
      
      setMetrics(prev => ({
        ...prev,
        totalReleased,
        totalClaims,
        totalDebts,
        totalTransfers,
        totalCreditCard,
        totalShippingCashback,
      }));
      
      setReleaseOperationsWithOrder(operationsWithOrder);
      setReleaseOtherOperations(otherOperations);
      
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
    } else {
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
  }, [releaseLineTransactions]);

  const isDateInRange = (dateStr: string, start?: Date, end?: Date): boolean => {
    if (!start || !end || !dateStr) return true;
    const d = new Date(dateStr);
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    return d >= s && d <= e;
  };

  const handleFilter = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Selecione um período válido",
        variant: "destructive",
      });
      return;
    }

    refetchSettlement();
    refetchReleaseLines();
    processReleaseData();

    toast({
      title: "Filtro aplicado",
      description: `Filtrando de ${startDate.toLocaleDateString()} até ${endDate.toLocaleDateString()}`,
    });
  };

  // Função para processar os dados de liberação baseado no filtro de data atual
  const processReleaseData = useCallback(() => {
    if (releaseLineTransactions.length > 0) {
      // Preferentially use release line data if available
      processReleaseLineData();
    } else if (releaseData) {
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
  }, [releaseData, releaseLineTransactions, startDate, endDate, parseReleaseData, processReleaseLineData]);

  const handleReleaseDataChange = (data: string) => {
    // Esta função não precisa mais fazer a análise dos dados, 
    // pois isso agora é feito na função processReleaseData
    // que é chamada sempre que os dados ou filtros mudam
  };

  /* ------------------------------------------------------------------ */
  /* side‑effects                                                        */
  /* ------------------------------------------------------------------ */
  // Processar os dados de liberação sempre que releaseData, releaseLineTransactions ou datas de filtro mudam
  useEffect(() => {
    processReleaseData();
  }, [releaseData, releaseLineTransactions, startDate, endDate, processReleaseData]);

  useEffect(() => {
    setMetrics((prev) => ({
      ...prev,
      grossSales: totalGrossSales,
      totalAmount: totalGrossSales,
      unitsSold: totalUnits,
      totalMLRepasses: totalNetSales,
      totalMLFees: totalGrossSales - totalNetSales,
    }));
  }, [totalGrossSales, totalNetSales, totalUnits]);

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
            <DateRangeFilterSection
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onFilter={handleFilter}
              onDateRangeApplied={processReleaseData}
            />

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
              settlementTransactions={releaseLineTransactions.length > 0 ? releaseLineTransactions : settlementTransactions}
              releaseOperationsWithOrder={releaseOperationsWithOrder}
              releaseOtherOperations={releaseOtherOperations}
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
              settlementTransactions={releaseLineTransactions.length > 0 ? releaseLineTransactions : settlementTransactions}
              settlementLoading={settlementLoading || releaseLineLoading}
              lastUpdate={releaseLineLastUpdate || lastUpdate}
            />
          </TabsContent>

          <TabsContent value="estoque" className="mt-4">
            <InventoryList 
              inventoryItems={inventoryItems || []} 
              isLoading={inventoryLoading} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFinanceiro;
