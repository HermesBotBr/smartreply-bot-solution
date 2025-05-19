
import React from 'react';
import { DateRangePicker } from './DateRangePicker';
import { cn } from '@/lib/utils';

interface DateRangeFilterSectionProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onFilter: () => void;
  className?: string;
  lastUpdateDate?: string | null; // New prop to receive the last update date
}

export function DateRangeFilterSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFilter,
  className,
  lastUpdateDate
}: DateRangeFilterSectionProps) {
  return (
    <div className={cn("mb-4", className)}>
      <h3 className="text-base font-medium text-gray-700 mb-2">Período de análise</h3>
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onFilter={onFilter}
      />
      {lastUpdateDate && (
        <p className="text-xs text-gray-400 mt-2">
          Última atualização de liberações: {lastUpdateDate}
        </p>
      )}
    </div>
  );
}
