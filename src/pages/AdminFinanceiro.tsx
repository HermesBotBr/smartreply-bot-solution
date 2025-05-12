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
  
  // Get seller_id from mlToken or use hardcoded value for testing
  const mlToken = useMlToken();
  // Hardcoded seller ID for testing
  let sellerId = "681274853";
  
  // If mlToken is available, use it instead of the hardcoded value
  if (mlToken !== null && typeof mlToken === 'object' && 'seller_id' in mlToken) {
    sellerId = (mlToken as { seller_id: string }).seller_id;
  }

  console.log("Using seller ID:", sellerId);

  // Use our hook to fetch settlement data
  const { 
    settlementTransactions,
    totalGrossSales, 
    totalNetSales, 
    totalUnits, 
    isLoading: settlementLoading,
    refetch: refetchSettlement
  } = useSettlementData(sellerId, startDate, endDate, true);

  const handleFilter = () => {
    // Apply the date filter to both settlement and release data
    if (startDate && endDate) {
      console.log("Filter button clicked, refetching data for:", startDate, endDate);
      
      // Refetch settlement data from API
      refetchSettlement();
      
      // Re-parse release data with the new date filters
      if (releaseData) {
        const parsedData = parseReleaseData(releaseData, startDate, endDate);
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          totalReleased: parsedData.totalReleased,
          totalClaims: parsedData.totalClaims,
          totalDebts: parsedData.totalDebts,
          totalTransfers: parsedData.totalTransfers,
          totalCreditCard: parsedData.totalCreditCard,
          totalShippingCashback: parsedData.totalShippingCashback
        }));
      }
      
      toast.info(`Filtrando dados para o período de ${startDate.toLocaleDateString()} até ${endDate.toLocaleDateString()}`);
    } else {
      toast.error("Selecione um período válido para filtrar os dados");
    }
  };

  const handleSettlementDataChange = (data: string) => {
    setSettlementData(data);
    // We don't parse settlement data anymore as it's coming from API
  };

  const handleReleaseDataChange = (data: string) => {
    setReleaseData(data);

    // Parse release data and calculate metrics
    const parsedData = parseReleaseData(data, startDate, endDate);
    
    // Update metrics while preserving settlement data metrics
setMetrics(prevMetrics => ({
  ...prevMetrics,
  totalReleased: parsedData.totalReleased,
  totalClaims: parsedData.totalClaims,
  totalDebts: parsedData.totalDebts,
  totalTransfers: parsedData.totalTransfers,
  totalCreditCard: parsedData.totalCreditCard,
  totalShippingCashback: parsedData.totalShippingCashback
}));

setReleaseOperationsWithOrder(parsedData.operationsWithOrder || []);
setReleaseOtherOperations(parsedData.otherOperations || []);

  };

  // Helper function to check if a date string is within the filter range
  const isDateInRange = (dateStr: string, startDate?: Date, endDate?: Date): boolean => {
    if (!startDate || !endDate || !dateStr) return true;
    
    try {
      const date = new Date(dateStr);
      // Set time to 00:00:00 for startDate and 23:59:59 for endDate for proper range comparison
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      return date >= start && date <= end;
    } catch (e) {
      console.error('Invalid date format:', dateStr);
      return false;
    }
  };

  // We don't need this function anymore as we're fetching from API
  // const parseSettlementData = (data: string, startDate?: Date, endDate?: Date): {} => {...}

  const parseReleaseData = (
    data: string,
    startDate?: Date,
    endDate?: Date
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
      // Skip the first two lines (title and headers)
      const lines = data.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 3) {
        return {
          totalReleased: 0,
          totalClaims: 0,
          totalDebts: 0,
          totalTransfers: 0,
          totalCreditCard: 0,
          totalShippingCashback: 0
        };
      }

      // Skip the first two lines (release: and headers) and the last line (total)
      const dataLines = lines.slice(2).filter(line => !line.startsWith(',,,total'));
      
      // Filter data by date if startDate and endDate are provided
      const filteredDataLines = dataLines.filter(line => {
        if (!line.trim()) return false;
        
        const columns = line.split(',');
        if (columns.length < 2) return false;
        
        // DATE is the 1st column (index 0)
        const dateStr = columns[0].trim();
        
        // Skip initial_available_balance line
        if (columns.length >= 5 && columns[4].includes('initial_available_balance')) return false;
        
        return isDateInRange(dateStr, startDate, endDate);
      });
      
      let totalReleased = 0;
      let totalClaims = 0;
      let totalDebts = 0;
      let totalTransfers = 0;
      let totalCreditCard = 0;
      let totalShippingCashback = 0;
      
      // Group operations by SOURCE_ID to process them together
      const operationsBySourceId: Record<string, {
        creditAmount: number;
        debitAmount: number;
        descriptions: Record<string, { creditCount: number; debitCount: number; }>;
      }> = {};
      
      filteredDataLines.forEach(line => {
        if (!line.trim()) return;
        
        const columns = line.split(',');
        if (columns.length < 7) return;
        
        // Skip initial_available_balance line
        if (columns[4].includes('initial_available_balance')) return;
        
        // SOURCE_ID is the 2nd column (index 1)
        const sourceId = columns[1].trim();
        // DESCRIPTION is the 5th column (index 4)
        const description = columns[4].trim();
        // NET_CREDIT_AMOUNT is the 6th column (index 5)
        const creditAmount = parseFloat(columns[5].trim().replace(/"/g, '') || '0');
        // NET_DEBIT_AMOUNT is the 7th column (index 6)
        const debitAmount = parseFloat(columns[6].trim().replace(/"/g, '') || '0');
        
        if (!sourceId) return;
        
        if (!operationsBySourceId[sourceId]) {
          operationsBySourceId[sourceId] = {
            creditAmount: 0,
            debitAmount: 0,
            descriptions: {}
          };
        }
        
        operationsBySourceId[sourceId].creditAmount += isNaN(creditAmount) ? 0 : creditAmount;
        operationsBySourceId[sourceId].debitAmount += isNaN(debitAmount) ? 0 : debitAmount;
        
        if (!operationsBySourceId[sourceId].descriptions[description]) {
          operationsBySourceId[sourceId].descriptions[description] = {
            creditCount: 0,
            debitCount: 0
          };
        }
        
        if (creditAmount > 0) {
          operationsBySourceId[sourceId].descriptions[description].creditCount++;
        }
        
        if (debitAmount > 0) {
          operationsBySourceId[sourceId].descriptions[description].debitCount++;
        }
      });
      
      // Process each operation group
      Object.entries(operationsBySourceId).forEach(([sourceId, operation]) => {
        const netAmount = operation.creditAmount - operation.debitAmount;
        
        // Determine the predominant description for this operation
        let predominantDescription = '';
        let maxCount = 0;
        
        // If net amount is positive, look for predominant credit description
        // If net amount is negative, look for predominant debit description
        const descriptionEntries = Object.entries(operation.descriptions);
        
        if (netAmount >= 0) {
          descriptionEntries.forEach(([description, counts]) => {
            if (counts.creditCount > maxCount) {
              maxCount = counts.creditCount;
              predominantDescription = description;
            }
          });
        } else {
          descriptionEntries.forEach(([description, counts]) => {
            if (counts.debitCount > maxCount) {
              maxCount = counts.debitCount;
              predominantDescription = description;
            }
          });
        }
        
        // Categorize the operation based on the predominant description
        if (predominantDescription === 'payment') {
          totalReleased += netAmount;
        } else if (['reserve_for_dispute', 'reserve_for_bpp_shipping_return', 'refund', 'reserve_for_refund', 'mediation'].includes(predominantDescription)) {
          totalClaims += netAmount;
        } else if (predominantDescription === 'reserve_for_debt_payment') {
          totalDebts += netAmount;
        } else if (['payout', 'reserve_for_payout'].includes(predominantDescription)) {
          totalTransfers += netAmount;
        } else if (predominantDescription === 'credit_payment') {
          totalCreditCard += netAmount;
        } else if (['shipping', 'cashback'].includes(predominantDescription)) {
          totalShippingCashback += netAmount;
        }
      });
      const operationsWithOrder: ReleaseOperation[] = [];
const otherOperations: ReleaseOperation[] = [];

Object.entries(operationsBySourceId).forEach(([sourceId, operation]) => {
  const netAmount = operation.creditAmount - operation.debitAmount;

  const matchingLine = filteredDataLines.find(line => {
    const columns = line.split(',');
    return columns[1]?.trim() === sourceId;
  });

  let externalRef = '';
  let itemId = '';
  let title = '';
  let description = '';

  if (matchingLine) {
    const columns = matchingLine.split(',');
    externalRef = columns[2]?.trim() || '';
    itemId = columns[7]?.trim() || '';
    title = columns[8]?.trim().replace(/"/g, '') || '';
    description = columns[4]?.trim() || '';
  }

  if (externalRef && itemId) {
    operationsWithOrder.push({
      orderId: externalRef,
      itemId,
      title: title || description || 'Descrição indisponível',
      amount: netAmount
    });
  } else {
    otherOperations.push({
      description: description || 'Sem descrição',
      amount: netAmount
    });
  }
});

// ✅ Agora sim, fora do forEach:
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



    } catch (error) {
      console.error('Error parsing release data:', error);
      return {
        totalReleased: 0,
        totalClaims: 0,
        totalDebts: 0,
        totalTransfers: 0,
        totalCreditCard: 0,
        totalShippingCashback: 0
      };
    }
  };

  // Update metrics with data from the settlement API
  React.useEffect(() => {
    console.log("Updating metrics with settlement data:", { totalGrossSales, totalNetSales, totalUnits });
    setMetrics(prevMetrics => ({
      ...prevMetrics,
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
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Administração Financeira</h1>
        </div>

        <Tabs 
          defaultValue="metricas" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
            <TabsTrigger value="entrada">Entrada de Dados</TabsTrigger>
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
