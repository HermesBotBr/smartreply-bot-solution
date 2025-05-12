// src/components/financeiro/ReleasePopup.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReleaseOperation {
  orderId?: string;
  itemId?: string;
  title?: string;
  amount: number;
  description?: string;
}

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
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>Detalhamento de Valor Liberado na Conta</DialogTitle>
        </DialogHeader>

        <div className="mt-4 max-h-[500px] overflow-auto">
          <ScrollArea className="w-full">
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
                {operationsWithOrder.map((op, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2 border">{op.orderId || '-'}</td>
                    <td className="p-2 border">{op.itemId || '-'}</td>
                    <td className="p-2 border">{op.title || '-'}</td>
                    <td className="p-2 border">R$ {op.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4 className="font-semibold text-base mt-6 mb-2">Outras Operações (sem ORDER_ID)</h4>
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">Descrição</th>
                  <th className="p-2 border">Valor</th>
                </tr>
              </thead>
              <tbody>
                {otherOperations.map((op, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2 border">{op.description || '-'}</td>
                    <td className="p-2 border">R$ {op.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
