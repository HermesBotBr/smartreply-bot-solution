
import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import axios from 'axios';
import { toast } from "sonner";

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
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableDetails(selectedTable);
    }
  }, [selectedTable]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/db/tables');
      console.log('Tables response:', response.data);
      
      if (response.data && response.data.tables) {
        setTables(response.data.tables);
        
        if (response.data.tables.length > 0) {
          setSelectedTable(response.data.tables[0].TABLE_NAME);
        }
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Erro ao buscar tabelas. Verifique o console para mais detalhes.');
      toast.error('Falha ao carregar tabelas do banco de dados');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableDetails = async (tableName: string) => {
    setIsLoading(true);
    try {
      // Buscar estrutura da tabela
      const columnsResponse = await axios.get(`/api/db/columns?table=${tableName}`);
      setColumns(columnsResponse.data.columns);
      
      // Buscar dados da tabela
      const dataResponse = await axios.get(`/api/db/data?table=${tableName}`);
      setData(dataResponse.data.data);
    } catch (err) {
      console.error('Error fetching table details:', err);
      setError('Erro ao buscar detalhes da tabela');
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
      const response = await axios.post('/api/db/query', { query });
      setQueryResult(response.data);
      toast.success('Consulta executada com sucesso');
    } catch (err) {
      console.error('Error executing query:', err);
      setError('Erro ao executar consulta');
      toast.error('Falha ao executar consulta SQL');
    } finally {
      setIsQueryLoading(false);
    }
  };

  if (isLoading && tables.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Desenvolvedor SQL</h1>
        <div className="flex justify-center items-center h-40">
          <p>Carregando tabelas do banco de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Desenvolvedor SQL</h1>
      
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
              onClick={() => {
                executeQuery();
              }} 
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
