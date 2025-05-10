
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBar, Package, DollarSign, TrendingDown, CreditCard, AlertCircle, ArrowDown, WalletCards, Package2 } from "lucide-react";

interface FinancialMetricsProps {
  grossSales: number;
  totalAmount: number;
  unitsSold: number;
  totalMLRepasses: number;
  totalMLFees: number;
  // Release metrics
  totalReleased: number;
  totalClaims: number;
  totalDebts: number;
  totalTransfers: number;
  totalCreditCard: number;
  totalShippingCashback: number; // New metric
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ 
  grossSales, 
  totalAmount, 
  unitsSold,
  totalMLRepasses,
  totalMLFees,
  totalReleased,
  totalClaims,
  totalDebts,
  totalTransfers,
  totalCreditCard,
  totalShippingCashback
}) => {
  // Format numbers with Brazilian currency and number format
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Brutas</CardTitle>
          <ChartBar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(grossSales)}</div>
          <p className="text-xs text-muted-foreground">
            Valor total das transações SETTLEMENT
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total Faturado</CardTitle>
          <ChartBar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          <p className="text-xs text-muted-foreground">
            Valor total das transações processadas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unidades Vendidas</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(unitsSold)}</div>
          <p className="text-xs text-muted-foreground">
            Total de transações SETTLEMENT
          </p>
        </CardContent>
      </Card>
      

            <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxas e Envios ML</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalMLFees)}</div>
          <p className="text-xs text-muted-foreground">
            Total de taxas e envios
          </p>
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Repasses ML</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalMLRepasses)}</div>
          <p className="text-xs text-muted-foreground">
            Repasses líquidos das vendas
          </p>
        </CardContent>
      </Card>



      {/* Release data metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Liberado na Conta</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalReleased)}</div>
          <p className="text-xs text-muted-foreground">
            Total de pagamentos liberados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reclamações</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalClaims)}</div>
          <p className="text-xs text-muted-foreground">
            Valor total descontado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dívidas</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalDebts)}</div>
          <p className="text-xs text-muted-foreground">
            Valor total descontado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transferências</CardTitle>
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalTransfers)}</div>
          <p className="text-xs text-muted-foreground">
            Valor total descontado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cartão de Crédito</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCreditCard)}</div>
          <p className="text-xs text-muted-foreground">
            Valor total descontado
          </p>
        </CardContent>
      </Card>

      {/* New metrics box for Shipping and Cashback */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Correção de Envios e Cashbacks</CardTitle>
          <Package2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalShippingCashback)}</div>
          <p className="text-xs text-muted-foreground">
            Valor total de correções de envio e cashbacks
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
