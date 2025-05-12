// src/components/financeiro/ReleasePopup.tsx

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReleaseOperation } from "@/types/ReleaseOperation";

interface ReleasePopupProps {
  open: boolean;
  onClose: () => void;
  operationsWithOrder: ReleaseOperation[];
  otherOperations: ReleaseOperation[];
}

export const ReleasePopup: React.FC<ReleasePopupProps> = ({
  open,
  onClose,
  operationsWithOrder,
  otherOperations
}) => {
  // Debug logs to help troubleshoot
  useEffect(() => {
    if (open) {
      console.log("ReleasePopup opened with data:", { 
        operationsWithOrder, 
        otherOperations,
        operationsCount: operationsWithOrder.length,
        otherCount: otherOperations.length
      });
    }
  }, [open, operationsWithOrder, otherOperations]);

  // Função para agrupar operações pelo orderId
  const groupOperationsByOrderId = (operations: ReleaseOperation[]): ReleaseOperation[] => {
    if (!operations || operations.length === 0) {
      console.log("No operations with order to group");
      return [];
    }
    
    console.log("Grouping operations by orderId:", operations);
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
    if (!operations || operations.length === 0) {
      console.log("No other operations to group");
      return [];
    }
    
    console.log("Grouping operations by description:", operations);
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

  // Função para agrupar operações pelo sourceId (nova funcionalidade)
  const groupOperationsBySourceId = (operations: ReleaseOperation[]): ReleaseOperation[] => {
    if (!operations || operations.length === 0) {
      console.log("No operations to group by sourceId");
      return [];
    }
    
    console.log("Grouping operations by sourceId:", operations);
    const groupedMap = new Map<string, ReleaseOperation>();
    
    operations.forEach(op => {
      // Skip operations without sourceId
      if (!op.sourceId) {
        console.log("Operation without sourceId:", op);
        return;
      }
      
      const key = op.sourceId;
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.amount += op.amount;
        // Keep the most informative description
        if (op.description && (!existing.description || existing.description.length < op.description.length)) {
          existing.description = op.description;
        }
        // Keep order info if available
        if (op.orderId && !existing.orderId) {
          existing.orderId = op.orderId;
        }
        if (op.itemId && !existing.itemId) {
          existing.itemId = op.itemId;
        }
        if (op.title && !existing.title) {
          existing.title = op.title;
        }
      } else {
        groupedMap.set(key, {...op});
      }
    });
    
    return Array.from(groupedMap.values());
  };
  
  // Use the sourceId grouping logic for both types of operations
  const allOperations = [...operationsWithOrder, ...otherOperations];
  console.log("All operations before grouping:", allOperations);
  
  // Group all operations by sourceId
  const groupedBySourceId = groupOperationsBySourceId(allOperations);
  console.log("Operations grouped by sourceId:", groupedBySourceId);
  
  // Now separate them into operations with order and other operations
  const groupedOperationsWithOrder = groupedBySourceId.filter(op => op.orderId);
  const groupedOtherOperations = groupedBySourceId.filter(op => !op.orderId);
  
  console.log("Final grouped operations:", {
    groupedOperationsWithOrder,
    groupedOtherOperations
  });
  
  // Calculate totals based on the grouped operations
  const totalOperationsWithOrder = groupedOperationsWithOrder.reduce((sum, op) => sum + op.amount, 0);
  const totalOtherOperations = groupedOtherOperations.reduce((sum, op) => sum + op.amount, 0);
  const grandTotal = totalOperationsWithOrder + totalOtherOperations;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>Detalhamento de Valor Liberado na Conta</DialogTitle>
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
                {groupedOperationsWithOrder.length > 0 ? (
                  groupedOperationsWithOrder.map((op, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 border">{op.orderId || '-'}</td>
                      <td className="p-2 border">{op.itemId || '-'}</td>
                      <td className="p-2 border">{op.title || '-'}</td>
                      <td className="p-2 border">R$ {op.amount.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-2 border text-center">Nenhuma operação com ORDER_ID encontrada</td>
                  </tr>
                )}
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
                {groupedOtherOperations.length > 0 ? (
                  groupedOtherOperations.map((op, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 border">{op.description || '-'}</td>
                      <td className="p-2 border">R$ {op.amount.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-2 border text-center">Nenhuma operação sem ORDER_ID encontrada</td>
                  </tr>
                )}
                <tr className="font-semibold bg-gray-50">
                  <td className="p-2 border text-right">Total:</td>
                  <td className="p-2 border">R$ {totalOtherOperations.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div className="mt-4 p-2 bg-gray-100 rounded border">
              <p className="font-bold text-right">Valor Total Liberado: R$ {grandTotal.toFixed(2)}</p>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
