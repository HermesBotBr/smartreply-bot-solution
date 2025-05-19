
import React from 'react';
import { DateRangePicker } from './DateRangePicker';
import { cn } from '@/lib/utils';

interface DateRangeFilterSectionProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onFilter: () => void;
  className?: string; // Added className as an optional prop
}

export function DateRangeFilterSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFilter,
  className
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
    </div>
  );
}
