
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, ShoppingBag, TrendingUp } from "lucide-react";
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const randomColors = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
];

const MetricsDisplay = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  // Simulated metrics fetching
  useEffect(() => {
    const generateFakeData = () => {
      // Last 7 days dates
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toLocaleDateString('pt-BR');
      }).reverse();

      // Message metrics
      const messageData = days.map(day => ({
        date: day,
        total: Math.floor(Math.random() * 30) + 5,
        automated: Math.floor(Math.random() * 20) + 5
      }));

      // Question metrics
      const questionData = days.map(day => ({
        date: day,
        received: Math.floor(Math.random() * 15) + 1,
        answered: Math.floor(Math.random() * 10) + 1
      }));

      // Sales metrics
      const salesData = days.map(day => ({
        date: day,
        value: Math.floor(Math.random() * 5000) + 1000
      }));

      // Product distribution
      const productCategories = [
        { name: 'Eletrônicos', value: Math.floor(Math.random() * 45) + 10 },
        { name: 'Casa', value: Math.floor(Math.random() * 30) + 10 },
        { name: 'Roupas', value: Math.floor(Math.random() * 25) + 5 },
        { name: 'Esporte', value: Math.floor(Math.random() * 20) + 5 },
        { name: 'Outros', value: Math.floor(Math.random() * 15) + 5 }
      ];

      return {
        summary: {
          totalMessages: messageData.reduce((acc, curr) => acc + curr.total, 0),
          totalQuestions: questionData.reduce((acc, curr) => acc + curr.received, 0),
          totalSales: Math.floor(Math.random() * 50) + 10,
          totalRevenue: salesData.reduce((acc, curr) => acc + curr.value, 0)
        },
        messageData,
        questionData,
        salesData,
        productCategories
      };
    };

    setTimeout(() => {
      setMetrics(generateFakeData());
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-white p-4">
        <h1 className="text-xl font-bold">Métricas e Estatísticas</h1>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex flex-col space-y-1">
                <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.summary.totalMessages}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex flex-col space-y-1">
                <CardTitle className="text-sm font-medium">Perguntas Recebidas</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.summary.totalQuestions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex flex-col space-y-1">
                <CardTitle className="text-sm font-medium">Vendas Realizadas</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </div>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.summary.totalSales}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex flex-col space-y-1">
                <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.summary.totalRevenue)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens por Dia</CardTitle>
              <CardDescription>Total vs Automáticas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.messageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total" fill="#0088FE" />
                    <Bar dataKey="automated" name="Automáticas" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Dia</CardTitle>
              <CardDescription>Valor em Reais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Valor" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Perguntas por Dia</CardTitle>
              <CardDescription>Recebidas vs Respondidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.questionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="received" name="Recebidas" stroke="#FF8042" />
                    <Line type="monotone" dataKey="answered" name="Respondidas" stroke="#FFBB28" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categorias</CardTitle>
              <CardDescription>Produtos mais vendidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.productCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics.productCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={randomColors[index % randomColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} vendas`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Dados gerados para demonstração. Em um ambiente de produção, estes seriam dados reais do Mercado Livre.</p>
        </div>
      </div>
    </div>
  );
};

export default MetricsDisplay;
