
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { FileBarChart, AlertCircle } from "lucide-react";

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
  showFooterTotals?: boolean;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ 
  transactions,
  renderActions,
  showFooterTotals = false
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

  // Calculate totals for the footer if enabled
  const calculateTotals = () => {
    let totalValue = 0;
    let totalDeclared = 0;

    transactions.forEach(transaction => {
      totalValue += transaction.value;
      totalDeclared += transaction.totalDeclared || 0;
    });

    const difference = totalValue + totalDeclared;
    const isBalanced = Math.abs(difference) < 0.01; // Consider small rounding errors as balanced

    return {
      totalValue,
      totalDeclared,
      difference,
      isBalanced
    };
  };

  const totals = showFooterTotals ? calculateTotals() : null;

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5" />
          <CardTitle>Lista de Transações</CardTitle>
          {totals && !totals.isBalanced && (
            <div className="ml-auto flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="ml-2 text-sm text-amber-500">Valores não balanceados</span>
            </div>
          )}
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
              {showFooterTotals && totals && (
                <TableFooter>
                  <TableRow className="border-t-2 border-gray-200 font-medium">
                    <TableCell colSpan={4} className="text-right">Total:</TableCell>
                    <TableCell className={`text-right ${totals.totalValue < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(totals.totalValue)}
                    </TableCell>
                    <TableCell className={`text-right ${totals.totalDeclared < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(totals.totalDeclared)}
                    </TableCell>
                    {renderActions && <TableCell />}
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right">Balanço (Valor + Declarado):</TableCell>
                    <TableCell colSpan={2} className={`text-right ${!totals.isBalanced ? 'text-amber-500 font-bold' : 'text-green-500'}`}>
                      {formatCurrency(totals.difference)}
                      {!totals.isBalanced && <span className="ml-2 inline-block">!</span>}
                    </TableCell>
                    {renderActions && <TableCell />}
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
