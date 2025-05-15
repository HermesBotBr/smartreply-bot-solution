
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricDisplayProps {
  title: string;
  value: number;
  description?: string;
  onClick?: () => void;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  title,
  value,
  description,
  onClick
}) => {
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card 
      className={`w-full ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-2xl font-bold mb-1">{formatCurrency(value)}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </CardContent>
    </Card>
  );
};
