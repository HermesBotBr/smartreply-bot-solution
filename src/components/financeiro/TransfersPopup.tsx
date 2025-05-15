
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReleaseOperation } from "@/types/ReleaseOperation";

interface TransfersPopupProps {
  open: boolean;
  onClose: () => void;
  transfers: ReleaseOperation[];
}

export const TransfersPopup: React.FC<TransfersPopupProps> = ({
  open,
  onClose,
  transfers
}) => {
  const totalAmount = transfers.reduce((sum, op) => sum + op.amount, 0);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Transferências</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 max-h-[500px] overflow-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Descrição</th>
                <th className="p-2 border">Data</th>
                <th className="p-2 border">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((op, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-2 border">{op.description || '-'}</td>
                  <td className="p-2 border">{op.date || '-'}</td>
                  <td className="p-2 border">R$ {op.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td colSpan={2} className="p-2 border text-right">Total:</td>
                <td className="p-2 border">R$ {totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
