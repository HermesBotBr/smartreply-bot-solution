import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { getNgrokUrl } from "@/config/api";

interface TableInfo {
  name: string;
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

const API_BASE_URL = getNgrokUrl("/api/db");

const DesenvolvedorSql: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [data, setData] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQueryLoading, setIsQueryLoading] = useState<boolean>(false);
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableDetails(selectedTable);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching tables from external API...');
      console.log(`API URL: ${API_BASE_URL}/tables`);
      
      const response = await fetch(`${API_BASE_URL}/tables`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response text:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received tables data:', data);
      
      if (data && Array.isArray(data.tables)) {
        setTables(data.tables);
        
        if (data.tables.length > 0) {
          setSelectedTable(data.tables[0]);
        }
        
        toast.success('Tabelas carregadas com sucesso');
      } else {
        console.error('Invalid data structure:', data);
        setTables([]);
        toast.error('Formato de resposta inválido');
        setError('Formato de resposta inválido ao carregar tabelas');
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(`Erro ao buscar tabelas: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      toast.error('Falha ao conectar à API de banco de dados externa');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableDetails = async (tableName: string) => {
    setIsLoading(true);
    try {
      console.log(`Fetching details for table: ${tableName}`);
      
      const columnsResponse = await fetch(`${API_BASE_URL}/columns/${encodeURIComponent(tableName)}`);
      if (!columnsResponse.ok) {
        const errorText = await columnsResponse.text();
        console.error('Columns API Response text:', errorText);
        throw new Error(`HTTP error! Status: ${columnsResponse.status}`);
      }
      
      const columnsData = await columnsResponse.json();
      console.log('Received columns data:', columnsData);
      
      if (columnsData && Array.isArray(columnsData.columns)) {
        setColumns(columnsData.columns);
      } else {
        console.error('Invalid columns data structure:', columnsData);
        setColumns([]);
        toast.warning('Estrutura de colunas não encontrada ou inválida');
      }
      
      const dataResponse = await fetch(`${API_BASE_URL}/rows/${encodeURIComponent(tableName)}?limit=100`);
      if (!dataResponse.ok) {
        const errorText = await dataResponse.text();
        console.error('Rows API Response text:', errorText);
        throw new Error(`HTTP error! Status: ${dataResponse.status}`);
      }
      
      const tableData = await dataResponse.json();
      console.log('Received rows data:', tableData);
      
      if (tableData && Array.isArray(tableData.rows)) {
        setData(tableData.rows);
        if (tableData.rows.length === 0) {
          toast.info(`A tabela ${tableName} não possui dados para exibir`);
        }
      } else {
        console.error('Invalid rows data structure:', tableData);
        setData([]);
        toast.warning('Dados da tabela não encontrados ou formato inválido');
      }
      
    } catch (err) {
      console.error('Error fetching table details:', err);
      setError(`Erro ao buscar detalhes da tabela: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      toast.error('Falha ao carregar estrutura ou dados da tabela');
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
    try {
      console.log('Executing query via external API:', query);
      
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      const results = await response.json();
      console.log('Query results:', results);
      
      if (results.isSelect) {
        setQueryResult({
          isSelect: true,
          fields: results.fields || [],
          results: results.results || []
        });
        toast.success(`Consulta retornou ${results.results?.length || 0} resultados`);
      } else {
        setQueryResult({
          isSelect: false,
          affectedRows: results.affectedRows || 0
        });
        toast.success(`Consulta afetou ${results.affectedRows || 0} linha(s)`);
      }
    } catch (err) {
      console.error('Error executing query:', err);
      setError(`Erro ao executar consulta: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      toast.error(`Falha ao executar consulta SQL: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setIsQueryLoading(false);
    }
  };

  if (isLoading && tables.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Desenvolvedor SQL</h1>
        <div className="flex justify-center items-center h-40">
          <p>Conectando ao serviço MySQL externo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Desenvolvedor SQL</h1>
      <p className="mb-4 text-gray-500">Conectado a API externa: {API_BASE_URL}</p>
      
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Aviso de Segurança</AlertTitle>
        <AlertDescription>
          Esta página está se conectando a um serviço MySQL externo através de um API gateway.
          Os dados apresentados são reais e devem ser manipulados com cautela.
        </AlertDescription>
      </Alert>
      
      {error && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Tabelas</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsQueryDialogOpen(true)}>
                  Consulta SQL
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && tables.length > 0 ? (
                <div className="py-4">Carregando tabelas...</div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {tables.length === 0 ? (
                    <p>Nenhuma tabela encontrada.</p>
                  ) : (
                    tables.map((table, index) => (
                      <Button
                        key={index}
                        variant={selectedTable === table ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedTable(table)}
                      >
                        {table}
                      </Button>
                    ))
                  )}
                </div>
              )}
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
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">Carregando estrutura da tabela...</TableCell>
                        </TableRow>
                      ) : columns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">Nenhuma coluna encontrada</TableCell>
                        </TableRow>
                      ) : (
                        columns.map((column, index) => (
                          <TableRow key={index}>
                            <TableCell>{column.Field}</TableCell>
                            <TableCell>{column.Type}</TableCell>
                            <TableCell>{column.Null}</TableCell>
                            <TableCell>{column.Key}</TableCell>
                            <TableCell>{column.Default !== null ? column.Default : 'NULL'}</TableCell>
                            <TableCell>{column.Extra}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <h3 className="text-lg font-medium mb-2">Dados da Tabela</h3>
                {isLoading ? (
                  <div className="py-4">Carregando dados da tabela...</div>
                ) : data.length === 0 ? (
                  <p>Nenhum dado encontrado nesta tabela.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((column, index) => (
                            <TableHead key={index}>{column.Field}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {columns.map((column, colIndex) => (
                              <TableCell key={`${rowIndex}-${colIndex}`}>
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
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Consulta SQL</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesenvolvedorSql;
