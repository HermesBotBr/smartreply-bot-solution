import React from 'react';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  return (
    <div className="w-full flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="mb-2 text-sm text-gray-500">Data inicial</div>
        <Calendar
          mode="single"
          selected={startDate}
          onSelect={onStartDateChange}
          locale={ptBR}
        />
      </div>
      <div className="flex-1">
        <div className="mb-2 text-sm text-gray-500">Data final</div>
        <Calendar
          mode="single"
          selected={endDate}
          onSelect={onEndDateChange}
          locale={ptBR}
        />
      </div>
    </div>
  );
}
