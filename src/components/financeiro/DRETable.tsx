import React, { useMemo, useEffect } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InventoryItem } from '@/types/inventory';
import { SettlementTransaction } from '@/types/settlement';
import { ReleaseOperation } from '@/types/ReleaseOperation';

interface DRETableProps {
  startDate?: Date;
  endDate?: Date;
  grossSales: number;
  totalMLFees: number;
  refundedAmount: number;
  totalAdvertisingCost: number;
  inventoryItems: InventoryItem[];
  settlementTransactions: SettlementTransaction[];
  releaseOperationsWithOrder: ReleaseOperation[];
  releaseOtherOperations: ReleaseOperation[];
}

export const DRETable: React.FC<DRETableProps> = ({
  startDate,
  endDate,
  grossSales,
  totalMLFees,
  refundedAmount,
  totalAdvertisingCost,
  inventoryItems,
  settlementTransactions,
  releaseOperationsWithOrder,
  releaseOtherOperations
}) => {

  useEffect(() => {
    console.log("DRETable renderizou ou foi atualizado");
  }, []);

  const repassePrevisto = useMemo(() => {
    return releaseOperationsWithOrder.reduce((sum, op) => sum + op.amount, 0);
  }, [releaseOperationsWithOrder]);

  const naoLiberadas = useMemo(() => {
    return releaseOperationsWithOrder
      .filter(op => {
        const date = new Date(op.date);
        return startDate && endDate && date >= startDate && date <= endDate;
      })
      .reduce((sum, op) => sum + op.amount, 0);
  }, [releaseOperationsWithOrder, startDate, endDate]);

  const cmv = useMemo(() => {
    return inventoryItems.reduce((total, item) => {
      const custoTotal = item.sales.reduce((sum, sale) => {
        const date = new Date(sale.date);
        if (startDate && endDate && date >= startDate && date <= endDate) {
          return sum + (sale.cost || 0);
        }
        return sum;
      }, 0);
      return total + custoTotal;
    }, 0);
  }, [inventoryItems, startDate, endDate]);

  const imposto = grossSales * 0.1;
  const despesasFixas = useMemo(() => {
    return releaseOtherOperations.filter(op => op.description?.includes('$fixa$')).reduce((sum, op) => sum + op.amount, 0);
  }, [releaseOtherOperations]);

  const despesasVariaveis = useMemo(() => {
    return releaseOtherOperations.filter(op => !op.description?.includes('$fixa$')).reduce((sum, op) => sum + op.amount, 0);
  }, [releaseOtherOperations]);

  const lucroProdutos = repassePrevisto - cmv;
  const lucroOperacional = lucroProdutos - despesasFixas;
  const prejuizoProdutos = refundedAmount;
  const resultadoLiquido = lucroOperacional - despesasVariaveis - prejuizoProdutos;

  const linhas = [
    { label: 'Faturamento Bruto', value: grossSales },
    { label: 'Taxas ML', value: totalMLFees },
    { label: 'Repasse Previsto', value: repassePrevisto },
    { label: 'Vendas Reembolsadas', value: refundedAmount },
    { label: 'Vendas Não Liberadas', value: naoLiberadas },
    { label: 'CMV', value: cmv },
    { label: 'Imposto (10%)', value: imposto },
    { label: 'Publicidade', value: totalAdvertisingCost },
    { label: 'Lucro sobre Produtos', value: lucroProdutos },
    { label: 'Despesas Fixas', value: despesasFixas },
    { label: 'Lucro Operacional', value: lucroOperacional },
    { label: 'Despesas Variáveis', value: despesasVariaveis },
    { label: 'Prejuízo com Produtos e Vendas', value: prejuizoProdutos },
    { label: 'Resultado Líquido do Exercício', value: resultadoLiquido },
  ];

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor (R$)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((linha, index) => (
            <TableRow key={index}>
              <TableCell>{linha.label}</TableCell>
              <TableCell className="text-right">{formatCurrency(linha.value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
