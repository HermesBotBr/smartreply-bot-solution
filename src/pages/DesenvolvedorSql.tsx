
import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getNgrokUrl } from "@/config/api";
import axios from 'axios';
import { toast } from "sonner";

interface TableInfo {
  tableName: string;
}

interface ColumnInfo {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

interface TableData {
  [key: string]: any;
}

const DesenvolvedorSql: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [data, setData] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQueryLoading, setIsQueryLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableColumns();
      fetchTableData();
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use local endpoint instead of hermesbot.com.br
      const response = await axios.get(getNgrokUrl('/api/db/tables'));
      console.log('Tables response:', response.data);
      setTables(response.data.tables);
      if (response.data.tables.length > 0) {
        setSelectedTable(response.data.tables[0].tableName);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Erro ao buscar tabelas. Verifique o console para mais detalhes.');
      toast.error('Falha ao carregar tabelas do banco de dados');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableColumns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use local endpoint instead of hermesbot.com.br
      const response = await axios.get(getNgrokUrl(`/api/db/columns?table=${selectedTable}`));
      console.log('Columns response:', response.data);
      setColumns(response.data.columns);
    } catch (err) {
      console.error('Error fetching columns:', err);
      setError('Erro ao buscar colunas. Verifique o console para mais detalhes.');
      toast.error('Falha ao carregar estrutura da tabela');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use local endpoint instead of hermesbot.com.br
      const response = await axios.get(getNgrokUrl(`/api/db/data?table=${selectedTable}`));
      console.log('Data response:', response.data);
      setData(response.data.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erro ao buscar dados. Verifique o console para mais detalhes.');
      toast.error('Falha ao carregar dados da tabela');
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.warning('Por favor, insira uma consulta SQL');
      return;
    }

    setIsQueryLoading(true);
    setError(null);
    try {
      // Use local endpoint instead of hermesbot.com.br
      const response = await axios.post(getNgrokUrl('/api/db/query'), { query });
      console.log('Query response:', response.data);
      setQueryResult(response.data);
      toast.success('Consulta executada com sucesso');
    } catch (err) {
      console.error('Error executing query:', err);
      setError('Erro ao executar consulta. Verifique o console para mais detalhes.');
      toast.error('Falha ao executar consulta SQL');
    } finally {
      setIsQueryLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Desenvolvedor SQL</h1>
      
      <Tabs defaultValue="explorer">
        <TabsList className="mb-6">
          <TabsTrigger value="explorer">Explorador de Tabelas</TabsTrigger>
          <TabsTrigger value="query">Consulta SQL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="explorer">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Carregando...</p>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-red-500">{error}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="md:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tabelas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tables.map((table) => (
                          <Button
                            key={table.tableName}
                            variant={selectedTable === table.tableName ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => setSelectedTable(table.tableName)}
                          >
                            {table.tableName}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="md:col-span-3">
                  {selectedTable && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Tabela: {selectedTable}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <h3 className="text-lg font-medium mb-2">Estrutura da Tabela</h3>
                        <div className="mb-6 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Campo</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Nulo</TableHead>
                                <TableHead>Chave</TableHead>
                                <TableHead>Padrão</TableHead>
                                <TableHead>Extra</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {columns.map((column, index) => (
                                <TableRow key={index}>
                                  <TableCell>{column.Field}</TableCell>
                                  <TableCell>{column.Type}</TableCell>
                                  <TableCell>{column.Null}</TableCell>
                                  <TableCell>{column.Key}</TableCell>
                                  <TableCell>{column.Default}</TableCell>
                                  <TableCell>{column.Extra}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <h3 className="text-lg font-medium mb-2">Dados da Tabela</h3>
                        {data.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {columns.map((column) => (
                                    <TableHead key={column.Field}>{column.Field}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data.map((row, rowIndex) => (
                                  <TableRow key={rowIndex}>
                                    {columns.map((column) => (
                                      <TableCell key={`${rowIndex}-${column.Field}`}>
                                        {row[column.Field] !== null && row[column.Field] !== undefined
                                          ? String(row[column.Field])
                                          : 'NULL'}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p>Nenhum dado encontrado nesta tabela.</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="query">
          <Card>
            <CardHeader>
              <CardTitle>Consulta SQL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Digite sua consulta SQL aqui..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <Button 
                  onClick={executeQuery} 
                  disabled={isQueryLoading}
                >
                  {isQueryLoading ? 'Executando...' : 'Executar Consulta'}
                </Button>
                
                {error && (
                  <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}
                
                {queryResult && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Resultado</h3>
                    
                    {queryResult.isSelect ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {queryResult.fields && queryResult.fields.map((field: any, index: number) => (
                                <TableHead key={index}>{field.name}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {queryResult.results && queryResult.results.map((row: any, rowIndex: number) => (
                              <TableRow key={rowIndex}>
                                {queryResult.fields.map((field: any, fieldIndex: number) => (
                                  <TableCell key={`${rowIndex}-${fieldIndex}`}>
                                    {row[field.name] !== null && row[field.name] !== undefined
                                      ? String(row[field.name])
                                      : 'NULL'}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="p-4 border border-green-300 bg-green-50 rounded-md">
                        <p className="text-green-600">
                          Consulta executada com sucesso. {queryResult.affectedRows} linha(s) afetada(s).
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesenvolvedorSql;
