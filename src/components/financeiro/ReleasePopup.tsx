
// src/components/financeiro/ReleasePopup.tsx

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReleaseOperation } from "@/types/ReleaseOperation";
import { SettlementTransaction } from "@/hooks/useSettlementData";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

interface ReleasePopupProps {
  open: boolean;
  onClose: () => void;
  operationsWithOrder: ReleaseOperation[];
  otherOperations: ReleaseOperation[];
  settlementTransactions?: SettlementTransaction[]; // Adicionar transações de vendas
  startDate?: Date; // Data inicial do filtro
  endDate?: Date; // Data final do filtro
  filterBySettlement?: boolean; // Add filter toggle prop
}

export const ReleasePopup: React.FC<ReleasePopupProps> = ({
  open,
  onClose,
  operationsWithOrder,
  otherOperations,
  settlementTransactions = [], // Valor padrão de array vazio
  startDate,
  endDate,
  filterBySettlement = false
}) => {
  useEffect(() => {
    if (open) {
      console.log("ReleasePopup aberto com dados:", { 
        operationsWithOrder, 
        otherOperations, 
        settlementTransactions,
        pendingOperations: getPendingOperations(),
        startDate,
        endDate,
        filterBySettlement
      });
    }
  }, [open]);

  // Função para verificar se uma data está dentro do intervalo selecionado
  const isDateInRange = (dateStr?: string): boolean => {
    if (!dateStr || !startDate || !endDate) return true;
    
    const date = new Date(dateStr);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return date >= start && date <= end;
  };

  // Filtrar operações com base na data
  const filteredOperationsWithOrder = operationsWithOrder.filter(op => isDateInRange(op.date));
  const filteredOtherOperations = otherOperations.filter(op => isDateInRange(op.date));

  // Função para agrupar operações pelo orderId
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

  // Função para agrupar operações pelo tipo de descrição
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

  // Função para identificar operações pendentes (presentes em settlement mas não em operações liberadas)
  const getPendingOperations = (): ReleaseOperation[] => {
    if (!settlementTransactions || settlementTransactions.length === 0) {
      return [];
    }

    // Extrair todos os orderIds das operações já liberadas
    const liberatedOrderIds = new Set(operationsWithOrder.map(op => op.orderId));
    
    // Filtrar as transações de settlement que não estão nas operações liberadas
    const pendingOps = settlementTransactions
      .filter(transaction => 
        transaction.orderId && 
        !liberatedOrderIds.has(transaction.orderId))
      .map(transaction => ({
        orderId: transaction.orderId,
        itemId: transaction.itemId || '',
        title: transaction.title || '',
        amount: transaction.netValue || 0,
        description: 'Venda aguardando liberação'
      }));

    // If filter is active, ensure pending operations are only from our settlement transactions
    if (filterBySettlement) {
      const settlementOrderIds = new Set(settlementTransactions.map(t => t.orderId));
      return pendingOps.filter(op => op.orderId && settlementOrderIds.has(op.orderId));
    }

    return pendingOps;
  };

  // Agrupe as operações
  const groupedOperationsWithOrder = groupOperationsByOrderId(filteredOperationsWithOrder);
  const groupedOtherOperations = groupOperationsByDescription(filteredOtherOperations);
  const pendingOperations = getPendingOperations();
  
  // Calcule os totais
  const totalOperationsWithOrder = groupedOperationsWithOrder.reduce((sum, op) => sum + op.amount, 0);
  const totalOtherOperations = groupedOtherOperations.reduce((sum, op) => sum + op.amount, 0);
  const totalPendingOperations = pendingOperations.reduce((sum, op) => sum + op.amount, 0);
  const grandTotal = totalOperationsWithOrder + totalOtherOperations;

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
            
            <div className="mt-4 p-2 bg-gray-100 rounded border">
              <p className="font-bold text-right">Valor Total Liberado: R$ {grandTotal.toFixed(2)}</p>
              {pendingOperations.length > 0 && (
                <p className="font-bold text-right text-amber-600">Valor Total Pendente: R$ {totalPendingOperations.toFixed(2)}</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
