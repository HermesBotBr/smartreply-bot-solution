
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { DateRangeFilterSection } from "@/components/dashboard/metrics/DateRangeFilterSection";
import { FinancialMetrics } from '@/components/financeiro/FinancialMetrics';
import { DataInput } from '@/components/financeiro/DataInput';
import { useNavigate } from 'react-router-dom';

const AdminFinanceiro = () => {
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
  const [shouldFilter, setShouldFilter] = useState(false);
  const [activeTab, setActiveTab] = useState('metricas');

  const handleFilter = () => {
    setShouldFilter(true);
  };

  const handleSettlementDataChange = (data: string) => {
    setSettlementData(data);

    // Parse settlement data and calculate metrics
    const parsedData = parseSettlementData(data);
    
    // Update metrics while preserving release data metrics
    setMetrics(prevMetrics => ({
      ...prevMetrics,
      grossSales: parsedData.grossSales,
      totalAmount: parsedData.totalAmount,
      unitsSold: parsedData.unitsSold,
      totalMLRepasses: parsedData.totalMLRepasses,
      totalMLFees: parsedData.totalMLFees
    }));
  };

  const handleReleaseDataChange = (data: string) => {
    setReleaseData(data);

    // Parse release data and calculate metrics
    const parsedData = parseReleaseData(data);
    
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
  };

  const parseSettlementData = (data: string): { 
    grossSales: number; 
    totalAmount: number; 
    unitsSold: number; 
    totalMLRepasses: number;
    totalMLFees: number;
  } => {
    try {
      // Skip the first two lines (title and headers)
      const lines = data.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 3) {
        return { 
          grossSales: 0, 
          totalAmount: 0, 
          unitsSold: 0,
          totalMLRepasses: 0,
          totalMLFees: 0
        };
      }

      // Skip the first two lines (settlement: and headers)
      const dataLines = lines.slice(2);
      
      // Filter for SETTLEMENT transactions only
      const settlementLines = dataLines.filter(line => {
        const columns = line.split(',');
        // TRANSACTION_TYPE is the 7th column (index 6)
        return columns.length > 6 && columns[6].trim() === 'SETTLEMENT';
      });
      
      // Calculate metrics
      let totalAmount = 0;
      let totalMLRepasses = 0;
      let totalMLFees = 0;
      
      settlementLines.forEach(line => {
        const columns = line.split(',');
        // TRANSACTION_AMOUNT is the 8th column (index 7)
        const transactionAmount = parseFloat(columns[7].trim().replace(/"/g, ''));
        // FEE_AMOUNT is the 11th column (index 10)
        const feeAmount = parseFloat(columns[10].trim().replace(/"/g, ''));
        // SETTLEMENT_NET_AMOUNT is the 12th column (index 11)
        const settlementNetAmount = parseFloat(columns[11].trim().replace(/"/g, ''));
        
        if (!isNaN(transactionAmount)) {
          totalAmount += transactionAmount;
        }
        
        if (!isNaN(feeAmount)) {
          totalMLFees += feeAmount;
        }
        
        if (!isNaN(settlementNetAmount)) {
          totalMLRepasses += settlementNetAmount;
        }
      });
      
      // Return the calculated metrics
      return {
        grossSales: totalAmount,
        totalAmount: totalAmount,
        unitsSold: settlementLines.length,
        totalMLRepasses,
        totalMLFees
      };
    } catch (error) {
      console.error('Error parsing settlement data:', error);
      return { 
        grossSales: 0, 
        totalAmount: 0, 
        unitsSold: 0,
        totalMLRepasses: 0,
        totalMLFees: 0
      };
    }
  };

  const parseReleaseData = (data: string): {
    totalReleased: number;
    totalClaims: number;
    totalDebts: number;
    totalTransfers: number;
    totalCreditCard: number;
    totalShippingCashback: number;
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
      
      dataLines.forEach(line => {
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
      
      return {
        totalReleased,
        totalClaims,
        totalDebts,
        totalTransfers,
        totalCreditCard,
        totalShippingCashback
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
            />
          </TabsContent>
          
          <TabsContent value="entrada" className="mt-4">
            <DataInput 
              settlementData={settlementData}
              releaseData={releaseData}
              onSettlementDataChange={handleSettlementDataChange}
              onReleaseDataChange={handleReleaseDataChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFinanceiro;
