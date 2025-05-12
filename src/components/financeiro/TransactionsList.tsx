
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { FileBarChart } from "lucide-react";

interface TransferDescription {
  description: string;
  value: number;
}

interface Transaction {
  date: string;
  sourceId: string;
  descriptions: string[];
  group: string;
  value: number;
  totalDeclared?: number;
  manualDescriptions?: TransferDescription[];
}

interface TransactionsListProps {
  transactions: Transaction[];
  renderActions?: (transaction: Transaction) => React.ReactNode;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ 
  transactions,
  renderActions 
}) => {
  // Function to format the date to a readable format
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString('pt-BR', { 
        dateStyle: 'short', 
        timeStyle: 'short' 
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5" />
          <CardTitle>Lista de Transações</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhuma transação encontrada. Insira dados de liberação para visualizar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e hora</TableHead>
                  <TableHead>SOURCE_ID</TableHead>
                  <TableHead>Descrições</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Total Declarado</TableHead>
                  {renderActions && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={`${transaction.sourceId}-${index}`}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.sourceId}</TableCell>
                    <TableCell>{transaction.descriptions.join('/')}</TableCell>
                    <TableCell>{transaction.group}</TableCell>
                    <TableCell className={`text-right ${transaction.value < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(transaction.value)}
                    </TableCell>
                    <TableCell className={`text-right ${(transaction.totalDeclared || 0) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(transaction.totalDeclared || 0)}
                    </TableCell>
                    {renderActions && (
                      <TableCell className="text-right">
                        {renderActions(transaction)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
