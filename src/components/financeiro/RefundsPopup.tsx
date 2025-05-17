
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReleaseOperation } from "@/types/ReleaseOperation";

interface RefundsPopupProps {
  open: boolean;
  onClose: () => void;
  refundedOperations: ReleaseOperation[];
  startDate?: Date;
  endDate?: Date;
}

export const RefundsPopup: React.FC<RefundsPopupProps> = ({
  open,
  onClose,
  refundedOperations,
  startDate,
  endDate
}) => {
  // Calculate total refunded amount
  const totalRefunded = refundedOperations.reduce((sum, op) => sum + op.amount, 0);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>Detalhamento de reembolsos</DialogTitle>
          {startDate && endDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Período: {startDate.toLocaleDateString('pt-BR')} até {endDate.toLocaleDateString('pt-BR')}
            </p>
          )}
        </DialogHeader>
        
        <div className="mt-4 max-h-[500px] overflow-auto">
          <ScrollArea className="w-full">
            {/* Refunded Operations Table */}
            <h4 className="font-semibold text-base mb-2">Operações reembolsadas</h4>
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
                  <td className="p-2 border text-red-500">R$ {totalRefunded.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
