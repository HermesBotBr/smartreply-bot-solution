
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import axios from 'axios';
import { ReleaseOperation } from '@/types/ReleaseOperation';

interface DRETableProps {
  grossSales: number;
  mlFees: number;
  repassePrevisto: number;
  reembolsos: number;
  vendasNaoLiberadas: number;
  cmv: number;
  publicidade: number;
  lucroProdutos: number;
  contestacoes: number;
  releaseOtherOperations: ReleaseOperation[];
  startDate?: Date;
  endDate?: Date;
  sellerId: string;
}

export const DRETable: React.FC<DRETableProps> = ({
  grossSales,
  mlFees,
  repassePrevisto,
  reembolsos,
  vendasNaoLiberadas,
  cmv,
  publicidade,
  lucroProdutos,
  contestacoes,
  releaseOtherOperations,
  startDate,
  endDate,
  sellerId
}) => {
  const [fixas, setFixas] = useState(0);
  const [variaveis, setVariaveis] = useState(0);

  useEffect(() => {
    const fetchDescriptions = async () => {
      console.log("🔁 Recalculando DRE com novas props...");

      try {
        const res = await axios.get(`https://projetohermes-dda7e0c8d836.herokuapp.com/trans_desc?seller_id=${sellerId}`);
        const data = res.data;

        const validSources = new Set(
          releaseOtherOperations
            .filter(op => {
              const d = op.date ? new Date(op.date) : null;
              return d && (!startDate || d >= startDate) && (!endDate || d <= endDate);
            })
            .map(op => op.sourceId)
        );

        let totalFixas = 0;
        let totalVariaveis = 0;

        data.forEach((desc: any) => {
          if (validSources.has(desc.source_id)) {
            const valor = parseFloat(desc.valor);
            if (desc.descricao.includes('$fixa$')) totalFixas += valor;
            else totalVariaveis += valor;
          }
        });

        setFixas(totalFixas);
        setVariaveis(totalVariaveis);
      } catch (err) {
        console.error('Erro ao buscar trans_desc para DRE:', err);
      }
    };

    fetchDescriptions();
  }, [releaseOtherOperations, startDate, endDate, sellerId]);

  const imposto = grossSales * 0.10;
  const lucroOperacional = lucroProdutos - fixas;
  const resultadoLiquido = lucroOperacional - variaveis - contestacoes;

  return (
    <Card className="p-6 bg-white shadow">
      <h3 className="text-xl font-bold mb-4">DRE - Demonstrativo de Resultados</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor (R$)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow><TableCell>Faturamento Bruto</TableCell><TableCell className="text-right">{formatCurrency(grossSales)}</TableCell></TableRow>
          <TableRow><TableCell>Taxas ML</TableCell><TableCell className="text-right">{formatCurrency(mlFees)}</TableCell></TableRow>
          <TableRow><TableCell>Repasse Previsto</TableCell><TableCell className="text-right">{formatCurrency(repassePrevisto)}</TableCell></TableRow>
          <TableRow><TableCell>Vendas Reembolsadas</TableCell><TableCell className="text-right">{formatCurrency(reembolsos)}</TableCell></TableRow>
          <TableRow><TableCell>Vendas Não Liberadas</TableCell><TableCell className="text-right">{formatCurrency(vendasNaoLiberadas)}</TableCell></TableRow>
          <TableRow><TableCell>CMV</TableCell><TableCell className="text-right">{formatCurrency(cmv)}</TableCell></TableRow>
          <TableRow><TableCell>Imposto (10%)</TableCell><TableCell className="text-right">{formatCurrency(imposto)}</TableCell></TableRow>
          <TableRow><TableCell>Publicidade</TableCell><TableCell className="text-right">{formatCurrency(publicidade)}</TableCell></TableRow>
          <TableRow><TableCell>Lucro sobre Produtos</TableCell><TableCell className="text-right">{formatCurrency(lucroProdutos)}</TableCell></TableRow>
          <TableRow><TableCell>Despesas Fixas</TableCell><TableCell className="text-right">{formatCurrency(fixas)}</TableCell></TableRow>
          <TableRow className="font-semibold"><TableCell>Lucro Operacional</TableCell><TableCell className="text-right">{formatCurrency(lucroOperacional)}</TableCell></TableRow>
          <TableRow><TableCell>Despesas Variáveis</TableCell><TableCell className="text-right">{formatCurrency(variaveis)}</TableCell></TableRow>
          <TableRow><TableCell>Prejuízo com Produtos e Vendas</TableCell><TableCell className="text-right">{formatCurrency(contestacoes)}</TableCell></TableRow>
          <TableRow className="font-bold text-green-800"><TableCell>Resultado Líquido do Exercício</TableCell><TableCell className="text-right">{formatCurrency(resultadoLiquido)}</TableCell></TableRow>
        </TableBody>
      </Table>
    </Card>
  );
};
