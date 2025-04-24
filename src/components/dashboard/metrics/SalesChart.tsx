
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

// Sample data structure that would come from an API
interface ChartData {
  date: string;
  currentPeriodValue: number;
  previousPeriodValue?: number;
}

interface SalesChartProps {
  data: ChartData[];
  dataKey1: string;
  dataKey2?: string;
  title?: string;
  yAxisPrefix?: string;
}

const SalesChart: React.FC<SalesChartProps> = ({
  data,
  dataKey1,
  dataKey2,
  title,
  yAxisPrefix = ''
}) => {
  // Generate dummy data if real data is not available yet
  const dummyData = [
    { date: '17 de abr', currentPeriodValue: 525, previousPeriodValue: 300 },
    { date: '18 de abr', currentPeriodValue: 540, previousPeriodValue: 320 },
    { date: '19 de abr', currentPeriodValue: 530, previousPeriodValue: 350 },
    { date: '20 de abr', currentPeriodValue: 550, previousPeriodValue: 400 },
    { date: '21 de abr', currentPeriodValue: 555, previousPeriodValue: 450 },
    { date: '22 de abr', currentPeriodValue: 545, previousPeriodValue: 500 },
    { date: '23 de abr', currentPeriodValue: 540, previousPeriodValue: 550 },
    { date: '24 de abr', currentPeriodValue: 530, previousPeriodValue: 520 },
  ];

  const chartData = data.length > 0 ? data : dummyData;

  return (
    <div className="w-full h-full">
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis 
              tickFormatter={(value) => `${yAxisPrefix} ${value}`}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="currentPeriodValue"
              name={dataKey1}
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
              fill="#e0dbff"
            />
            {dataKey2 && (
              <Line
                type="monotone"
                dataKey="previousPeriodValue"
                name={dataKey2}
                stroke="#2dd4bf"
                strokeWidth={2}
                fill="#c2fdfa"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex mt-4 gap-4 justify-center">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
          <span className="text-sm">17 abr. a 24 abr. 2025</span>
        </div>
        {dataKey2 && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-teal-500 mr-2"></div>
            <span className="text-sm">9 abr. a 16 abr. 2025</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesChart;
