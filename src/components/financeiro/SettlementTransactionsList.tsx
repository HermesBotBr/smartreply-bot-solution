
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { FileBarChart } from "lucide-react";

interface SettlementTransaction {
  date: string;
  sourceId: string;
  orderId: string;
  group: string;
  grossValue: number;
  netValue: number;
}

interface SettlementTransactionsListProps {
  transactions: SettlementTransaction[];
}

export const SettlementTransactionsList: React.FC<SettlementTransactionsListProps> = ({ transactions }) => {
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
          <CardTitle>Lista de Transações de Liquidação</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhuma transação encontrada. Insira dados de liquidação para visualizar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e hora</TableHead>
                  <TableHead>SOURCE_ID</TableHead>
                  <TableHead>ORDER_ID</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">Valor Repasse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={`${transaction.sourceId}-${index}`}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.sourceId}</TableCell>
                    <TableCell>{transaction.orderId}</TableCell>
                    <TableCell>{transaction.group}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transaction.grossValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transaction.netValue)}
                    </TableCell>
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
