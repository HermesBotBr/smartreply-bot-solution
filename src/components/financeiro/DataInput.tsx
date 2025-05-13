import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionsList } from './TransactionsList';
import { SettlementTransactionsList } from './SettlementTransactionsList';
import { useSettlementData } from '@/hooks/useSettlementData';
import { useMlToken } from '@/hooks/useMlToken';

interface SettlementTransaction {
  date: string;
  sourceId: string;
  orderId: string;
  group: string;
  units?: number;
  grossValue: number;
  netValue: number;
}

interface DataInputProps {
  settlementData: string;
  releaseData: string;
  onSettlementDataChange: (data: string) => void;
  onReleaseDataChange: (data: string) => void;
  startDate?: Date;
  endDate?: Date;
  settlementTransactions: SettlementTransaction[];
  settlementLoading: boolean;
}

export const DataInput: React.FC<DataInputProps> = ({ 
  settlementData,
  releaseData,
  onSettlementDataChange,
  onReleaseDataChange,
  startDate,
  endDate,
  settlementTransactions,
  settlementLoading
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleSettlementChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettlementDataChange(e.target.value);
  };

  const handleReleaseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onReleaseDataChange(e.target.value);
  };

  // Helper function to check if a date string is within the filter range
  const isDateInRange = (dateStr: string, startDate?: Date, endDate?: Date): boolean => {
    if (!startDate || !endDate || !dateStr) return true;
    
    try {
      const date = new Date(dateStr);
      // Set time to 00:00:00 for startDate and 23:59:59 for endDate for proper range comparison
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      return date >= start && date <= end;
    } catch (e) {
      console.error('Invalid date format:', dateStr);
      return false;
    }
  };

  useEffect(() => {
    if (releaseData) {
      const parsedTransactions = parseReleaseTransactions(releaseData, startDate, endDate);
      setTransactions(parsedTransactions);
    } else {
      setTransactions([]);
    }
  }, [releaseData, startDate, endDate]);

  const parseReleaseTransactions = (data: string, startDate?: Date, endDate?: Date): Transaction[] => {
    try {
      // Skip the first two lines (title and headers) and the last line (total)
      const lines = data.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 3) {
        return [];
      }

      // Skip the first two lines (release: and headers) and potentially the last line (total)
      const dataLines = lines.slice(2).filter(line => !line.startsWith(',,,total'));

      // Filter by date range if needed
      const filteredDataLines = dataLines.filter(line => {
        if (!line.trim()) return false;
        const columns = line.split(',');
        if (columns.length < 1) return false;
        
        // Skip initial_available_balance line
        if (columns.length >= 5 && columns[4].includes('initial_available_balance')) return false;
        
        // DATE is the 1st column (index 0)
        const dateStr = columns[0].trim();
        return isDateInRange(dateStr, startDate, endDate);
      });
      
      // Group operations by SOURCE_ID
      const operationsBySourceId: Record<string, {
        date: string;
        creditAmount: number;
        debitAmount: number;
        descriptions: Record<string, { creditCount: number; debitCount: number; }>;
        order: number; // To maintain original order
      }> = {};
      
      let operationOrder = 0;
      
      filteredDataLines.forEach(line => {
        if (!line.trim()) return;
        
        const columns = line.split(',');
        if (columns.length < 7) return;
        
        // Skip initial_available_balance line
        if (columns[4].includes('initial_available_balance')) return;
        
        // DATE is the 1st column (index 0)
        const date = columns[0].trim();
        // SOURCE_ID is the 2nd column (index 1)
        const sourceId = columns[1].trim();
        // DESCRIPTION is the 5th column (index 4)
        const description = columns[4].trim();
        // NET_CREDIT_AMOUNT is the 6th column (index 5)
        const creditAmount = parseFloat(columns[5].trim().replace(/"/g, '') || '0');
        // NET_DEBIT_AMOUNT is the 7th column (index 6)
        const debitAmount = parseFloat(columns[6].trim().replace(/"/g, '') || '0');
        
        if (!sourceId) return;
        
        if (!operationsBySourceId[sourceId]) {
          operationsBySourceId[sourceId] = {
            date,
            creditAmount: 0,
            debitAmount: 0,
            descriptions: {},
            order: operationOrder++
          };
        }
        
        operationsBySourceId[sourceId].creditAmount += isNaN(creditAmount) ? 0 : creditAmount;
        operationsBySourceId[sourceId].debitAmount += isNaN(debitAmount) ? 0 : debitAmount;
        
        if (!operationsBySourceId[sourceId].descriptions[description]) {
          operationsBySourceId[sourceId].descriptions[description] = {
            creditCount: 0,
            debitCount: 0
          };
        }
        
        if (creditAmount > 0) {
          operationsBySourceId[sourceId].descriptions[description].creditCount++;
        }
        
        if (debitAmount > 0) {
          operationsBySourceId[sourceId].descriptions[description].debitCount++;
        }
      });
      
      // Convert to array of transactions
      const result: Transaction[] = Object.entries(operationsBySourceId).map(([sourceId, operation]) => {
        const netAmount = operation.creditAmount - operation.debitAmount;
        
        // Determine the predominant description for this operation
        let predominantDescription = '';
        let maxCount = 0;
        const descriptionList: string[] = [];
        
        // If net amount is positive, look for predominant credit description
        // If net amount is negative, look for predominant debit description
        const descriptionEntries = Object.entries(operation.descriptions);
        
        if (netAmount >= 0) {
          descriptionEntries.forEach(([description, counts]) => {
            descriptionList.push(description);
            if (counts.creditCount > maxCount) {
              maxCount = counts.creditCount;
              predominantDescription = description;
            }
          });
        } else {
          descriptionEntries.forEach(([description, counts]) => {
            descriptionList.push(description);
            if (counts.debitCount > maxCount) {
              maxCount = counts.debitCount;
              predominantDescription = description;
            }
          });
        }
        
        // Categorize the operation based on the predominant description
        let group = "Outros";
        if (predominantDescription === 'payment') {
          group = "Liberação";
        } else if (['reserve_for_dispute', 'reserve_for_bpp_shipping_return', 'refund', 'reserve_for_refund', 'mediation'].includes(predominantDescription)) {
          group = "Reclamações";
        } else if (predominantDescription === 'reserve_for_debt_payment') {
          group = "Dívidas";
        } else if (['payout', 'reserve_for_payout'].includes(predominantDescription)) {
          group = "Transferências";
        } else if (predominantDescription === 'credit_payment') {
          group = "Cartão de Crédito";
        } else if (['shipping', 'cashback'].includes(predominantDescription)) {
          group = "Correção de Envios e Cashbacks";
        }

        return {
          date: operation.date,
          sourceId,
          descriptions: [...new Set(descriptionList)], // Remove duplicates
          group,
          value: netAmount
        };
      });
      
      // Sort by original order
      return result.sort((a, b) => {
        const orderA = operationsBySourceId[a.sourceId].order;
        const orderB = operationsBySourceId[b.sourceId].order;
        return orderA - orderB;
      });
    } catch (error) {
      console.error('Error parsing release transactions:', error);
      return [];
    }
  };

  return (
    <Tabs defaultValue="settlement" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="settlement">Dados de Liquidação</TabsTrigger>
        <TabsTrigger value="release">Dados de Liberações</TabsTrigger>
      </TabsList>
      
      <TabsContent value="settlement">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              <CardTitle>Entrada de Dados de Liquidação (Settlement)</CardTitle>
            </div>
            <CardDescription>
              Os dados de liquidação são carregados automaticamente do período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settlementLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Carregando dados do período selecionado...
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {settlementTransactions.length > 0 ? 
                  `${settlementTransactions.length} transações encontradas para o período selecionado` : 
                  "Nenhuma transação encontrada. Selecione um período válido para consultar."
                }
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display settlement transactions list */}
        <SettlementTransactionsList transactions={settlementTransactions} />
      </TabsContent>
      
      <TabsContent value="release">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              <CardTitle>Entrada de Dados de Liberações (Release)</CardTitle>
            </div>
            <CardDescription>
              Cole os dados do relatório de release no formato CSV abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={releaseData}
              onChange={handleReleaseChange}
              placeholder="release:
DATE,SOURCE_ID,EXTERNAL_REFERENCE,RECORD_TYPE,DESCRIPTION,NET_CREDIT_AMOUNT,NET_DEBIT_AMOUNT,ITEM_ID,SALE_DETAIL
..."
              className="min-h-[400px] font-mono text-sm"
            />
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Os dados serão processados para calcular valores liberados, reclamações, dívidas, transferências e pagamentos de cartão
            </div>
          </CardFooter>
        </Card>

        {/* Display transactions list */}
        <TransactionsList transactions={transactions} />
      </TabsContent>
    </Tabs>
  );
};
