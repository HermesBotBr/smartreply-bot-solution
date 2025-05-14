
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryList } from '@/components/financeiro/InventoryList';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { TransactionsList } from '@/components/financeiro/TransactionsList';
import { FinancialMetrics } from '@/components/financeiro/FinancialMetrics';
import { SettlementTransactionsList } from '@/components/financeiro/SettlementTransactionsList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { ReleaseOperation } from "@/types/ReleaseOperation";
import { DateRangeFilterSection } from "@/components/dashboard/metrics/DateRangeFilterSection";
import { toast } from "@/components/ui/use-toast";
import { SettlementTransaction, useSettlementData } from "@/hooks/useSettlementData";
import { useMlToken } from "@/hooks/useMlToken";

const AdminFinanceiro = () => {
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
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate
  });

  const [settlementData, setSettlementData] = useState<string>('');
  const [releaseData, setReleaseData] = useState<string>('');

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
  const isMobile = useMediaQuery("(max-width: 640px)");

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

  const { 
    items: inventoryItems, 
    isLoading: inventoryLoading, 
    error: inventoryError 
  } = useInventoryData(sellerId);

  // Show toast if there's an inventory error
  useEffect(() => {
    if (inventoryError) {
      toast({ 
        variant: "destructive",
        title: "Erro",
        description: `Erro ao carregar dados de estoque: ${inventoryError.message}`
      });
    }
  }, [inventoryError]);

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
        variant: "destructive",
        title: "Erro",
        description: "Selecione um período válido"
      });
      return;
    }

    refetchSettlement();

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
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Administração Financeira</h1>
      
      {/* Date Range Picker */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Período de análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full md:w-auto justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "dd/MM/yyyy")} -{" "}
                          {format(date.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(date.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Selecione um período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={isMobile ? 1 : 2}
                  />
                </PopoverContent>
              </Popover>
              
              <Textarea
                className="w-full md:w-auto"
                placeholder="Digite o período de análise"
                value={date?.from?.toISOString() || date?.to?.toISOString() || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const [from, to] = value.split(' - ');
                    if (from) {
                      setDate({ from: new Date(from), to: new Date(to) });
                    } else {
                      setDate({ from: new Date(from) });
                    }
                  } else {
                    setDate(undefined);
                  }
                }}
              />
              
              <Button
                className="w-full md:w-auto"
                onClick={handleFilter}
              >
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metricas">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="repasses">Pagamentos</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>
        
        <TabsContent value="metricas">
          <DateRangeFilterSection
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onFilter={handleFilter}
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
            settlementTransactions={settlementTransactions}
            releaseOperationsWithOrder={releaseOperationsWithOrder}
            releaseOtherOperations={releaseOtherOperations}
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>
        
        <TabsContent value="transacoes">
          <TransactionsList
            transactions={settlementTransactions}
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>
        
        <TabsContent value="repasses">
          <SettlementTransactionsList
            transactions={settlementTransactions}
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>
        
        <TabsContent value="estoque">
          <InventoryList 
            inventoryItems={inventoryItems} 
            isLoading={inventoryLoading}
            sellerId={sellerId} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinanceiro;
