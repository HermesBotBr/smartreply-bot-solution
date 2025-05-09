
import React, { useState, useEffect } from 'react';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarRange } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onFilter: () => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFilter,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(
    startDate && endDate
      ? {
          from: startDate,
          to: endDate,
        }
      : undefined
  );

  // Update range when props change
  useEffect(() => {
    if (startDate && endDate) {
      setRange({
        from: startDate,
        to: endDate,
      });
    }
  }, [startDate, endDate]);

  const formatDate = (date: Date | undefined) =>
    date ? format(date, 'dd/MM/yyyy') : 'Selecionar';

  const handleSelect = (value: DateRange | undefined) => {
    console.log("Date range selected:", value);
    setRange(value);
    
    if (value?.from) {
      onStartDateChange(value.from);
    } else {
      onStartDateChange(undefined);
    }
    
    if (value?.to) {
      onEndDateChange(value.to);
    } else {
      onEndDateChange(undefined);
    }
  };

  const handleApplyFilter = () => {
    console.log("Applying filter with range:", range);
    onFilter();
    setOpen(false);
  };

  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            <span>
              {range?.from && range?.to
                ? `${formatDate(range.from)} até ${formatDate(range.to)}`
                : 'Data personalizada'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 space-y-4">
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleSelect}
            locale={ptBR}
            className="pointer-events-auto"
          />

          <Button
            onClick={handleApplyFilter}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            Aplicar Filtros
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
