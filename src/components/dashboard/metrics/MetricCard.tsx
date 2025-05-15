
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  textColor?: string;
  onClick?: () => void;
  alertStatus?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  className = '',
  textColor = 'text-gray-800',
  onClick,
  alertStatus,
}) => {
  return (
    <Card 
      className={`overflow-hidden transition-shadow hover:shadow-lg duration-300 ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <h3 className={`font-medium mb-2 ${textColor}`}>{title}</h3>
          {icon && <div className="text-gray-500">{icon}</div>}
          {alertStatus && <AlertCircle className="h-4 w-4 text-amber-500 ml-2" />}
        </div>
        <p className={`text-2xl font-bold mb-1 ${textColor}`}>{value}</p>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
