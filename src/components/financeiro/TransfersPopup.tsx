
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { TransactionsList } from './TransactionsList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface TransfersPopupProps {
  open: boolean;
  onClose: () => void;
  transfers: ReleaseOperation[];
}

interface TransferDescription {
  description: string;
  value: number;
}

interface TransferWithDescriptions extends ReleaseOperation {
  manualDescriptions: TransferDescription[];
}

export const TransfersPopup: React.FC<TransfersPopupProps> = ({
  open,
  onClose,
  transfers
}) => {
  const [transfersWithDescriptions, setTransfersWithDescriptions] = useState<TransferWithDescriptions[]>(() => 
    transfers.map(transfer => ({
      ...transfer,
      manualDescriptions: []
    }))
  );
  
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState("");
  const [newValue, setNewValue] = useState("");
  
  // Update the transfers state when the transfers prop changes
  React.useEffect(() => {
    setTransfersWithDescriptions(
      transfers.map(transfer => {
        const existingTransfer = transfersWithDescriptions.find(
          t => t.sourceId === transfer.sourceId
        );
        
        return {
          ...transfer,
          manualDescriptions: existingTransfer?.manualDescriptions || []
        };
      })
    );
  }, [transfers]);

  // Group transfers by description for summary
  const transfersByDescription = transfersWithDescriptions.reduce((acc: Record<string, number>, transfer) => {
    const description = transfer.description || 'Sem descrição';
    if (!acc[description]) acc[description] = 0;
    acc[description] += transfer.amount;
    return acc;
  }, {});

  const handleAddDescription = (transferId: string) => {
    if (!newDescription.trim() || !newValue.trim()) return;
    
    const numericValue = parseFloat(newValue.replace(',', '.'));
    if (isNaN(numericValue)) return;
    
    setTransfersWithDescriptions(prevTransfers => 
      prevTransfers.map(transfer => {
        if (transfer.sourceId === transferId) {
          return {
            ...transfer,
            manualDescriptions: [
              ...transfer.manualDescriptions,
              {
                description: newDescription,
                value: numericValue
              }
            ]
          };
        }
        return transfer;
      })
    );
    
    setNewDescription("");
    setNewValue("");
    setActiveTransferId(null);
  };

  // Calculate declared total for a transfer
  const getDeclaredTotal = (transfer: TransferWithDescriptions) => {
    return transfer.manualDescriptions.reduce((sum, desc) => sum + desc.value, 0);
  };

  // Convert to transactions for the TransactionsList component
  const transferTransactions = transfersWithDescriptions.map(transfer => {
    // Collect all descriptions
    const allDescriptions = [transfer.description || 'Transferência'];
    transfer.manualDescriptions.forEach(desc => {
      allDescriptions.push(desc.description);
    });
    
    // Calculate the total declared amount
    const totalDeclared = getDeclaredTotal(transfer);
    
    return {
      date: '',
      sourceId: transfer.sourceId || '',
      descriptions: allDescriptions,
      group: 'Transferência',
      value: transfer.amount,
      totalDeclared: totalDeclared,
      manualDescriptions: transfer.manualDescriptions
    };
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhamento de Transferências</DialogTitle>
          <DialogDescription>
            Lista de todas as transferências registradas no período selecionado
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
            <TransactionsList 
              transactions={transferTransactions}
              renderActions={(transaction) => (
                <Popover 
                  open={activeTransferId === transaction.sourceId} 
                  onOpenChange={(open) => {
                    if (open) {
                      setActiveTransferId(transaction.sourceId);
                    } else {
                      setActiveTransferId(null);
                    }
                    setNewDescription("");
                    setNewValue("");
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2"
                      onClick={() => setActiveTransferId(transaction.sourceId)}
                    >
                      Adicionar Descrição
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Adicionar Descrição</h4>
                      <p className="text-sm text-muted-foreground">
                        SOURCE_ID: {transaction.sourceId}
                      </p>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Descrição"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder="Valor"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => handleAddDescription(transaction.sourceId)}
                        >
                          Salvar
                        </Button>
                      </div>
                      
                      {transaction.manualDescriptions && transaction.manualDescriptions.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium mb-2">Descrições adicionadas:</h5>
                          <div className="space-y-2">
                            {transaction.manualDescriptions.map((desc, idx) => (
                              <div key={idx} className="text-sm flex justify-between items-center">
                                <span>{desc.description}</span>
                                <Badge variant={desc.value < 0 ? "destructive" : "default"}>
                                  {formatCurrency(desc.value)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
