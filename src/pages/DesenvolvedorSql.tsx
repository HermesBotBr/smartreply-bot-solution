import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Interface definitions
interface TableInfo {
  TABLE_NAME: string;
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

// MySQL connection string
const CONNECTION_STRING = 'mysql://y0pxd1g143rqh6op:yfpdemk5z2hhczyd@lmag6s0zwmcswp5w.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/p4zb0v2reda2hbui';

const DesenvolvedorSql: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
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
      console.log('Fetching tables from API endpoint...');
      
      const response = await fetch('/api/db/tables');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response text:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received tables data:', data);
      
      const tablesData = data.tables || [];
      
      if (Array.isArray(tablesData)) {
        setTables(tablesData);
        
        if (tablesData.length > 0) {
          setSelectedTable(tablesData[0].TABLE_NAME);
        }
        
        toast.success('Tabelas carregadas com sucesso');
      } else {
        setTables([]);
        toast.error('Formato de resposta inválido');
        setError('Formato de resposta inválido ao carregar tabelas');
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(`Erro ao buscar tabelas: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      toast.error('Falha ao conectar à API de banco de dados');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableDetails = async (tableName: string) => {
    setIsLoading(true);
    try {
      console.log(`Fetching details for table: ${tableName}`);
      
      // Fetch columns
      const columnsResponse = await fetch(`/api/db/columns?table=${encodeURIComponent(tableName)}`);
      if (!columnsResponse.ok) {
        throw new Error(`HTTP error! Status: ${columnsResponse.status}`);
      }
      
      const columnsData = await columnsResponse.json();
      if (columnsData.columns && Array.isArray(columnsData.columns)) {
        setColumns(columnsData.columns);
      } else {
        setColumns([]);
      }
      
      // Fetch data
      const dataResponse = await fetch(`/api/db/data?table=${encodeURIComponent(tableName)}`);
      if (!dataResponse.ok) {
        throw new Error(`HTTP error! Status: ${dataResponse.status}`);
      }
      
      const tableData = await dataResponse.json();
      if (tableData.data && Array.isArray(tableData.data)) {
        setData(tableData.data);
      } else {
        setData([]);
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
      console.log('Executing query via API:', query);
      
      const response = await fetch('/api/db/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      const results = await response.json();
      
      if (results.isSelect) {
        // For SELECT queries
        setQueryResult({
          isSelect: true,
          fields: results.fields || [],
          results: results.results || []
        });
      } else {
        // For other queries (INSERT, UPDATE, DELETE)
        setQueryResult({
          isSelect: false,
          affectedRows: results.affectedRows || 0
        });
      }
      
      toast.success('Consulta executada com sucesso');
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
          <p>Conectando diretamente ao MySQL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Desenvolvedor SQL</h1>
      <p className="mb-4 text-gray-500">Conectado a: {CONNECTION_STRING}</p>
      
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Aviso de Segurança</AlertTitle>
        <AlertDescription>
          Esta página está tentando se conectar diretamente ao MySQL a partir do navegador, o que é inseguro e expõe as credenciais do banco de dados.
          Este é apenas um teste e não deve ser usado em produção.
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
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {tables.length === 0 ? (
                  <p>Nenhuma tabela encontrada.</p>
                ) : (
                  tables.map((table) => (
                    <Button
                      key={table.TABLE_NAME}
                      variant={selectedTable === table.TABLE_NAME ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedTable(table.TABLE_NAME)}
                    >
                      {table.TABLE_NAME}
                    </Button>
                  ))
                )}
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
                      {columns.length === 0 ? (
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
                {data.length === 0 ? (
                  <p>Nenhum dado encontrado nesta tabela.</p>
                ) : (
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
