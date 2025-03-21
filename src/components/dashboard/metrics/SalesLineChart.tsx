
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SalesData {
  date: string;
  value: number;
}

interface SalesLineChartProps {
  data: SalesData[];
}

const SalesLineChart: React.FC<SalesLineChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas por Dia</CardTitle>
        <CardDescription>Valor em Reais</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
  );
};

export default SalesLineChart;
