
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SettlementTransaction } from '@/hooks/useSettlementData';

export interface TransactionsListProps {
  transactions: SettlementTransaction[];
  startDate?: Date;
  endDate?: Date;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ 
  transactions,
  startDate,
  endDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          Transações
          {startDate && endDate && (
            <span className="text-sm font-normal ml-2">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma transação encontrada no período selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>ID da Ordem</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">Valor Líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={`${transaction.orderId}-${index}`}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.orderId}</TableCell>
                    <TableCell>{transaction.title || 'N/A'}</TableCell>
                    <TableCell>{transaction.units}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.grossValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.netValue)}
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
