
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  isLoading?: boolean;
  color?: string;
  className?: string;
  textColor?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading = false,
  color = 'bg-white',
  className = '',
  textColor = 'text-gray-900',
  change,
  changeType = 'neutral'
}: MetricCardProps) {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'bg-green-500 text-white';
    if (changeType === 'negative') return 'bg-red-500 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  return (
    <div className={`${className} border-r border-gray-200 px-6 py-4 flex-1 ${color}`}>
      <div className="flex flex-col">
        <h3 className="text-sm font-medium text-gray-500 flex items-center">
          {title}
          {Icon && <Icon className="h-4 w-4 ml-2 opacity-60" />}
        </h3>
        
        {isLoading ? (
          <div className="mt-2">
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
            {description && (
              <div className="h-4 w-32 bg-gray-100 animate-pulse rounded mt-1" />
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
            {change && (
              <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-flex items-center w-fit ${getChangeColor()}`}>
                {change}
              </span>
            )}
            {description && (
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
