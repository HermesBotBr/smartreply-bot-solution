// src/components/financeiro/FinancialMetrics.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { TransfersPopup } from '@/components/financeiro/TransfersPopup';
import { RepassesPopup } from '@/components/financeiro/RepassesPopup';
import { SalesDetailPopup } from '@/components/financeiro/SalesDetailPopup';
import { ReleasePopup } from '@/components/financeiro/ReleasePopup';
import { SettlementTransaction } from '@/hooks/useSettlementData';

interface FinancialMetricsProps {
  grossSales: number;
  totalAmount: number;
  unitsSold: number;
  totalMLRepasses: number;
  totalMLFees: number;
  totalReleased: number;
  totalClaims: number;
  totalDebts: number;
  totalTransfers: number;
  totalCreditCard: number;
  totalShippingCashback: number;
  settlementTransactions: SettlementTransaction[];
  refundedTransactions?: SettlementTransaction[]; 
  releaseOperationsWithOrder: any[];
  releaseOtherOperations: any[];
  startDate?: Date;
  endDate?: Date;
  filterBySettlement?: boolean;
}

export const FinancialMetrics = ({
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
  totalShippingCashback,
  settlementTransactions,
  refundedTransactions = [],
  releaseOperationsWithOrder,
  releaseOtherOperations,
  startDate,
  endDate,
  filterBySettlement
}: FinancialMetricsProps) => {
  const [showTransfers, setShowTransfers] = useState(false);
  const [showRepasses, setShowRepasses] = useState(false);
  const [showSalesDetails, setShowSalesDetails] = useState(false);
  const [showReleaseDetails, setShowReleaseDetails] = useState(false);

  const handleOrderClick = (orderId: string) => {
    console.log('Clicou no pedido:', orderId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Vendas Brutas</CardTitle>
          <CardDescription>Total de vendas brutas no período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(grossSales)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total de Vendas</CardTitle>
          <CardDescription>Soma de todas as vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unidades Vendidas</CardTitle>
          <CardDescription>Total de unidades vendidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{unitsSold}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repasse Total (ML)</CardTitle>
          <CardDescription>Total de repasses do Mercado Livre</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalMLRepasses)}</div>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowRepasses(true)}>
            Ver Detalhes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxas (ML)</CardTitle>
          <CardDescription>Total de taxas cobradas pelo Mercado Livre</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalMLFees)}</div>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowSalesDetails(true)}>
            Ver Detalhes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liberado</CardTitle>
          <CardDescription>Total liberado na conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalReleased)}</div>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowReleaseDetails(true)}>
            Ver Detalhes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reclamações</CardTitle>
          <CardDescription>Total de reclamações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalClaims)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dívidas</CardTitle>
          <CardDescription>Total de dívidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalDebts)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transferências</CardTitle>
          <CardDescription>Total de transferências</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalTransfers)}</div>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowTransfers(true)}>
            Ver Detalhes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crédito Cartão</CardTitle>
          <CardDescription>Total de crédito no cartão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCreditCard)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cashback Frete</CardTitle>
          <CardDescription>Total de cashback de frete</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalShippingCashback)}</div>
        </CardContent>
      </Card>

      {/* Modais */}
      <TransfersPopup
        open={showTransfers}
        onClose={() => setShowTransfers(false)}
        transfers={releaseOperationsWithOrder}
        startDate={startDate}
        endDate={endDate}
      />
      <RepassesPopup
        open={showRepasses}
        onClose={() => setShowRepasses(false)}
        transactions={settlementTransactions}
        startDate={startDate}
        endDate={endDate}
      />
      <SalesDetailPopup
        open={showSalesDetails}
        onClose={() => setShowSalesDetails(false)}
        salesByItemId={Object.fromEntries(
          settlementTransactions.reduce((map, transaction) => {
            if (transaction.itemId) {
              const currentValue = map.get(transaction.itemId) || 0;
              map.set(transaction.itemId, currentValue + transaction.units);
            }
            return map;
          }, new Map())
        )}
        detailedSales={settlementTransactions.map(transaction => ({
          orderId: transaction.orderId,
          itemId: transaction.itemId || '',
          title: transaction.title,
          quantity: transaction.units,
          dateCreated: transaction.date
        }))}
        startDate={startDate}
        endDate={endDate}
        totalUnitsSold={unitsSold}
      />
      <ReleasePopup
        open={showReleaseDetails}
        onClose={() => setShowReleaseDetails(false)}
        operationsWithOrder={releaseOperationsWithOrder}
        otherOperations={releaseOtherOperations}
        settlementTransactions={settlementTransactions}
        refundedTransactions={refundedTransactions}
        startDate={startDate}
        endDate={endDate}
        filterBySettlement={filterBySettlement}
      />
    </div>
  );
};
