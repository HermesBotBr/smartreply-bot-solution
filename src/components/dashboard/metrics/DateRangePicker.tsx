import React, { useState } from 'react';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarRange } from 'lucide-react';

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
  const [open, setOpen] = useState(false);

  const formatDate = (date: Date | undefined) =>
    date ? format(date, "dd/MM/yyyy") : "Selecionar";

  return (
    <div className="flex items-center space-x-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            <span>
              {startDate && endDate
                ? `${formatDate(startDate)} até ${formatDate(endDate)}`
                : "Data personalizada"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto flex flex-col sm:flex-row gap-4 p-4">
          <div>
            <div className="mb-1 text-sm text-gray-500">Data inicial</div>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              locale={ptBR}
            />
          </div>
          <div>
            <div className="mb-1 text-sm text-gray-500">Data final</div>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              locale={ptBR}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
