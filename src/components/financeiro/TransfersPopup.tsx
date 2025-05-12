
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { TransactionsList } from './TransactionsList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useMlToken } from '@/hooks/useMlToken';
import { getNgrokUrl } from '@/config/api';

interface TransfersPopupProps {
  open: boolean;
  onClose: () => void;
  transfers: ReleaseOperation[];
}

interface TransferDescription {
  id?: number;
  description: string;
  value: number;
  source_id?: string;
  seller_id?: string;
  descricao?: string;
  valor?: string;
}

interface TransferWithDescriptions extends ReleaseOperation {
  manualDescriptions: TransferDescription[];
}

export const TransfersPopup: React.FC<TransfersPopupProps> = ({
  open,
  onClose,
  transfers
}) => {
  const [transfersWithDescriptions, setTransfersWithDescriptions] = useState<TransferWithDescriptions[]>([]);
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState("");
  const [newValue, setNewValue] = useState("");
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the seller_id
  const mlToken = useMlToken();
  const sellerId = mlToken && typeof mlToken === 'object' && 'seller_id' in mlToken 
    ? (mlToken as { seller_id: string }).seller_id 
    : null;
  
  // Fetch descriptions from API when popup opens or transfers change
  useEffect(() => {
    if (open && sellerId) {
      fetchDescriptions();
    }
  }, [open, transfers, sellerId]);

  const fetchDescriptions = async () => {
    if (!sellerId) {
      toast.error("ID do vendedor não encontrado");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(getNgrokUrl(`/trans_desc?seller_id=${sellerId}`));
      const descriptions = response.data;
      
      // Map API responses to our internal format
      const descriptionsMap: Record<string, TransferDescription[]> = {};
      
      descriptions.forEach((desc: any) => {
        const sourceId = desc.source_id;
        if (!descriptionsMap[sourceId]) {
          descriptionsMap[sourceId] = [];
        }
        
        descriptionsMap[sourceId].push({
          id: desc.id,
          description: desc.descricao,
          value: parseFloat(desc.valor),
          source_id: desc.source_id,
          seller_id: desc.seller_id
        });
      });
      
      // Add descriptions to transfers
      setTransfersWithDescriptions(
        transfers.map(transfer => {
          const sourceId = transfer.sourceId || '';
          return {
            ...transfer,
            manualDescriptions: descriptionsMap[sourceId] || []
          };
        })
      );
    } catch (error) {
      console.error("Error fetching descriptions:", error);
      toast.error("Falha ao carregar descrições");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDescription = async () => {
    if (!activeTransferId || !newDescription.trim() || !newValue.trim() || !sellerId) return;
    
    const numericValue = parseFloat(newValue.replace(',', '.'));
    if (isNaN(numericValue)) return;
    
    setIsLoading(true);
    try {
      // Save to API
      const payload = {
        seller_id: sellerId,
        source_id: activeTransferId,
        descricao: newDescription,
        valor: numericValue.toString()
      };
      
      await axios.post(getNgrokUrl('/trans_desc'), payload);
      
      // Update state
      setTransfersWithDescriptions(prevTransfers => 
        prevTransfers.map(transfer => {
          if (transfer.sourceId === activeTransferId) {
            return {
              ...transfer,
              manualDescriptions: [
                ...transfer.manualDescriptions,
                {
                  description: newDescription,
                  value: numericValue,
                  source_id: activeTransferId,
                  seller_id: sellerId
                }
              ]
            };
          }
          return transfer;
        })
      );
      
      toast.success("Descrição adicionada com sucesso");
      setNewDescription("");
      setNewValue("");
      setDescriptionDialogOpen(false);
    } catch (error) {
      console.error("Error adding description:", error);
      toast.error("Falha ao adicionar descrição");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDescription = async (transferId: string, description: TransferDescription) => {
    if (!sellerId) return;
    
    setIsLoading(true);
    try {
      // Delete from API
      const payload = {
        seller_id: sellerId,
        source_id: transferId,
        descricao: description.description,
        valor: description.value.toString()
      };
      
      await axios.delete(getNgrokUrl('/trans_desc'), { data: payload });
      
      // Update state
      setTransfersWithDescriptions(prevTransfers => 
        prevTransfers.map(transfer => {
          if (transfer.sourceId === transferId) {
            return {
              ...transfer,
              manualDescriptions: transfer.manualDescriptions.filter(
                desc => desc.description !== description.description || desc.value !== description.value
              )
            };
          }
          return transfer;
        })
      );
      
      toast.success("Descrição removida com sucesso");
    } catch (error) {
      console.error("Error removing description:", error);
      toast.error("Falha ao remover descrição");
    } finally {
      setIsLoading(false);
    }
  };

  // Group transfers by description for summary
  const transfersByDescription = transfersWithDescriptions.reduce((acc: Record<string, number>, transfer) => {
    const description = transfer.description || 'Sem descrição';
    if (!acc[description]) acc[description] = 0;
    acc[description] += transfer.amount;
    return acc;
  }, {});

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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => {
                    setActiveTransferId(transaction.sourceId);
                    setDescriptionDialogOpen(true);
                  }}
                >
                  Adicionar Descrição
                </Button>
              )}
            />
          </div>
        </div>

        {/* Description Dialog */}
        <AlertDialog open={descriptionDialogOpen} onOpenChange={setDescriptionDialogOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Adicionar Descrição</AlertDialogTitle>
              <AlertDialogDescription>
                {activeTransferId && (
                  <p className="text-sm text-muted-foreground mb-4">
                    SOURCE_ID: {activeTransferId}
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição:</label>
                <Textarea
                  placeholder="Descrição"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor:</label>
                <Input
                  type="number"
                  placeholder="Valor"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>
              
              {/* Display existing descriptions */}
              {activeTransferId && transfersWithDescriptions.find(t => t.sourceId === activeTransferId)?.manualDescriptions.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-sm font-medium mb-2">Descrições adicionadas:</h5>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {transfersWithDescriptions
                      .find(t => t.sourceId === activeTransferId)
                      ?.manualDescriptions.map((desc, idx) => (
                        <div key={idx} className="text-sm flex justify-between items-center p-2 bg-secondary/20 rounded-md">
                          <div className="flex-1 mr-2">
                            <p className="font-medium">{desc.description}</p>
                            <Badge variant={desc.value < 0 ? "destructive" : "default"} className="mt-1">
                              {formatCurrency(desc.value)}
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveDescription(activeTransferId, desc)}
                            className="h-8 w-8"
                            disabled={isLoading}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setNewDescription("");
                setNewValue("");
              }} disabled={isLoading}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleAddDescription} disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};
