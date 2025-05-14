
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
  units?: number;
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
      if (!dateString) return 'Data não disponível';
      return new Date(dateString).toLocaleString('pt-BR', { 
        dateStyle: 'short', 
        timeStyle: 'short' 
      });
    } catch (e) {
      return dateString || 'Data não disponível';
    }
  };

  // Calculate totals for display at the bottom
  const totalUnits = transactions.reduce((sum, transaction) => sum + (transaction.units || 1), 0);
  const totalGrossValue = transactions.reduce((sum, transaction) => sum + transaction.grossValue, 0);
  const totalNetValue = transactions.reduce((sum, transaction) => sum + transaction.netValue, 0);

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            <CardTitle>Lista de Transações de Liquidação</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {transactions.length} transações
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhuma transação encontrada. Insira um período de análise válido para visualizar.
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
                  <TableHead>Unidades</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">Valor Repasse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow 
                    key={`${transaction.orderId}-${index}`}
                    className={transaction.grossValue <= 0 ? "bg-gray-50 text-gray-500" : ""}
                  >
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.sourceId || 'N/A'}</TableCell>
                    <TableCell>{transaction.orderId}</TableCell>
                    <TableCell>{transaction.group}</TableCell>
                    <TableCell>{transaction.units || 1}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transaction.grossValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transaction.netValue)}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Footer row with totals */}
                <TableRow className="font-bold bg-gray-100">
                  <TableCell colSpan={4} className="text-right">Totais:</TableCell>
                  <TableCell>{totalUnits}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalGrossValue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalNetValue)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
