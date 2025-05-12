
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { TransactionsList } from './TransactionsList';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";

interface TransfersPopupProps {
  open: boolean;
  onClose: () => void;
  transfers: ReleaseOperation[];
  onUpdateTransferDescription: (sourceId: string, description: string, value: number) => void;
}

interface TransferDescriptionForm {
  description: string;
  value: number;
}

export const TransfersPopup: React.FC<TransfersPopupProps> = ({
  open,
  onClose,
  transfers,
  onUpdateTransferDescription
}) => {
  // State for selected transfer for description editing
  const [selectedTransfer, setSelectedTransfer] = useState<{
    sourceId: string;
    value: number;
    remainingValue: number;
  } | null>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  
  // Setup form for description input
  const form = useForm<TransferDescriptionForm>({
    defaultValues: {
      description: '',
      value: 0
    }
  });

  // Group transfers by description for summary
  const transfersByDescription = transfers.reduce((acc: Record<string, number>, transfer) => {
    const description = transfer.description || 'Sem descrição';
    if (!acc[description]) acc[description] = 0;
    acc[description] += transfer.amount;
    return acc;
  }, {});

  // Convert to transactions for the TransactionsList component
  const transferTransactions = transfers.map(transfer => ({
    date: '',
    sourceId: transfer.sourceId || '',
    descriptions: [transfer.description || 'Transferência'],
    group: 'Transferência',
    value: transfer.amount
  }));

  // Group transfers by sourceId to calculate total and described values
  const transfersBySourceId = transfers.reduce((acc: Record<string, {total: number, described: number}>, transfer) => {
    const sourceId = transfer.sourceId || '';
    if (!acc[sourceId]) {
      acc[sourceId] = { total: 0, described: 0 };
    }
    acc[sourceId].total += transfer.amount;
    
    // Only count as described if it has a non-default description
    if (transfer.description && transfer.description !== 'Transferência') {
      acc[sourceId].described += transfer.amount;
    }
    
    return acc;
  }, {});

  const handleTransactionClick = (sourceId: string, totalValue: number) => {
    // Calculate remaining value
    const transferGroup = transfersBySourceId[sourceId];
    
    // IMPORTANT FIX: Use the total value as remaining value if no descriptions exist
    // or subtract only the described amount from the total
    const remainingValue = transferGroup ? (transferGroup.total - transferGroup.described) : totalValue;
    
    setSelectedTransfer({
      sourceId,
      value: totalValue,
      remainingValue
    });
    
    // IMPORTANT FIX: Initialize the form with the actual remaining value
    form.setValue('value', remainingValue);
    
    setIsDescriptionModalOpen(true);
  };

  const onDescriptionSubmit = (data: TransferDescriptionForm) => {
    if (!selectedTransfer) return;
    
    if (data.value <= 0) {
      toast.error("O valor deve ser maior que zero");
      return;
    }
    
    if (data.value > selectedTransfer.remainingValue) {
      toast.error(`O valor não pode exceder o valor restante (${formatCurrency(selectedTransfer.remainingValue)})`);
      return;
    }
    
    onUpdateTransferDescription(selectedTransfer.sourceId, data.description, data.value);
    
    // Reset form and close modal
    form.reset();
    setIsDescriptionModalOpen(false);
    setSelectedTransfer(null);
    
    toast.success("Descrição adicionada com sucesso");
  };

  // Check if there are any undescribed transfers
  const hasUndescribedTransfers = Object.values(transfersBySourceId).some(
    transfer => transfer.described < transfer.total
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhamento de Transferências</DialogTitle>
            <DialogDescription>
              Lista de todas as transferências registradas no período selecionado
              {hasUndescribedTransfers && (
                <Badge variant="destructive" className="ml-2">
                  Descrições pendentes
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Resumo por tipo</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(transfersByDescription).map(([description, amount], index) => (
                    <TableRow key={index}>
                      <TableCell>{description}</TableCell>
                      <TableCell className={`text-right ${amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {formatCurrency(amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Lista de Transferências</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clique em uma transferência para adicionar ou editar sua descrição
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SOURCE_ID</TableHead>
                      <TableHead>Descrições</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(transfersBySourceId).map(([sourceId, { total, described }]) => {
                      const isFullyDescribed = described >= total;
                      const transaction = transferTransactions.find(t => t.sourceId === sourceId);
                      
                      if (!transaction) return null;
                      
                      return (
                        <TableRow 
                          key={sourceId}
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleTransactionClick(sourceId, total)}
                        >
                          <TableCell>{sourceId}</TableCell>
                          <TableCell>
                            {transfers
                              .filter(t => t.sourceId === sourceId && t.description && t.description !== 'Transferência')
                              .map((t, idx) => (
                                <div key={idx} className="mb-1 last:mb-0">
                                  {t.description} <span className="text-gray-500">({formatCurrency(t.amount)})</span>
                                </div>
                              ))}
                            {!isFullyDescribed && <span className="text-gray-400 italic">Descrição incompleta</span>}
                          </TableCell>
                          <TableCell>Transferência</TableCell>
                          <TableCell className={`text-right ${total < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {formatCurrency(total)}
                          </TableCell>
                          <TableCell className="text-right">
                            {isFullyDescribed ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Completo
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                {described > 0 ? `${Math.round((described/total)*100)}%` : 'Pendente'}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Description Input Dialog */}
      <Dialog open={isDescriptionModalOpen} onOpenChange={setIsDescriptionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Descrição</DialogTitle>
            <DialogDescription>
              {selectedTransfer && (
                <div className="text-sm mt-2">
                  <p>SOURCE_ID: <span className="font-medium">{selectedTransfer.sourceId}</span></p>
                  <p>Valor Total: <span className="font-medium">{formatCurrency(selectedTransfer.value)}</span></p>
                  <p>Valor Restante: <span className="font-medium">{formatCurrency(selectedTransfer.remainingValue)}</span></p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onDescriptionSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Digite a descrição desta transferência" 
                        {...field} 
                        className="min-h-[80px]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDescriptionModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar Descrição</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
