
import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import initSqlJs from 'sql.js';

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
  const [db, setDb] = useState<any>(null);

  // MySQL connection string (WARNING: This is extremely insecure for production)
  const connectionString = 'mysql://y0pxd1g143rqh6op:yfpdemk5z2hhczyd@lmag6s0zwmcswp5w.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/p4zb0v2reda2hbui';

  useEffect(() => {
    initializeSqlJs();
  }, []);

  useEffect(() => {
    if (db) {
      fetchInitialData();
    }
  }, [db]);

  useEffect(() => {
    if (selectedTable && db) {
      fetchTableDetails(selectedTable);
    }
  }, [selectedTable, db]);

  const initializeSqlJs = async () => {
    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      
      // Create a new database instance
      const database = new SQL.Database();
      setDb(database);
      
      // Let the user know we're connected (this is a simplified version and doesn't actually connect to MySQL)
      console.log('SQL.js initialized successfully');
      toast.success('SQL.js inicializado com sucesso');
      
      // Parse the connection string (for demonstration only)
      const connectionParts = connectionString.replace('mysql://', '').split('@');
      const credentials = connectionParts[0].split(':');
      const user = credentials[0];
      const password = credentials[1];
      const hostPort = connectionParts[1].split('/')[0].split(':');
      const host = hostPort[0];
      const port = hostPort[1];
      const dbName = connectionParts[1].split('/')[1];
      
      console.log(`Connection info (demo only): ${user}@${host}:${port}/${dbName}`);
      
    } catch (err) {
      console.error('Error initializing SQL.js:', err);
      setError('Erro ao inicializar SQL.js. Verifique o console para mais detalhes.');
      toast.error('Falha ao inicializar SQL.js');
      setIsLoading(false);
    }
  };

  const fetchInitialData = () => {
    setIsLoading(true);
    try {
      // Simulate fetching tables (since SQL.js can't directly connect to MySQL)
      // In a real implementation, we would be running the SHOW TABLES query against the MySQL server
      console.log('Fetching tables (simulated)...');
      
      // For demonstration purposes, let's create some mock tables
      const mockTables = [
        { TABLE_NAME: 'users' },
        { TABLE_NAME: 'products' },
        { TABLE_NAME: 'orders' },
        { TABLE_NAME: 'categories' }
      ];
      
      setTables(mockTables);
      
      if (mockTables.length > 0) {
        setSelectedTable(mockTables[0].TABLE_NAME);
      }
      
      toast.success('Tabelas carregadas com sucesso (simulado)');
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Erro ao buscar tabelas. Verifique o console para mais detalhes.');
      toast.error('Falha ao carregar tabelas do banco de dados');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableDetails = (tableName: string) => {
    setIsLoading(true);
    try {
      console.log(`Fetching details for table: ${tableName} (simulated)`);
      
      // Simulate structure for different tables
      let mockColumns: ColumnInfo[] = [];
      let mockData: TableData[] = [];
      
      if (tableName === 'users') {
        mockColumns = [
          { Field: 'id', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
          { Field: 'name', Type: 'varchar(255)', Null: 'NO', Key: '', Default: null, Extra: '' },
          { Field: 'email', Type: 'varchar(255)', Null: 'NO', Key: 'UNI', Default: null, Extra: '' },
          { Field: 'created_at', Type: 'timestamp', Null: 'NO', Key: '', Default: 'CURRENT_TIMESTAMP', Extra: '' }
        ];
        
        mockData = [
          { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2023-01-01 12:00:00' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2023-01-02 10:30:00' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2023-01-03 15:45:00' }
        ];
      } else if (tableName === 'products') {
        mockColumns = [
          { Field: 'id', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
          { Field: 'name', Type: 'varchar(255)', Null: 'NO', Key: '', Default: null, Extra: '' },
          { Field: 'price', Type: 'decimal(10,2)', Null: 'NO', Key: '', Default: null, Extra: '' },
          { Field: 'stock', Type: 'int(11)', Null: 'NO', Key: '', Default: '0', Extra: '' },
          { Field: 'category_id', Type: 'int(11)', Null: 'YES', Key: 'MUL', Default: null, Extra: '' }
        ];
        
        mockData = [
          { id: 1, name: 'Laptop', price: 1299.99, stock: 50, category_id: 1 },
          { id: 2, name: 'Smartphone', price: 699.99, stock: 100, category_id: 1 },
          { id: 3, name: 'Headphones', price: 149.99, stock: 200, category_id: 2 }
        ];
      } else if (tableName === 'orders') {
        mockColumns = [
          { Field: 'id', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
          { Field: 'user_id', Type: 'int(11)', Null: 'NO', Key: 'MUL', Default: null, Extra: '' },
          { Field: 'total', Type: 'decimal(10,2)', Null: 'NO', Key: '', Default: null, Extra: '' },
          { Field: 'status', Type: 'varchar(50)', Null: 'NO', Key: '', Default: 'pending', Extra: '' },
          { Field: 'created_at', Type: 'timestamp', Null: 'NO', Key: '', Default: 'CURRENT_TIMESTAMP', Extra: '' }
        ];
        
        mockData = [
          { id: 1, user_id: 1, total: 2149.97, status: 'completed', created_at: '2023-02-01 09:15:00' },
          { id: 2, user_id: 2, total: 699.99, status: 'processing', created_at: '2023-02-05 14:20:00' },
          { id: 3, user_id: 1, total: 149.99, status: 'completed', created_at: '2023-02-10 11:30:00' }
        ];
      } else if (tableName === 'categories') {
        mockColumns = [
          { Field: 'id', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
          { Field: 'name', Type: 'varchar(100)', Null: 'NO', Key: 'UNI', Default: null, Extra: '' },
          { Field: 'description', Type: 'text', Null: 'YES', Key: '', Default: null, Extra: '' }
        ];
        
        mockData = [
          { id: 1, name: 'Electronics', description: 'Electronic devices and gadgets' },
          { id: 2, name: 'Accessories', description: 'Accessories for electronic devices' },
          { id: 3, name: 'Furniture', description: 'Home and office furniture' }
        ];
      }
      
      setColumns(mockColumns);
      setData(mockData);
      
    } catch (err) {
      console.error('Error fetching table details:', err);
      setError('Erro ao buscar detalhes da tabela');
      toast.error('Falha ao carregar estrutura ou dados da tabela');
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuery = () => {
    if (!query.trim()) {
      toast.warning('Por favor, insira uma consulta SQL');
      return;
    }

    setIsQueryLoading(true);
    try {
      console.log('Executing query:', query);
      
      // Parse the query to determine if it's a SELECT or another type
      const isSelect = query.trim().toUpperCase().startsWith('SELECT');
      
      let results: any[] = [];
      let fields: any[] = [];
      let affectedRows = 0;
      
      // Simulate query execution based on the query text
      if (query.includes('users') || query.includes('USER')) {
        results = [
          { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2023-01-01 12:00:00' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2023-01-02 10:30:00' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2023-01-03 15:45:00' }
        ];
        fields = [
          { name: 'id' },
          { name: 'name' },
          { name: 'email' },
          { name: 'created_at' }
        ];
      } else if (query.includes('products') || query.includes('PRODUCT')) {
        results = [
          { id: 1, name: 'Laptop', price: 1299.99, stock: 50, category_id: 1 },
          { id: 2, name: 'Smartphone', price: 699.99, stock: 100, category_id: 1 },
          { id: 3, name: 'Headphones', price: 149.99, stock: 200, category_id: 2 }
        ];
        fields = [
          { name: 'id' },
          { name: 'name' },
          { name: 'price' },
          { name: 'stock' },
          { name: 'category_id' }
        ];
      } else if (!isSelect) {
        // For non-SELECT queries, simulate affected rows
        affectedRows = Math.floor(Math.random() * 10) + 1;
      } else {
        // Generic result for other queries
        results = [{ result: 'Simulated query result' }];
        fields = [{ name: 'result' }];
      }
      
      setQueryResult({
        isSelect,
        results,
        fields,
        affectedRows
      });
      
      toast.success('Consulta executada com sucesso (simulado)');
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
        <h1 className="text-3xl font-bold mb-8">Desenvolvedor SQL (Modo de Teste)</h1>
        <div className="flex justify-center items-center h-40">
          <p>Inicializando SQL.js e carregando dados simulados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Desenvolvedor SQL (Modo de Teste)</h1>
      <p className="text-red-500 mb-8">ATENÇÃO: Esta versão utiliza SQL.js com dados simulados apenas para fins de demonstração.</p>
      
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
            <DialogTitle>Consulta SQL (Modo de Teste)</DialogTitle>
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
