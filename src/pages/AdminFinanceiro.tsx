
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBar, Package, FileSpreadsheet, ArrowLeft } from "lucide-react";
import { DateRangeFilterSection } from "@/components/dashboard/metrics/DateRangeFilterSection";
import { FinancialMetrics } from '@/components/financeiro/FinancialMetrics';
import { DataInput } from '@/components/financeiro/DataInput';
import { useNavigate } from 'react-router-dom';

const AdminFinanceiro = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [settlementData, setSettlementData] = useState<string>('');
  const [metrics, setMetrics] = useState({
    grossSales: 0,
    totalAmount: 0,
    unitsSold: 0
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
    setMetrics(parsedData);
  };

  const parseSettlementData = (data: string): { grossSales: number; totalAmount: number; unitsSold: number } => {
    try {
      // Skip the first two lines (title and headers)
      const lines = data.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 3) {
        return { grossSales: 0, totalAmount: 0, unitsSold: 0 };
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
      settlementLines.forEach(line => {
        const columns = line.split(',');
        // TRANSACTION_AMOUNT is the 8th column (index 7)
        const transactionAmount = parseFloat(columns[7].trim().replace(/"/g, ''));
        if (!isNaN(transactionAmount)) {
          totalAmount += transactionAmount;
        }
      });
      
      // Return the calculated metrics
      return {
        grossSales: totalAmount,
        totalAmount: totalAmount,
        unitsSold: settlementLines.length
      };
    } catch (error) {
      console.error('Error parsing settlement data:', error);
      return { grossSales: 0, totalAmount: 0, unitsSold: 0 };
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
            />
          </TabsContent>
          
          <TabsContent value="entrada" className="mt-4">
            <DataInput 
              settlementData={settlementData}
              onSettlementDataChange={handleSettlementDataChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFinanceiro;
