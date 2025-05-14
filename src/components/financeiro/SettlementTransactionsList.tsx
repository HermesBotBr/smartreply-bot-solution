
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SettlementTransaction } from '@/hooks/useSettlementData';

export interface SettlementTransactionsListProps {
  transactions: SettlementTransaction[];
  startDate?: Date;
  endDate?: Date;
}

export const SettlementTransactionsList: React.FC<SettlementTransactionsListProps> = ({ 
  transactions,
  startDate,
  endDate
}) => {
  // Group transactions by date
  const groupedByDate = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, SettlementTransaction[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          Pagamentos Recebidos
          {startDate && endDate && (
            <span className="text-sm font-normal ml-2">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedByDate).length === 0 ? (
          <p className="text-muted-foreground">Nenhum pagamento encontrado no período selecionado.</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByDate).map(([date, dateTransactions]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold mb-2">{date}</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID da Ordem</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="text-right">Valor Bruto</TableHead>
                        <TableHead className="text-right">Valor Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dateTransactions.map((transaction, index) => (
                        <TableRow key={`${transaction.orderId}-${index}`}>
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
