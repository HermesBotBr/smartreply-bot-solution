
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
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading = false,
  color = 'bg-white',
  className = '',
  textColor = 'text-gray-800', // Changed default from 'text-white' to 'text-gray-800'
  change,
  changeType = 'neutral',
  onClick
}: MetricCardProps) {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'bg-green-500 text-white';
    if (changeType === 'negative') return 'bg-red-500 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  return (
    <div 
      className={`${className} rounded-xl shadow-lg overflow-hidden ${color}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <h3 className={`text-sm font-medium opacity-90 ${textColor}`}>
            {title}
          </h3>
          {Icon && <Icon className={`h-5 w-5 ${textColor} opacity-75`} />}
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-8 bg-gray-200/20 animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-gray-200/20 animate-pulse rounded" />
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-between">
            <div className="mb-2">
              <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
              {change && (
                <span className={`text-xs px-2 py-1 rounded mt-2 inline-flex items-center ${getChangeColor()}`}>
                  {change}
                </span>
              )}
            </div>
            {description && (
              <p className={`text-sm mt-2 ${textColor} opacity-75`}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
