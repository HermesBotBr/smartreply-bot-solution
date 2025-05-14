
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import { ReleaseOperation } from '@/types/ReleaseOperation';
import { TransactionsList } from './TransactionsList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Trash } from 'lucide-react';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import { useMlToken } from '@/hooks/useMlToken';
import { ProductListingPopup } from './ProductListingPopup';
import { getNgrokUrl } from '@/config/api';

interface TransfersPopupProps {
  open: boolean;
  onClose: () => void;
  transfers: ReleaseOperation[];
  startDate?: Date;  // Adicionando data inicial do filtro
  endDate?: Date;    // Adicionando data final do filtro
}

interface TransferDescription {
  description: string;
  value: number;
}

interface TransferWithDescriptions extends ReleaseOperation {
  manualDescriptions: TransferDescription[];
}

interface ApiDescription {
  id: number;
  seller_id: string;
  source_id: string;
  descricao: string;
  valor: string;
}

// Define a transaction interface that matches what we're creating
interface TransferTransaction {
  date: string;
  sourceId: string;
  descriptions: string[];
  group: string;
  value: number;
  totalDeclared: number;
  manualDescriptions: TransferDescription[];
}

interface Product {
  mlb: string;
  title: string;
  image: string;
  active: boolean;
}

export const TransfersPopup: React.FC<TransfersPopupProps> = ({
  open,
  onClose,
  transfers,
  startDate,
  endDate
}) => {
  const [transfersWithDescriptions, setTransfersWithDescriptions] = useState<TransferWithDescriptions[]>([]);
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null);
  const [newDescription, setNewDescription] = useState("");
  const [newValue, setNewValue] = useState("");
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [productListingOpen, setProductListingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Obter o seller_id do usuário logado
  const mlToken = useMlToken();
  const sellerId = mlToken && typeof mlToken === 'object' && 'seller_id' in mlToken
    ? (mlToken as { seller_id: string }).seller_id
    : '681274853'; // ID padrão caso não encontre
  
  // Carregar descrições do endpoint quando o popup é aberto
  useEffect(() => {
    if (open) {
      fetchDescriptions();
    }
  }, [open]);
  
  // Atualizar a lista de transferências quando as transferências mudam
  useEffect(() => {
    console.log('Transfers received in TransfersPopup:', transfers);
    setTransfersWithDescriptions(
      transfers.map(transfer => ({
        ...transfer,
        manualDescriptions: []
      }))
    );
  }, [transfers]);

  // Buscar descrições da API
  const fetchDescriptions = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${getNgrokUrl('/trans_desc')}`, {
        params: {
          seller_id: sellerId
        }
      });
      const apiDescriptions: ApiDescription[] = response.data;
      
      // Mapear as descrições da API para o formato usado no componente
      setTransfersWithDescriptions(prevTransfers => 
        prevTransfers.map(transfer => {
          const sourceId = transfer.sourceId || '';
          const matchingDescriptions = apiDescriptions
            .filter(desc => desc.source_id === sourceId)
            .map(desc => ({
              description: desc.descricao,
              value: parseFloat(desc.valor)
            }));
          
          return {
            ...transfer,
            manualDescriptions: matchingDescriptions
          };
        })
      );
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao buscar descrições:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar descrições",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Lidar com seleção de produto
  const handleProductSelect = (product: Product, quantity: number) => {
    const productDescription = `Compra de mercadoria: ${quantity}x ${product.title} (${product.mlb})`;
    setNewDescription(productDescription);
    setProductListingOpen(false);
  };

  // Adicionar nova descrição
  const handleAddDescription = async () => {
    if (!activeTransferId || !newDescription.trim() || !newValue.trim()) return;
    
    const numericValue = parseFloat(newValue.replace(',', '.'));
    if (isNaN(numericValue)) return;
    
    try {
      setIsLoading(true);
      
      // Enviar descrição para a API
      await axios.post(getNgrokUrl('/trans_desc'), {
        seller_id: sellerId,
        source_id: activeTransferId,
        descricao: newDescription,
        valor: numericValue.toString()
      });
      
      // Atualizar estado local após o sucesso da API
      setTransfersWithDescriptions(prevTransfers => 
        prevTransfers.map(transfer => {
          if (transfer.sourceId === activeTransferId) {
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
      setDescriptionDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Descrição adicionada com sucesso",
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao salvar descrição:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar descrição",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Remover descrição
  const handleRemoveDescription = async (transferId: string, descriptionIndex: number) => {
    try {
      const transfer = transfersWithDescriptions.find(t => t.sourceId === transferId);
      if (!transfer) return;
      
      const descriptionToRemove = transfer.manualDescriptions[descriptionIndex];
      
      setIsLoading(true);
      
      // Remover descrição da API
      await axios.delete(getNgrokUrl('/trans_desc'), {
        data: {
          seller_id: sellerId,
          source_id: transferId,
          descricao: descriptionToRemove.description,
          valor: descriptionToRemove.value.toString()
        }
      });
      
      // Atualizar estado local após o sucesso da API
      setTransfersWithDescriptions(prevTransfers => 
        prevTransfers.map(transfer => {
          if (transfer.sourceId === transferId) {
            const updatedDescriptions = [...transfer.manualDescriptions];
            updatedDescriptions.splice(descriptionIndex, 1);
            
            return {
              ...transfer,
              manualDescriptions: updatedDescriptions
            };
          }
          return transfer;
        })
      );
      
      toast({
        title: "Sucesso",
        description: "Descrição removida com sucesso",
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao remover descrição:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover descrição",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Calculate declared total for a transfer
  const getDeclaredTotal = (transfer: TransferWithDescriptions) => {
    return transfer.manualDescriptions.reduce((sum, desc) => sum + desc.value, 0);
  };

  // Calculate declared total for a transaction
  const getTransactionDeclaredTotal = (transaction: TransferTransaction) => {
    return transaction.manualDescriptions?.reduce((sum, desc) => sum + desc.value, 0) || 0;
  };

  // Group transfers by description for summary
  const transfersByDescription = transfersWithDescriptions.reduce((acc: Record<string, number>, transfer) => {
    const description = transfer.description || 'Sem descrição';
    if (!acc[description]) acc[description] = 0;
    acc[description] += transfer.amount;
    return acc;
  }, {});

  // Convert to transactions for the TransactionsList component
  const transferTransactions: TransferTransaction[] = transfersWithDescriptions.map(transfer => {
    // Collect all descriptions
    const allDescriptions = [transfer.description || 'Transferência'];
    transfer.manualDescriptions.forEach(desc => {
      allDescriptions.push(desc.description);
    });
    
    // Calculate the total declared amount
    const totalDeclared = getDeclaredTotal(transfer);
    
    // Create a date object for the current day - simulate a date for the transfer
    // This ensures we have a valid date for the transaction list
    const currentDate = new Date().toISOString();
    
    return {
      date: currentDate,  // Use a valid date string instead of empty string
      sourceId: transfer.sourceId || '',
      descriptions: allDescriptions,
      group: 'Transferência',
      value: transfer.amount,
      totalDeclared: totalDeclared,
      manualDescriptions: transfer.manualDescriptions
    };
  });

  // Filtrar transações com base nas datas de início e fim
  const filteredTransactions = transferTransactions.filter(transaction => {
    // Se as datas não foram fornecidas, mostrar todas as transações
    if (!startDate || !endDate) return true;
    
    // Converter a string de data da transação para um objeto Date
    const transactionDate = new Date(transaction.date);
    
    // Definir hora, minuto, segundo e milissegundo para 0 para a data de início
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Definir hora, minuto, segundo e milissegundo para o final do dia para a data de fim
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Verificar se a data da transação está dentro do intervalo
    return transactionDate >= startOfDay && transactionDate <= endOfDay;
  });

  // Calculate summary values
  const calculateSummaryValues = () => {
    let totalValue = 0;
    let totalDeclared = 0;

    filteredTransactions.forEach(transaction => {
      totalValue += transaction.value;
      totalDeclared += getTransactionDeclaredTotal(transaction);
    });

    return {
      totalValue,
      totalDeclared,
      difference: totalValue + totalDeclared  // should be 0 if balanced
    };
  };

  const summary = calculateSummaryValues();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhamento de Transferências</DialogTitle>
          <DialogDescription>
            Lista de todas as transferências registradas no período selecionado
            {startDate && endDate && (
              <span className="block text-sm mt-1">
                Período: {startDate.toLocaleDateString('pt-BR')} até {endDate.toLocaleDateString('pt-BR')}
              </span>
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
            <TransactionsList 
              transactions={filteredTransactions}
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
              showFooterTotals={true}
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
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Descrição:</label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setProductListingOpen(true)}
                    className="ml-2"
                  >
                    Compra de mercadoria
                  </Button>
                </div>
                <Textarea
                  placeholder="Descrição"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="min-h-[80px]"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor:</label>
                <Input
                  type="number"
                  placeholder="Valor"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  disabled={isLoading}
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
                            onClick={() => handleRemoveDescription(activeTransferId, idx)}
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
              }}
              disabled={isLoading}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleAddDescription}
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Product Listing Dialog */}
        <ProductListingPopup 
          open={productListingOpen}
          onClose={() => setProductListingOpen(false)}
          sellerId={sellerId}
          onSelectProduct={handleProductSelect}
        />
      </DialogContent>
    </Dialog>
  );
};
