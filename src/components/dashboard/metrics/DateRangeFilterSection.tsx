import React from 'react';
import { DateRangePicker } from './DateRangePicker';

interface DateRangeFilterSectionProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onFilter: () => void;
}

export function DateRangeFilterSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFilter
}: DateRangeFilterSectionProps) {
  return (
    <div className="mb-4">
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
