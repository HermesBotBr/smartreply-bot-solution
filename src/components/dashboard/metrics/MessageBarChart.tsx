
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MessageData {
  date: string;
  total: number;
  automated: number;
}

interface MessageBarChartProps {
  data: MessageData[];
}

const MessageBarChart: React.FC<MessageBarChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mensagens por Dia</CardTitle>
        <CardDescription>Total vs Automáticas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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
  );
};

export default MessageBarChart;
