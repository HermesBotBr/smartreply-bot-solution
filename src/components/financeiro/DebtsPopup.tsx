// src/components/financeiro/DebtsPopup.tsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReleaseOperation } from "@/types/ReleaseOperation";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

interface DebtsPopupProps {
  open: boolean;
  onClose: () => void;
  debtOperations: ReleaseOperation[];
  startDate?: Date;
  endDate?: Date;
}

export const DebtsPopup: React.FC<DebtsPopupProps> = ({
  open,
  onClose,
  debtOperations,
  startDate,
  endDate,
}) => {
const totalDebt = debtOperations.reduce(
  (sum, op) => sum + ((op.netCreditAmount || 0) - (op.netDebitAmount || 0)),
  0
);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Detalhamento de Dívidas</DialogTitle>
          {startDate && endDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Período: {startDate.toLocaleDateString("pt-BR")} até {endDate.toLocaleDateString("pt-BR")}
            </p>
          )}
        </DialogHeader>

        <div className="mt-4 max-h-[500px] overflow-auto">
          <ScrollArea className="w-full">
            <table className="w-full border text-sm mb-4">
  <thead>
    <tr className="bg-gray-100 text-left">
      <th className="p-2 border">Data e hora</th>
      <th className="p-2 border">SOURCE_ID</th>
      <th className="p-2 border">Descrições</th>
      <th className="p-2 border">Grupo</th>
      <th className="p-2 border">Valor</th>
    </tr>
  </thead>
  <tbody>
    {debtOperations.map((op, idx) => (
      <tr key={idx} className="hover:bg-gray-50">
        <td className="p-2 border">
          {op.date ? new Date(op.date).toLocaleString("pt-BR", { hour12: false }) : "-"}
        </td>
        <td className="p-2 border">{op.sourceId || "-"}</td>
        <td className="p-2 border">{op.description || "-"}</td>
        <td className="p-2 border">{op.group || "-"}</td>
        <td className="p-2 border text-purple-800">
  R$ {((op.netCreditAmount || 0) - (op.netDebitAmount || 0)).toFixed(2)}
</td>

      </tr>
    ))}
    <tr className="font-semibold bg-gray-50">
      <td colSpan={4} className="p-2 border text-right">Total:</td>
      <td className="p-2 border text-purple-800">R$ {totalDebt.toFixed(2)}</td>
    </tr>
  </tbody>
</table>

          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
