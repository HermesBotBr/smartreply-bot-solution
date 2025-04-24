
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <div className="bg-card p-4 rounded-lg mb-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">Período de análise</h3>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
        <Button variant="outline" onClick={onFilter}>
          Filtrar
        </Button>
      </div>
    </div>
  );
}
