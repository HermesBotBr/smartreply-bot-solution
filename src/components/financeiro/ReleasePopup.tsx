
// src/components/financeiro/ReleasePopup.tsx

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReleaseOperation } from "@/types/ReleaseOperation";
import { SettlementTransaction } from "@/hooks/useSettlementData";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ReleasePopupProps {
  open: boolean;
  onClose: () => void;
  operationsWithOrder: ReleaseOperation[];
  otherOperations: ReleaseOperation[];
  settlementTransactions?: SettlementTransaction[];
  startDate?: Date;
  endDate?: Date;
  filterBySettlement?: boolean;
}

export const ReleasePopup: React.FC<ReleasePopupProps> = ({
  open,
  onClose,
  operationsWithOrder,
  otherOperations,
  settlementTransactions = [],
  startDate,
  endDate,
  filterBySettlement = false
}) => {
  const [mismatchWarning, setMismatchWarning] = useState(false);

  useEffect(() => {
    if (open) {
      console.log("ReleasePopup aberto com dados:", { 
        operationsWithOrder, 
        otherOperations, 
        settlementTransactions,
        pendingOperations: getPendingOperations(),
        refundedOperations: getRefundedOperations(),
        startDate,
        endDate,
        filterBySettlement
      });
      
      validateTotals();
    }
  }, [open, settlementTransactions, operationsWithOrder]);

  const validateTotals = () => {
    if (!settlementTransactions || settlementTransactions.length === 0) {
      setMismatchWarning(false);
      return;
    }

    const totalSettlementValue = settlementTransactions.reduce((sum, t) => sum + (t.netValue || 0), 0);
    
    // Usar o mesmo cálculo do card "Liberado" - soma direta das operações filtradas por data
    const totalReleased = filteredOperationsWithOrder.reduce((sum, op) => sum + op.amount, 0);
    const totalPending = getPendingOperations().reduce((sum, op) => sum + op.amount, 0);
    const totalRefunded = getRefundedOperations().reduce((sum, op) => sum + op.amount, 0);
    const combinedTotal = totalReleased + totalPending + totalRefunded;
    
    const hasMismatch = Math.abs(totalSettlementValue - combinedTotal) > 0.01;
    
    setMismatchWarning(hasMismatch);
    
    if (hasMismatch) {
      console.warn("Discrepância detectada nos totais:", {
        totalSettlementValue,
        combinedTotal,
        difference: totalSettlementValue - combinedTotal
      });
    }
  };

  const isDateInRange = (dateStr?: string): boolean => {
    if (!dateStr || !startDate || !endDate) return true;
    
    const date = new Date(dateStr);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return date >= start && date <= end;
  };

  // Filtrar operações com base na data - MESMA LÓGICA DO CARD "LIBERADO"
  const filteredOperationsWithOrder = operationsWithOrder.filter(op => isDateInRange(op.date));
  const filteredOtherOperations = otherOperations.filter(op => isDateInRange(op.date));

  console.log("=== RELEASE POPUP DEBUG ===");
  console.log("operationsWithOrder total:", operationsWithOrder.length);
  console.log("filteredOperationsWithOrder:", filteredOperationsWithOrder.length);
  console.log("filteredOperationsWithOrder total value:", filteredOperationsWithOrder.reduce((sum, op) => sum + op.amount, 0));

  const groupOperationsByOrderId = (operations: ReleaseOperation[]): ReleaseOperation[] => {
    const groupedMap = new Map<string, ReleaseOperation>();
    
    operations.forEach(op => {
      if (!op.orderId) return;
      
      const key = op.orderId;
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.amount += op.amount;
      } else {
        groupedMap.set(key, {...op});
      }
    });
    
    return Array.from(groupedMap.values());
  };

  const groupOperationsByDescription = (operations: ReleaseOperation[]): ReleaseOperation[] => {
    const groupedMap = new Map<string, ReleaseOperation>();
    
    operations.forEach(op => {
      const key = op.description || 'Sem descrição';
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.amount += op.amount;
      } else {
        groupedMap.set(key, {...op});
      }
    });
    
    return Array.from(groupedMap.values());
  };

  const getPendingOperations = (): ReleaseOperation[] => {
    if (!settlementTransactions || settlementTransactions.length === 0) {
      return [];
    }

    const liberatedOrderIds = new Set(operationsWithOrder.map(op => op.orderId));
    
    const pendingOps = settlementTransactions
      .filter(transaction => 
        transaction.orderId && 
        !liberatedOrderIds.has(transaction.orderId) &&
        !transaction.isRefunded &&
        (filterBySettlement ? isDateInRange(transaction.date) : true)
      )
      .map(transaction => ({
        orderId: transaction.orderId,
        itemId: transaction.itemId || '',
        title: transaction.title || '',
        amount: transaction.netValue || 0,
        description: 'Venda aguardando liberação',
        date: transaction.date
      }));

    return pendingOps;
  };

  const getRefundedOperations = (): ReleaseOperation[] => {
    if (!settlementTransactions || settlementTransactions.length === 0) {
      return [];
    }
    
    const refundedOps = settlementTransactions
      .filter(transaction => 
        transaction.isRefunded &&
        (filterBySettlement ? isDateInRange(transaction.date) : true)
      )
      .map(transaction => ({
        orderId: transaction.orderId,
        itemId: transaction.itemId || '',
        title: transaction.title || '',
        amount: transaction.netValue || 0,
        description: 'Venda reembolsada',
        date: transaction.date
      }));
    
    return refundedOps;
  };

  const refundedOperations = getRefundedOperations();
  
  // MUDANÇA PRINCIPAL: Usar diretamente as operações filtradas por data, SEM filtrar reembolsos
  // Esta é a mesma lógica usada no card "Liberado"
  const groupedOperationsWithOrder = groupOperationsByOrderId(filteredOperationsWithOrder);

  const groupedOtherOperations = groupOperationsByDescription(filteredOtherOperations);
  const pendingOperations = getPendingOperations();
  
  // Calcular totais
  const totalOperationsWithOrder = groupedOperationsWithOrder.reduce((sum, op) => sum + op.amount, 0);
  const totalOtherOperations = groupedOtherOperations.reduce((sum, op) => sum + op.amount, 0);
  const totalPendingOperations = pendingOperations.reduce((sum, op) => sum + op.amount, 0);
  const totalRefundedOperations = refundedOperations.reduce((sum, op) => sum + op.amount, 0);
  const grandTotal = totalOperationsWithOrder + totalOtherOperations;
  const settlementTotal = settlementTransactions?.reduce((sum, t) => sum + (t.netValue || 0), 0) || 0;
  const allTablesTotal = totalOperationsWithOrder + totalPendingOperations + totalRefundedOperations;

  console.log("=== TOTAIS CALCULADOS ===");
  console.log("totalOperationsWithOrder (deve ser igual ao card Liberado):", totalOperationsWithOrder);
  console.log("grandTotal:", grandTotal);
  console.log("settlementTotal:", settlementTotal);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>Detalhamento de Valor Liberado na Conta</DialogTitle>
          {startDate && endDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Período: {startDate.toLocaleDateString('pt-BR')} até {endDate.toLocaleDateString('pt-BR')}
              {filterBySettlement && <span className="ml-1 text-blue-500 font-medium">(Filtrado pelo período)</span>}
            </p>
          )}
        </DialogHeader>

        <div className="mt-4 max-h-[500px] overflow-auto">
          <ScrollArea className="w-full">
            <h4 className="font-semibold text-base mb-2">Operações com ORDER_ID</h4>
            <table className="w-full border text-sm mb-4">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">ORDER_ID</th>
                  <th className="p-2 border">ID do Anúncio</th>
                  <th className="p-2 border">Título do Anúncio</th>
                  <th className="p-2 border">Valor Liberado</th>
                </tr>
              </thead>
              <tbody>
                {groupedOperationsWithOrder.map((op, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2 border">{op.orderId || '-'}</td>
                    <td className="p-2 border">{op.itemId || '-'}</td>
                    <td className="p-2 border">{op.title || '-'}</td>
                    <td className="p-2 border">R$ {op.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-semibold bg-gray-50">
                  <td colSpan={3} className="p-2 border text-right">Total:</td>
                  <td className="p-2 border">R$ {totalOperationsWithOrder.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <h4 className="font-semibold text-base mt-6 mb-2">Outras Operações (sem ORDER_ID)</h4>
            <table className="w-full border text-sm mb-4">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">Descrição</th>
                  <th className="p-2 border">Valor</th>
                </tr>
              </thead>
              <tbody>
                {groupedOtherOperations.map((op, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2 border">{op.description || '-'}</td>
                    <td className="p-2 border">R$ {op.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-semibold bg-gray-50">
                  <td className="p-2 border text-right">Total:</td>
                  <td className="p-2 border">R$ {totalOtherOperations.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            {pendingOperations.length > 0 && (
              <>
                <h4 className="font-semibold text-base mt-6 mb-2">Operações com ORDER_ID ainda não liberadas</h4>
                <table className="w-full border text-sm mb-4">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-2 border">ORDER_ID</th>
                      <th className="p-2 border">ID do Anúncio</th>
                      <th className="p-2 border">Título do Anúncio</th>
                      <th className="p-2 border">Valor Pendente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOperations.map((op, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 border">{op.orderId || '-'}</td>
                        <td className="p-2 border">{op.itemId || '-'}</td>
                        <td className="p-2 border">{op.title || '-'}</td>
                        <td className="p-2 border">R$ {op.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-gray-50">
                      <td colSpan={3} className="p-2 border text-right">Total Pendente:</td>
                      <td className="p-2 border">R$ {totalPendingOperations.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
            
            {refundedOperations.length > 0 && (
              <>
                <h4 className="font-semibold text-base mt-6 mb-2">Operações reembolsadas</h4>
                <table className="w-full border text-sm mb-4">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-2 border">ORDER_ID</th>
                      <th className="p-2 border">ID do Anúncio</th>
                      <th className="p-2 border">Título do Anúncio</th>
                      <th className="p-2 border">Valor Reembolsado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundedOperations.map((op, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 border">{op.orderId || '-'}</td>
                        <td className="p-2 border">{op.itemId || '-'}</td>
                        <td className="p-2 border">{op.title || '-'}</td>
                        <td className="p-2 border text-red-500">R$ {op.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-gray-50">
                      <td colSpan={3} className="p-2 border text-right">Total Reembolsado:</td>
                      <td className="p-2 border text-red-500">R$ {totalRefundedOperations.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
            
            <div className="mt-6 p-4 bg-slate-50 rounded border">
              <h4 className="font-semibold text-base mb-2">Validação de Totais</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Total de Repasses:</p>
                  <p className="text-xl font-bold">R$ {settlementTotal.toFixed(2)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Total Combinado das Tabelas:</p>
                  <p className="text-xl font-bold">R$ {allTablesTotal.toFixed(2)}</p>
                </div>
              </div>
              
              {mismatchWarning && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Atenção: Há uma discrepância entre o total de repasses e o somatório das tabelas acima.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="mt-4 p-2 bg-gray-100 rounded border">
              <p className="font-bold text-right">Valor Total Liberado: R$ {grandTotal.toFixed(2)}</p>
              {pendingOperations.length > 0 && (
                <p className="font-bold text-right text-amber-600">Valor Total Pendente: R$ {totalPendingOperations.toFixed(2)}</p>
              )}
              {refundedOperations.length > 0 && (
                <p className="font-bold text-right text-red-500">Valor Total Reembolsado: R$ {totalRefundedOperations.toFixed(2)}</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
