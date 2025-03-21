
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

interface QuestionData {
  date: string;
  received: number;
  answered: number;
}

interface QuestionsLineChartProps {
  data: QuestionData[];
}

const QuestionsLineChart: React.FC<QuestionsLineChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perguntas por Dia</CardTitle>
        <CardDescription>Recebidas vs Respondidas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
  );
};

export default QuestionsLineChart;
