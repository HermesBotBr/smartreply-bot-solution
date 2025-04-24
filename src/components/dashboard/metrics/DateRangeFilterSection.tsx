
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

import { subDays, endOfDay } from 'date-fns';

export function DateRangeFilterSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFilter
}: DateRangeFilterSectionProps) {
  const handlePresetSelect = (preset: string) => {
    const today = endOfDay(new Date());
    let newStartDate: Date;

    if (preset === 'last7') {
      newStartDate = subDays(today, 6);
    } else if (preset === 'last30') {
      newStartDate = subDays(today, 29);
    } else if (preset === 'last60') {
      newStartDate = subDays(today, 59);
    } else {
      return; // não altera datas se for personalizado
    }

    onStartDateChange(newStartDate);
    onEndDateChange(today);
  };

  return (
    <Card className="bg-white/50 backdrop-blur-sm shadow-lg mb-6 p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Período de análise</h3>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <DateRangePicker
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={onStartDateChange}
  onEndDateChange={onEndDateChange}
  onPresetSelect={handlePresetSelect}
/>

        </div>
        <Button 
          onClick={onFilter}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 transition-colors duration-200"
        >
          Aplicar Filtros
        </Button>
      </div>
    </Card>
  );
}
