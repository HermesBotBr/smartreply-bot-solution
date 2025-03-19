import React, { useState, useEffect } from 'react';
import { getNgrokUrl } from '@/config/api';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ListingData = {
  anuncioId: string;
  vendas30Dias: string;
  problemas: string;
  reputationColor: string;
  reputationQuality: string;
  reputationScore: string;
  vendas6Meses: string;
  valor: string;
  reclamacoes: string;
};

type ReportData = {
  quantidadeVendas: string;
  quantidadeReclamacoes: string;
  percentualReclamacoes: string;
  insatisfacoes: string;
  quantidadeProblemasProduto: string;
  percentualInsatisfacao: string;
  analiseMotivosParte1: string;
  analiseMotivosParte2: string;
  analiseMotivosParte3: string;
  listaAnuncios: ListingData[];
  notaMediaExperiencia: string;
  pontoForteAtendimento: string;
  falhaEstrategiaAtual: string;
  estrategiaHermes: string;
  metaReducaoReclamacoes: string;
  impactoFaturamento: string;
  conclusao: string;
};

const Relatorio: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(getNgrokUrl('/r_geral.txt'));
        if (!response.ok) {
          throw new Error('Não foi possível carregar o relatório');
        }
        const textData = await response.text();
        const parsedData = parseReportData(textData);
        setReportData(parsedData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const parseReportData = (text: string): ReportData => {
    const data: Partial<ReportData> = {
      listaAnuncios: []
    };

    const quantidadeVendasMatch = text.match(/b1 - Quantidade de vendas analisadas:\s*Quantidade vendas:\s*(\d+)/);
    if (quantidadeVendasMatch) {
      data.quantidadeVendas = quantidadeVendasMatch[1];
    }

    const reclamacoesMatch = text.match(/b2 - Percentual de reclamações no Mercado Livre:\s*Quantidade reclamações:\s*(\d+)\s*Percentual reclamações\/vendas:\s*([^%\n]*%)/);
    if (reclamacoesMatch) {
      data.quantidadeReclamacoes = reclamacoesMatch[1];
      data.percentualReclamacoes = reclamacoesMatch[2];
    }

    const insatisfacoesMatch = text.match(/b3 - Conversão de clientes insatisfeitos em reclamações:\s*Insatisfações \(vendas com problema sem reclamação\):\s*(\d+)\s*Quantidade problemas com produto \(reclamações \+ insatisfações\):\s*(\d+)\s*Percentual insatisfação\/problemas com produto:\s*([^%\n]*%)/);
    if (insatisfacoesMatch) {
      data.insatisfacoes = insatisfacoesMatch[1];
      data.quantidadeProblemasProduto = insatisfacoesMatch[2];
      data.percentualInsatisfacao = insatisfacoesMatch[3];
    }

    const analiseParte1Match = text.match(/b4 - Análise dos motivos \(parte 1\):\s*Resposta GPT:\s*([\s\S]*?)(?=b4 - Análise dos motivos \(parte 2|$)/);
    if (analiseParte1Match) {
      data.analiseMotivosParte1 = analiseParte1Match[1].trim();
    }

    const analiseParte2Match = text.match(/b4 - Análise dos motivos \(parte 2 - problema no produto\):\s*Resposta GPT:\s*([\s\S]*?)(?=b4 - Análise dos motivos \(parte 3|$)/);
    if (analiseParte2Match) {
      data.analiseMotivosParte2 = analiseParte2Match[1].trim();
    }

    const analiseParte3Match = text.match(/b4 - Análise dos motivos \(parte 3 - falha no atendimento\):\s*Resposta GPT:\s*([\s\S]*?)(?=b5|$)/);
    if (analiseParte3Match) {
      data.analiseMotivosParte3 = analiseParte3Match[1].trim();
    }

    const anunciosSection = text.match(/b5 - Experiência de compra atual dos 10 maiores anúncios[^:]*:([\s\S]*?)(?=Nota média|$)/);
    if (anunciosSection) {
      const anunciosText = anunciosSection[1];
      const anunciosRegex = /(\d+) - anúncio (MLB\d+): (\d+) \| Problemas: (\d+) \| Reputation: ([^,]+), ([^,]+), (\d+) \| Vendas: (\d+) \| Valor: (R\$[^ ]+) \| Reclamações: ([^%\n]*%)/g;
      
      let match;
      while ((match = anunciosRegex.exec(anunciosText)) !== null) {
        data.listaAnuncios?.push({
          anuncioId: match[2],
          vendas30Dias: match[3],
          problemas: match[4],
          reputationColor: match[5],
          reputationQuality: match[6],
          reputationScore: match[7],
          vendas6Meses: match[8],
          valor: match[9],
          reclamacoes: match[10]
        });
      }
    }

    const notaMediaMatch = text.match(/Média das notas dos 10 primeiros anúncios: (\d+)/);
    if (notaMediaMatch) {
      data.notaMediaExperiencia = notaMediaMatch[1];
    } else {
      const oldFormatMatch = text.match(/Nota média de experiência de compra entre os anúncios: (\d+)/);
      if (oldFormatMatch) {
        data.notaMediaExperiencia = oldFormatMatch[1];
      }
    }

    const pontoForteMatch = text.match(/b6 - Estratégia de atendimento \(PONTO FORTE DO ATUAL ATENDIMENTO\):\s*Resposta GPT:\s*([\s\S]*?)(?=b6 - Estratégia de atendimento|$)/);
    if (pontoForteMatch) {
      data.pontoForteAtendimento = pontoForteMatch[1].trim();
    }

    const falhaEstrategiaMatch = text.match(/b6 - Estratégia de atendimento \(FALHA NA ESTRATÉGIA ATUAL\):\s*Resposta GPT:\s*([\s\S]*?)(?=b6 - Estratégia de atendimento|$)/);
    if (falhaEstrategiaMatch) {
      data.falhaEstrategiaAtual = falhaEstrategiaMatch[1].trim();
    }

    const estrategiaHermesMatch = text.match(/b6 - Estratégia de atendimento \(ESTRATÉGIA HERMES PARA REDUZIR AS RECLAMAÇÕES\):\s*Resposta GPT:\s*([\s\S]*?)(?=b6 - Estratégia de atendimento|$)/);
    if (estrategiaHermesMatch) {
      data.estrategiaHermes = estrategiaHermesMatch[1].trim();
    }

    const metaReducaoMatch = text.match(/b6 - Estratégia de atendimento \(META DE REDUÇÃO DE RECLAMAÇÕES\):\s*Resposta GPT:\s*([\s\S]*?)(?=b6 - Estratégia de atendimento|$)/);
    if (metaReducaoMatch) {
      data.metaReducaoReclamacoes = metaReducaoMatch[1].trim();
    }

    const impactoFaturamentoMatch = text.match(/b6 - Estratégia de atendimento \(IMPACTO NO FATURAMENTO\):\s*Resposta GPT:\s*([\s\S]*?)(?=b6 - Estratégia de atendimento|$)/);
    if (impactoFaturamentoMatch) {
      data.impactoFaturamento = impactoFaturamentoMatch[1].trim();
    }

    const conclusaoMatch = text.match(/b6 - Estratégia de atendimento \(CONCLUSÃO\):\s*Resposta GPT:\s*([\s\S]*?)($)/);
    if (conclusaoMatch) {
      data.conclusao = conclusaoMatch[1].trim();
    }

    return data as ReportData;
  };

  const getReputationColor = (color: string) => {
    switch (color.toLowerCase()) {
      case 'green':
        return 'bg-green-500';
      case 'orange':
        return 'bg-orange-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Carregando relatório...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-500">{error}</p>
        <p className="mt-2">Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <p className="text-lg">Não foi possível processar os dados do relatório.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Relatório de Desempenho no Mercado Livre</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Vendas Analisadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reportData.quantidadeVendas}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Reclamações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reportData.quantidadeReclamacoes}</p>
            <p className="text-sm text-gray-500">({reportData.percentualReclamacoes} das vendas)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Insatisfações Resolvidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reportData.insatisfacoes}</p>
            <p className="text-sm text-gray-500">({reportData.percentualInsatisfacao} dos problemas)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Problemas com Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reportData.quantidadeProblemasProduto}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="resumo" className="mb-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="analise">Análise de Motivos</TabsTrigger>
          <TabsTrigger value="anuncios">Desempenho de Anúncios</TabsTrigger>
          <TabsTrigger value="estrategia">Estratégia de Atendimento</TabsTrigger>
          <TabsTrigger value="impacto">Impacto e Metas</TabsTrigger>
          <TabsTrigger value="conclusao">Conclusão</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resumo" className="border rounded-md p-6">
          <h2 className="text-2xl font-bold mb-4">Resumo do Relatório</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Total de Vendas:</span>
                    <span className="font-semibold">{reportData.quantidadeVendas}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Total de Reclamações:</span>
                    <span className="font-semibold">{reportData.quantidadeReclamacoes}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Percentual de Reclamações:</span>
                    <span className="font-semibold">{reportData.percentualReclamacoes}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Insatisfações Resolvidas:</span>
                    <span className="font-semibold">{reportData.insatisfacoes}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Problemas Totais com Produtos:</span>
                    <span className="font-semibold">{reportData.quantidadeProblemasProduto}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Taxa de Resolução de Insatisfações:</span>
                    <span className="font-semibold">{reportData.percentualInsatisfacao}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Nota Média e Impacto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="mb-2">Nota Média de Experiência:</p>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-primary rounded-full h-4" 
                        style={{ width: `${Math.min(100, Number(reportData.notaMediaExperiencia))}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 font-bold">{reportData.notaMediaExperiencia}/100</span>
                  </div>
                </div>
                <p className="text-sm">{reportData.impactoFaturamento}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analise" className="border rounded-md p-6">
          <h2 className="text-2xl font-bold mb-4">Análise de Motivos</h2>
          <div className="space-y-6">
            {reportData.analiseMotivosParte1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Análise Geral</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{reportData.analiseMotivosParte1}</p>
                </CardContent>
              </Card>
            )}
            
            {reportData.analiseMotivosParte2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Problemas com Produto</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{reportData.analiseMotivosParte2}</p>
                </CardContent>
              </Card>
            )}
            
            {reportData.analiseMotivosParte3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Falhas no Atendimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{reportData.analiseMotivosParte3}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="anuncios" className="border rounded-md p-6">
          <h2 className="text-2xl font-bold mb-4">Desempenho dos Anúncios</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anúncio</TableHead>
                  <TableHead>Vendas (30d)</TableHead>
                  <TableHead>Problemas</TableHead>
                  <TableHead>Reputation</TableHead>
                  <TableHead>Vendas (6m)</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Reclamações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.listaAnuncios.map((anuncio, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <a 
                        href={`https://articulo.mercadolibre.com.br/${anuncio.anuncioId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {anuncio.anuncioId}
                      </a>
                    </TableCell>
                    <TableCell>{anuncio.vendas30Dias}</TableCell>
                    <TableCell>{anuncio.problemas}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span 
                          className={`inline-block w-3 h-3 rounded-full mr-2 ${getReputationColor(anuncio.reputationColor)}`}
                        ></span>
                        <span>{anuncio.reputationQuality} ({anuncio.reputationScore})</span>
                      </div>
                    </TableCell>
                    <TableCell>{anuncio.vendas6Meses}</TableCell>
                    <TableCell>{anuncio.valor}</TableCell>
                    <TableCell>{anuncio.reclamacoes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <p className="font-semibold">Nota média de experiência de compra: {reportData.notaMediaExperiencia}</p>
          </div>
        </TabsContent>
        
        <TabsContent value="estrategia" className="border rounded-md p-6">
          <h2 className="text-2xl font-bold mb-4">Estratégia de Atendimento</h2>
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Pontos Fortes do Atendimento Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="whitespace-pre-line">{reportData.pontoForteAtendimento}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                  Falhas na Estratégia Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="whitespace-pre-line">{reportData.falhaEstrategiaAtual}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="bg-blue-50">
                <CardTitle>Estratégia HermesBot para Reduzir Reclamações</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="whitespace-pre-line">{reportData.estrategiaHermes}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="impacto" className="border rounded-md p-6">
          <h2 className="text-2xl font-bold mb-4">Impacto e Metas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Meta de Redução de Reclamações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{reportData.metaReducaoReclamacoes}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Impacto no Faturamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{reportData.impactoFaturamento}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="conclusao" className="border rounded-md p-6">
          <h2 className="text-2xl font-bold mb-4">Conclusão</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="whitespace-pre-line">{reportData.conclusao}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorio;
