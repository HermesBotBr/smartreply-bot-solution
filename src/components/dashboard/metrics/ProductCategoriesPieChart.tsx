
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductCategory {
  name: string;
  value: number;
}

interface ProductCategoriesPieChartProps {
  data: ProductCategory[];
}

const randomColors = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
];

const ProductCategoriesPieChart: React.FC<ProductCategoriesPieChartProps> = ({ data }) => {
  return (
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
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={randomColors[index % randomColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} vendas`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCategoriesPieChart;
