
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SettlementTransaction } from '@/hooks/useSettlementData';

export interface TransactionsListProps {
  transactions: SettlementTransaction[];
  startDate?: Date;
  endDate?: Date;
  renderActions?: (transaction: SettlementTransaction) => React.ReactNode;
  showFooterTotals?: boolean;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ 
  transactions,
  startDate,
  endDate,
  renderActions,
  showFooterTotals = false
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
                  {renderActions && <TableHead>Ações</TableHead>}
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
                    {renderActions && (
                      <TableCell>
                        {renderActions(transaction)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
              {showFooterTotals && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>Totais</TableCell>
                    <TableCell>
                      {transactions.reduce((sum, t) => sum + (t.units || 0), 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        transactions.reduce((sum, t) => sum + t.grossValue, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        transactions.reduce((sum, t) => sum + t.netValue, 0)
                      )}
                    </TableCell>
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
