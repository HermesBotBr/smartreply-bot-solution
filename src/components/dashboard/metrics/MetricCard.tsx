
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  isLoading?: boolean;
  color?: string;
  className?: string;
  textColor?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading = false,
  color = 'bg-primary',
  className = '',
  textColor = 'text-white'
}: MetricCardProps) {
  return (
    <Card className={`overflow-hidden transition-all hover:scale-[1.02] ${className}`}>
      <div className={`p-4 ${color} ${textColor}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{title}</h3>
          <Icon className="h-5 w-5 opacity-80" />
        </div>
      </div>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
            {description && (
              <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
