import React, { useState } from 'react';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarRange } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({
  from: startDate ?? undefined,
  to: endDate ?? undefined,
});


  const formatDate = (date: Date | undefined) =>
    date ? format(date, 'dd/MM/yyyy') : 'Selecionar';

  const handleSelect = (value: { from?: Date; to?: Date } | undefined) => {
  if (value?.from && value?.to) {
    setRange(value);
    onStartDateChange(value.from);
    onEndDateChange(value.to);
  } else {
  // Limpa a seleção e permite uma nova seleção
  const reset = { from: undefined, to: undefined };
  setRange(reset);
  onStartDateChange(undefined);
  onEndDateChange(undefined);
}

};


  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            <span>
              {range.from && range.to
                ? `${formatDate(range.from)} até ${formatDate(range.to)}`
                : 'Data personalizada'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 space-y-4">
          <Calendar
  mode="range"
  selected={
    range.from || range.to ? range : undefined
  }
  onSelect={handleSelect}
  locale={ptBR}
/>

          <Button
            onClick={() => {
              onFilter();
              setOpen(false);
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            Aplicar Filtros
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
