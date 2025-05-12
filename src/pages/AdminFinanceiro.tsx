import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { DateRangeFilterSection } from "@/components/dashboard/metrics/DateRangeFilterSection";
import { FinancialMetrics } from '@/components/financeiro/FinancialMetrics';
import { DataInput } from '@/components/financeiro/DataInput';
import { useNavigate } from 'react-router-dom';
import { useMlToken } from '@/hooks/useMlToken';
import { useSettlementData } from '@/hooks/useSettlementData';
import { toast } from 'sonner';

interface ReleaseOperation {
  orderId?: string;
  itemId?: string;
  title?: string;
  amount: number;
  description?: string;
}

const AdminFinanceiro = () => {
  const [releaseOperationsWithOrder, setReleaseOperationsWithOrder] = useState<ReleaseOperation[]>([]);
  const [releaseOtherOperations, setReleaseOtherOperations] = useState<ReleaseOperation[]>([]);

  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
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
    totalShippingCashback: 0
  });
  const [activeTab, setActiveTab] = useState('metricas');

  const mlToken = useMlToken();
  let sellerId = "681274853";
  if (mlToken && typeof mlToken === 'object' && 'seller_id' in mlToken) {
    sellerId = (mlToken as { seller_id: string }).seller_id;
  }

  const { 
    settlementTransactions,
    totalGrossSales,
    totalNetSales,
    totalUnits,
    isLoading: settlementLoading,
    refetch: refetchSettlement
  } = useSettlementData(sellerId, startDate, endDate, true);

  const handleFilter = () => {
    if (startDate && endDate) {
      refetchSettlement();
      if (releaseData) {
        const parsed = parseReleaseData(releaseData, startDate, endDate);
        setMetrics(prev => ({ ...prev,
          totalReleased: parsed.totalReleased,
          totalClaims: parsed.totalClaims,
          totalDebts: parsed.totalDebts,
          totalTransfers: parsed.totalTransfers,
          totalCreditCard: parsed.totalCreditCard,
          totalShippingCashback: parsed.totalShippingCashback
        }));
      }
      toast.info(`Filtrando de ${startDate.toLocaleDateString()} até ${endDate.toLocaleDateString()}`);
    } else {
      toast.error("Selecione um período válido");
    }
  };

  const handleReleaseDataChange = (data: string) => {
    setReleaseData(data);
    const parsed = parseReleaseData(data, startDate, endDate);
    setMetrics(prev => ({ ...prev,
      totalReleased: parsed.totalReleased,
      totalClaims: parsed.totalClaims,
      totalDebts: parsed.totalDebts,
      totalTransfers: parsed.totalTransfers,
      totalCreditCard: parsed.totalCreditCard,
      totalShippingCashback: parsed.totalShippingCashback
    }));
    setReleaseOperationsWithOrder(parsed.operationsWithOrder);
    setReleaseOtherOperations(parsed.otherOperations);
  };

  const isDateInRange = (dateStr: string, start?: Date, end?: Date): boolean => {
    if (!start || !end) return true;
    const d = new Date(dateStr);
    const s = new Date(start); s.setHours(0,0,0,0);
    const e = new Date(end); e.setHours(23,59,59,999);
    return d >= s && d <= e;
  };

  const parseReleaseData = (
    data: string,
    start?: Date,
    end?: Date
  ) => {
    const lines = data.split('\n').filter(l => l.trim());
    if (lines.length < 3) return {
      totalReleased:0,totalClaims:0,totalDebts:0,totalTransfers:0,
      totalCreditCard:0,totalShippingCashback:0,
      operationsWithOrder:[],otherOperations:[]
    };

    const dataLines = lines.slice(2).filter(l => !l.startsWith(',,,total'));
    const filtered = dataLines.filter(l => {
      const cols = l.split(',');
      if (cols[4]?.includes('initial_available_balance')) return false;
      return isDateInRange(cols[0], start, end);
    });

    let totalReleased=0, totalClaims=0, totalDebts=0, totalTransfers=0, totalCreditCard=0, totalShippingCashback=0;

    // passo 1: agrupar
    const operationsBySourceId: Record<string,{
      creditAmount:number;
      debitAmount:number;
      descriptions: Record<string,{ creditCount:number; debitCount:number }>;
      predominantDescription:string;
    }> = {};

    filtered.forEach(line => {
      const cols = line.split(',');
      const src=cols[1];
      const desc=cols[4];
      const credit=parseFloat(cols[5])||0;
      const debit=parseFloat(cols[6])||0;
      if (!operationsBySourceId[src]) {
        operationsBySourceId[src] = { creditAmount:0, debitAmount:0, descriptions:{}, predominantDescription:'' };
      }
      const op = operationsBySourceId[src];
      op.creditAmount += credit;
      op.debitAmount += debit;
      if (!op.descriptions[desc]) op.descriptions[desc]={ creditCount:0, debitCount:0 };
      if (credit>0) op.descriptions[desc].creditCount++;
      if (debit>0) op.descriptions[desc].debitCount++;
    });

    // passo 2: calcular predominantDescription
    Object.entries(operationsBySourceId).forEach(([src,op]) => {
      const net = op.creditAmount - op.debitAmount;
      let best='', max=0;
      Object.entries(op.descriptions).forEach(([d,c]) => {
        const cnt = net>=0?c.creditCount:c.debitCount;
        if (cnt>max) { max=cnt; best=d; }
      });
      op.predominantDescription = best;
    });

    // passo 3: somar totais
    Object.values(operationsBySourceId).forEach(op=>{
      const net = op.creditAmount - op.debitAmount;
      switch(op.predominantDescription) {
        case 'payment': totalReleased += net; break;
        case 'reserve_for_debt_payment': totalDebts += net; break;
        case 'credit_payment': totalCreditCard += net; break;
        case 'reserve_for_dispute':
        case 'refund':
        case 'mediation':
        case 'reserve_for_bpp_shipping_return': totalClaims += net; break;
        case 'payout':
        case 'reserve_for_payout': totalTransfers += net; break;
        case 'shipping':
        case 'cashback': totalShippingCashback += net; break;
      }
    });

    // passo 4: montar listas para popup
    const operationsWithOrder: ReleaseOperation[] = [];
    const otherOperations: ReleaseOperation[] = [];

    Object.entries(operationsBySourceId).forEach(([src,op]) => {
      const net = op.creditAmount - op.debitAmount;
      const line = filtered.find(l=>l.split(',')[1]===src)!
      const cols = line.split(',');
      const ref=cols[2], itm=cols[7], ttl=cols[8].replace(/"/g,'');
      const desc=op.predominantDescription;
      if (desc==='payment' && net>0 && ref && itm) {
        const idx = operationsWithOrder.findIndex(o=>o.orderId===ref);
        if(idx>=0) operationsWithOrder[idx].amount += net;
        else operationsWithOrder.push({orderId:ref, itemId:itm, title:ttl||ref, amount:net});
      } else if (net!==0) {
        const key = desc||'Sem descrição';
        const idx = otherOperations.findIndex(o=>o.description===key);
        if(idx>=0) otherOperations[idx].amount += net;
        else otherOperations.push({description:key, amount:net});
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
      otherOperations
    };
  } catch {
    return { totalReleased:0,totalClaims:0,totalDebts:0,totalTransfers:0,totalCreditCard:0,totalShippingCashback:0,operationsWithOrder:[],otherOperations:[] };
  }
};

React.useEffect(() => {
  setMetrics(prev => ({
    ...prev,
    grossSales: totalGrossSales,
    totalAmount: totalGrossSales,
    unitsSold: totalUnits,
    totalMLRepasses: totalNetSales,
    totalMLFees: totalGrossSales - totalNetSales
  }));
}, [totalGrossSales, totalNetSales, totalUnits]);

return (
  <div className="min-h-screen bg-gray-100">
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar
        </Button>
        <h1 className="text-3xl font-bold">Administração Financeira</h1>
      </div>

      <Tabs defaultValue="metricas" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="entrada">Entrada</TabsTrigger>
        </TabsList>

        <TabsContent value="metricas" className="space-y-4 mt-4">
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
      </Tabs>
    </div>
  </div>
);
};

export default AdminFinanceiro;
